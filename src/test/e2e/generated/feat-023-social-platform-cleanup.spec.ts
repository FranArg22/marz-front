import { expect, getClerkSessionToken, test, TestUser } from '../fixtures'
import type { APIRequestContext, Page, TestInfo } from '@playwright/test'

const API_BASE_URL = (
  process.env.VITE_API_URL ??
  process.env.API_URL ??
  'http://localhost:8080'
).replace(/\/$/, '')
const TEST_SECRET =
  process.env.MARZ_TEST_SECRET ??
  process.env.TEST_API_SECRET ??
  'min-32-chars-long-secret-here'

const supportedPlatformLabels = ['Instagram', 'TikTok', 'YouTube']
const supportedPlatformValues = ['instagram', 'tiktok', 'youtube']

type ApiErrorEnvelope = {
  code?: string
  message?: string
  details?: Record<string, unknown>
  error?: ApiErrorEnvelope
}

type AuthedOptions = {
  method?: 'GET' | 'POST' | 'PATCH'
  data?: unknown
  workspaceId?: string
  idempotencyKey?: string
}

function extractApiError(raw: unknown): { code?: string; details?: Record<string, unknown> } {
  const body = (raw ?? {}) as ApiErrorEnvelope
  if (body.code) return { code: body.code, details: body.details }
  if (body.error?.code) return { code: body.error.code, details: body.error.details }
  return {}
}

function uniqueKey(testInfo: TestInfo, suffix: string) {
  return `${testInfo.workerIndex}-${Date.now().toString(36)}-${testInfo.retry}-${suffix}`
}

async function testApiPost<T>(request: APIRequestContext, path: string, data: unknown): Promise<T> {
  const response = await request.post(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'X-Test-Secret': TEST_SECRET,
    },
    data,
  })

  if (!response.ok()) {
    throw new Error(`Test API ${path} failed: ${response.status()} ${await response.text()}`)
  }

  return (await response.json()) as T
}

async function authedRequest(page: Page, path: string, options: AuthedOptions = {}) {
  const token = await getClerkSessionToken(page)
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  }
  if (options.data !== undefined) headers['Content-Type'] = 'application/json'
  if (options.workspaceId) headers['X-Brand-Workspace-Id'] = options.workspaceId
  if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey

  const method = options.method ?? 'GET'
  if (method === 'POST') {
    return page.request.post(`${API_BASE_URL}${path}`, { headers, data: options.data })
  }
  if (method === 'PATCH') {
    return page.request.patch(`${API_BASE_URL}${path}`, { headers, data: options.data })
  }
  return page.request.get(`${API_BASE_URL}${path}`, { headers })
}

async function getMe(page: Page) {
  const response = await authedRequest(page, '/v1/me')
  expect(response.ok()).toBeTruthy()
  return (await response.json()) as {
    id: string
    onboarding_status: string
    brand_workspace?: { id: string } | null
  }
}

function validCreatorPayload(platform: string, handle: string) {
  return {
    handle: `creator_${handle}`.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 50),
    display_name: 'Creator FEAT 023',
    bio: null,
    niches: ['fashion'],
    content_types: ['short_video'],
    country: 'AR',
    city: 'Buenos Aires',
    avatar_s3_key: 'avatars/feat023.jpg',
    birthday: '1995-06-15',
    whatsapp_e164: '+5491155555555',
    gender: null,
    experience_level: 'none',
    tier: 'growing',
    channels: [
      {
        platform,
        external_handle: handle,
        external_url: null,
        followers: null,
        verified: false,
        is_primary: true,
        rate_cards: [
          { format: platform === 'youtube' ? 'yt_short' : platform === 'tiktok' ? 'tiktok_post' : 'ig_reel', rate_amount: '100.00', rate_currency: 'USD' },
        ],
      },
    ],
    best_videos: [],
    referral_text: null,
  }
}

function validBrandPayload(source: string) {
  return {
    name: 'Brand FEAT 023',
    website_url: null,
    primary_color_hex: null,
    secondary_color_hex: null,
    brandfetch_snapshot: null,
    vertical: 'tech',
    marketing_objective: 'awareness',
    creator_experience: 'never',
    creator_sourcing_intent: 'already_have',
    monthly_budget_range: 'under_10k',
    timing: 'exploring',
    attribution: source === 'referral' ? { source, referral_text: 'Partner' } : { source },
    contact_name: 'Brand Owner',
    contact_title: 'CEO',
    contact_whatsapp_e164: '+5491155551234',
  }
}

function campaignBrief(platforms: string[]) {
  return {
    brief_source_url: 'https://example.com/feat-023-brief',
    brief_source_text: 'Campaign brief for FEAT-023 E2E',
    hard_filters: [],
    key_messages: ['Message'],
    do_list: [],
    dont_list: [],
    reference_links: [],
    icp_description: 'Creators for FEAT-023',
    icp_age_min: null,
    icp_age_max: null,
    icp_genders: [],
    icp_countries: ['AR'],
    icp_platforms: platforms,
    icp_interests: ['lifestyle'],
    scoring_dimensions: [],
    disqualifiers: [],
  }
}

function operationalTargeting() {
  return {
    countries: ['AR'],
    tiers: ['emergent'],
    follower_min: null,
    follower_max: null,
    genders: [],
    age_min: null,
    age_max: null,
    interests: ['lifestyle'],
    content_languages: ['es'],
    source: 'manual',
    adjusted_from_brief: false,
  }
}

function bonusConfig() {
  return {
    enabled: false,
    speed_bonus: { enabled: false, windows: [] },
    performance_bonus: { enabled: false, milestones: [] },
  }
}

async function seedCampaign(
  request: APIRequestContext,
  params: {
    brandWorkspaceId: string
    key: string
    platforms: string[]
    status?: 'draft' | 'active'
  },
) {
  return testApiPost<{
    campaign_id: string
    brand_workspace_id: string
    target_platforms?: string[]
    status: string
    read_dependencies?: unknown
  }>(request, '/v1/test/campaigns/campaigns/upsert', {
    brand_workspace_id: params.brandWorkspaceId,
    campaign_key: params.key,
    name: `FEAT-023 ${params.key}`,
    objective: 'brand_awareness',
    budget_amount: '1000',
    budget_currency: 'USD',
    deadline: '2026-12-31T00:00:00Z',
    status: params.status ?? 'draft',
    content_type: 'influencer_posts',
    pricing_model: 'fixed_per_video',
    target_platforms: params.platforms,
    configuration_current_step: 'review',
    configuration_completed_steps: ['content_type', 'pricing_model', 'targeting', 'bonus'],
    configuration_complete: true,
    configuration_version: 1,
    operational_targeting: operationalTargeting(),
    bonus_config: bonusConfig(),
    read_dependencies: true,
  })
}

async function seedParticipant(
  request: APIRequestContext,
  params: {
    campaignId: string
    brandWorkspaceId: string
    creatorAccountId: string
    platforms: string[]
    status?: string
  },
) {
  await testApiPost(request, '/v1/test/campaigns/participants/upsert', {
    campaign_id: params.campaignId,
    brand_workspace_id: params.brandWorkspaceId,
    creator_account_id: params.creatorAccountId,
    current_platforms: params.platforms,
    status: params.status ?? 'active',
    source: 'manual',
  })
}

async function seedVideo(
  request: APIRequestContext,
  params: {
    campaignId: string
    brandWorkspaceId: string
    creatorAccountId: string
    platform: string
    key: string
  },
) {
  await testApiPost(request, '/v1/test/deliverables/videos/upsert', {
    campaign_id: params.campaignId,
    brand_workspace_id: params.brandWorkspaceId,
    creator_account_id: params.creatorAccountId,
    platform: params.platform,
    fixture_key: params.key,
    url: `https://example.com/${params.key}`,
    status: 'link_approved',
    title: `Video ${params.platform}`,
  })
}

async function expectPlatformOptionsOnly(page: Page) {
  await page.getByRole('combobox').first().click()
  await expect(page.getByRole('option')).toHaveText(supportedPlatformLabels)
  await expect(page.getByRole('option', { name: /twitter|x|twitch/i })).toHaveCount(0)
  await page.keyboard.press('Escape')
}

function expectErrorValueContains(value: unknown, expected: string) {
  if (Array.isArray(value)) {
    expect(value).toEqual(expect.arrayContaining([expected]))
    return
  }
  expect(String(value ?? '')).toContain(expected)
}

async function expectValidationInvalidPlatform(response: Awaited<ReturnType<typeof authedRequest>>, value: string) {
  expect(response.status()).toBe(422)
  const { code, details } = extractApiError(await response.json())
  expect(code).toBe('validation.invalid_value')
  expect(String(details?.field ?? '')).toMatch(/platform|attribution/i)
  expectErrorValueContains(details?.value, value)
  expect(details?.allowed).toEqual(expect.arrayContaining(supportedPlatformValues))
  expect(details?.allowed).not.toEqual(expect.arrayContaining(['x', 'twitch', 'twitter_x']))
}

async function createAuxCreator(testInfo: TestInfo, suffix: string) {
  const key = uniqueKey(testInfo, suffix)
  const creator = new TestUser(
    `feat023_creator_${key}`,
    `feat023.creator.${key}+clerk_test@example.com`,
    'FEAT023 Creator',
  )
  await creator.ensureExists()
  await creator.onboardFull('creator')
  if (!creator.accountId) throw new Error('Expected creator account id')
  return creator
}

test.describe('FEAT-023 social platform cleanup', () => {
  test('ESC-1: creator cannot save Twitch as a creator channel', async ({ page, creatorOnboardingUser }) => {
    await creatorOnboardingUser.signIn(page)
    await page.goto('/onboarding/creator/channels')
    await page.getByRole('button', { name: /Agregar canal/i }).click()
    await expectPlatformOptionsOnly(page)

    const response = await authedRequest(page, '/v1/onboarding/creator:complete', {
      method: 'POST',
      data: validCreatorPayload('twitch', 'creator_fe23'),
    })

    await expectValidationInvalidPlatform(response, 'twitch')
    const me = await getMe(page)
    expect(me.onboarding_status).toBe('onboarding_pending')
    await expect(page.getByRole('button', { name: /Continuar/i })).toBeVisible()
  })

  test('ESC-2: creator happy-path with official platforms', async ({ page, creatorOnboardingUser }, testInfo) => {
    await creatorOnboardingUser.signIn(page)
    await page.goto('/onboarding/creator/channels')
    await page.getByRole('button', { name: /Agregar canal/i }).click()
    await expectPlatformOptionsOnly(page)

    const response = await authedRequest(page, '/v1/onboarding/creator:complete', {
      method: 'POST',
      data: validCreatorPayload('instagram', `creator_fe23_ig_${uniqueKey(testInfo, 'ig')}`),
    })

    expect(response.ok()).toBeTruthy()
    const me = await getMe(page)
    expect(me.onboarding_status).toBe('onboarded')
  })

  test('ESC-3: creator cannot save Twitter/X as a creator channel', async ({ page, creatorOnboardingUser }) => {
    await creatorOnboardingUser.signIn(page)
    await page.goto('/onboarding/creator/channels')
    await page.getByRole('button', { name: /Agregar canal/i }).click()
    await expectPlatformOptionsOnly(page)

    const response = await authedRequest(page, '/v1/onboarding/creator:complete', {
      method: 'POST',
      data: validCreatorPayload('twitter_x', 'creator_fe23_x'),
    })

    await expectValidationInvalidPlatform(response, 'twitter_x')
    const me = await getMe(page)
    expect(me.onboarding_status).toBe('onboarding_pending')
  })

  test('ESC-4: brand B11 attribution excludes Twitter/X and rejects twitter_x', async ({ page, brandOnboardingUser }) => {
    await brandOnboardingUser.signIn(page)
    await page.goto('/onboarding/brand/attribution')

    const sourceGroup = page.getByRole('radiogroup', { name: /Fuente/i })
    await expect(sourceGroup.getByRole('radio')).toHaveCount(7)
    await expect(sourceGroup.getByRole('radio', { name: /twitter|x/i })).toHaveCount(0)
    for (const label of ['Instagram', 'Referido', 'Búsqueda', 'Otro', 'TikTok', 'LinkedIn', 'Reddit']) {
      await expect(sourceGroup.getByRole('radio', { name: label })).toBeVisible()
    }

    const response = await authedRequest(page, '/v1/onboarding/brand:complete', {
      method: 'POST',
      data: validBrandPayload('twitter_x'),
    })

    expect(response.status()).toBe(422)
    const { code, details } = extractApiError(await response.json())
    expect(code).toBe('validation.invalid_value')
    expect(String(details?.field ?? '')).toMatch(/attribution/i)
    expect(details?.allowed).not.toEqual(expect.arrayContaining(['twitter_x']))
    const me = await getMe(page)
    expect(me.onboarding_status).toBe('onboarding_pending')
  })

  test('ESC-5: brand creates a campaign draft with official platforms and rejects X', async ({ page, onboardedBrandUser }, testInfo) => {
    await onboardedBrandUser.signIn(page)
    const me = await getMe(page)
    const workspaceId = me.brand_workspace?.id
    expect(workspaceId).toBeTruthy()

    const invalid = await authedRequest(page, '/v1/campaigns', {
      method: 'POST',
      workspaceId,
      data: {
        name: `FEAT-023 invalid ${uniqueKey(testInfo, 'x')}`,
        objective: 'brand_awareness',
        budget_amount: '1000',
        budget_currency: 'USD',
        deadline: null,
        brief: campaignBrief(['instagram', 'x']),
      },
    })
    await expectValidationInvalidPlatform(invalid, 'x')

    const valid = await authedRequest(page, '/v1/campaigns', {
      method: 'POST',
      workspaceId,
      data: {
        name: `FEAT-023 valid ${uniqueKey(testInfo, 'valid')}`,
        objective: 'brand_awareness',
        budget_amount: '1000',
        budget_currency: 'USD',
        deadline: null,
        brief: campaignBrief(['instagram', 'tiktok']),
      },
    })
    expect(valid.status()).toBe(201)
    const body = (await valid.json()) as { campaign_id: string; status: string; brief?: { icp_platforms?: string[] } }
    expect(body.status).toBe('draft')
    expect(body.brief?.icp_platforms ?? []).toEqual(expect.arrayContaining(['instagram', 'tiktok']))
  })

  test('ESC-6: activating a campaign with only legacy platforms shows the 409 inline in ReviewStep', async ({ page, request, onboardedBrandUser }, testInfo) => {
    await onboardedBrandUser.signIn(page)
    const me = await getMe(page)
    const workspaceId = me.brand_workspace?.id
    expect(workspaceId).toBeTruthy()
    const campaign = await seedCampaign(request, {
      brandWorkspaceId: workspaceId!,
      key: uniqueKey(testInfo, 'legacy-only'),
      platforms: ['twitter_x', 'twitch'],
      status: 'draft',
    })

    await page.goto(`/campaigns/${campaign.campaign_id}/configuration/review`)
    await expect(page.getByRole('button', { name: /Activar campaña/i })).toBeEnabled()
    await page.getByRole('button', { name: /Activar campaña/i }).click()

    await expect(page.getByRole('alert')).toContainText(/Campaign has no supported platforms|plataformas soportadas|plataformas/i)
    await expect(page).toHaveURL(new RegExp(`/campaigns/${campaign.campaign_id}/configuration/review`))

    const detail = await authedRequest(page, `/v1/campaigns/${campaign.campaign_id}/detail`, { workspaceId })
    expect(detail.ok()).toBeTruthy()
    const body = (await detail.json()) as { status?: string }
    expect(body.status).toBe('draft')
  })

  test('ESC-7: activating a campaign with supported plus legacy platforms succeeds and filters legacy', async ({ page, request, onboardedBrandUser }, testInfo) => {
    await onboardedBrandUser.signIn(page)
    const me = await getMe(page)
    const workspaceId = me.brand_workspace?.id
    expect(workspaceId).toBeTruthy()
    const campaign = await seedCampaign(request, {
      brandWorkspaceId: workspaceId!,
      key: uniqueKey(testInfo, 'mix'),
      platforms: ['instagram', 'twitter_x'],
      status: 'draft',
    })

    const activation = await authedRequest(page, `/v1/campaigns/${campaign.campaign_id}/configuration/activate`, {
      method: 'POST',
      workspaceId,
      idempotencyKey: uniqueKey(testInfo, 'activate'),
      data: { configuration_version: 1 },
    })
    expect(activation.ok()).toBeTruthy()

    const detail = await authedRequest(page, `/v1/campaigns/${campaign.campaign_id}/detail`, { workspaceId })
    expect(detail.ok()).toBeTruthy()
    const body = (await detail.json()) as { status?: string; platforms?: string[] }
    expect(body.status).toBe('active')
    expect(body.platforms).toEqual(['instagram'])

    await page.goto(`/campaigns/${campaign.campaign_id}`)
    await expect(page.getByText(/twitter_x|twitch|Twitter|Twitch/i)).toHaveCount(0)
  })

  test('ESC-8: campaign reads with legacy storage do not expose legacy platforms', async ({ page, request, onboardedBrandUser }, testInfo) => {
    await onboardedBrandUser.signIn(page)
    const me = await getMe(page)
    const workspaceId = me.brand_workspace?.id
    expect(workspaceId).toBeTruthy()
    const campaign = await seedCampaign(request, {
      brandWorkspaceId: workspaceId!,
      key: uniqueKey(testInfo, 'legacy-read'),
      platforms: ['instagram', 'x', 'twitch'],
      status: 'active',
    })

    const detail = await authedRequest(page, `/v1/campaigns/${campaign.campaign_id}/detail`, { workspaceId })
    expect(detail.ok()).toBeTruthy()
    const detailBody = (await detail.json()) as { platforms?: string[] }
    expect(detailBody.platforms).toEqual(['instagram'])

    const participants = await authedRequest(page, `/v1/campaigns/${campaign.campaign_id}/participants`, { workspaceId })
    expect(participants.ok()).toBeTruthy()
    expect(await participants.text()).not.toMatch(/\b(x|twitch|twitter_x)\b/i)

    const videos = await authedRequest(page, `/v1/campaigns/${campaign.campaign_id}/videos`, { workspaceId })
    expect(videos.ok()).toBeTruthy()
    expect(await videos.text()).not.toMatch(/\b(x|twitch|twitter_x)\b/i)

    await page.goto(`/campaigns/${campaign.campaign_id}?tab=creators&section=active`)
    await page.getByRole('combobox', { name: /Filter by platform/i }).click()
    await expect(page.getByRole('option')).toContainText(['All platforms', 'YouTube', 'Instagram', 'TikTok'])
    await expect(page.getByRole('option', { name: /Twitter|Twitch|X/i })).toHaveCount(0)
  })

  test('ESC-10: GET brand onboarding with legacy attribution returns no twitter_x', async () => {
    test.skip(true, 'SETUP REQUERIDO: primitiva neutral para sembrar un brand onboarding profile heredado con attribution_source=twitter_x para lectura, porque el endpoint actual de set attribution respeta el CHECK nuevo y bloquea ese valor')
  })

  test('ESC-11: creators/videos platform filters reset and only return valid results', async ({ page, request, onboardedBrandUser }, testInfo) => {
    const creators: TestUser[] = []
    try {
      await onboardedBrandUser.signIn(page)
      const me = await getMe(page)
      const workspaceId = me.brand_workspace?.id
      expect(workspaceId).toBeTruthy()
      const campaign = await seedCampaign(request, {
        brandWorkspaceId: workspaceId!,
        key: uniqueKey(testInfo, 'filters'),
        platforms: ['instagram', 'tiktok', 'youtube'],
        status: 'active',
      })

      const instagramCreator = await createAuxCreator(testInfo, 'instagram')
      const tiktokCreator = await createAuxCreator(testInfo, 'tiktok')
      creators.push(instagramCreator, tiktokCreator)

      await seedParticipant(request, {
        campaignId: campaign.campaign_id,
        brandWorkspaceId: workspaceId!,
        creatorAccountId: instagramCreator.accountId!,
        platforms: ['instagram'],
      })
      await seedParticipant(request, {
        campaignId: campaign.campaign_id,
        brandWorkspaceId: workspaceId!,
        creatorAccountId: tiktokCreator.accountId!,
        platforms: ['tiktok'],
      })
      await seedVideo(request, {
        campaignId: campaign.campaign_id,
        brandWorkspaceId: workspaceId!,
        creatorAccountId: instagramCreator.accountId!,
        platform: 'instagram',
        key: uniqueKey(testInfo, 'ig-video'),
      })
      await seedVideo(request, {
        campaignId: campaign.campaign_id,
        brandWorkspaceId: workspaceId!,
        creatorAccountId: tiktokCreator.accountId!,
        platform: 'tiktok',
        key: uniqueKey(testInfo, 'tt-video'),
      })

      await page.goto(`/campaigns/${campaign.campaign_id}?tab=creators&section=active`)
      await page.getByRole('combobox', { name: /Filter by platform/i }).click()
      await expect(page.getByRole('option')).toContainText(['All platforms', 'YouTube', 'Instagram', 'TikTok'])
      await expect(page.getByRole('option', { name: /Twitch|Twitter|X/i })).toHaveCount(0)
      await page.getByRole('option', { name: 'Instagram' }).click()
      await expect(page.getByText('Instagram').first()).toBeVisible()
      await expect(page.getByText(/Twitch|Twitter|twitter_x/i)).toHaveCount(0)

      await page.getByRole('combobox', { name: /Filter by platform/i }).click()
      await page.getByRole('option', { name: 'TikTok' }).click()
      await expect(page.getByText('TikTok').first()).toBeVisible()
      await expect(page.getByText(/Twitch|Twitter|twitter_x/i)).toHaveCount(0)

      await page.getByRole('button', { name: /Clear/i }).click()
      await expect(page.getByText(/Instagram|TikTok/).first()).toBeVisible()

      await page.getByRole('button', { name: /Videos/i }).click()
      await page.getByRole('combobox', { name: /Filter by platform/i }).click()
      await expect(page.getByRole('option')).toContainText(['All platforms', 'YouTube', 'Instagram', 'TikTok'])
      await expect(page.getByRole('option', { name: /Twitch|Twitter|X/i })).toHaveCount(0)
      await page.getByRole('option', { name: 'Instagram' }).click()
      await expect(page.getByText('Instagram').first()).toBeVisible()
      await page.getByRole('combobox', { name: /Filter by platform/i }).click()
      await page.getByRole('option', { name: 'TikTok' }).click()
      await expect(page.getByText('TikTok').first()).toBeVisible()
      await page.getByRole('button', { name: /Clear/i }).click()
      await expect(page.getByText(/Instagram|TikTok/).first()).toBeVisible()
      await expect(page.getByText(/Twitch|Twitter|twitter_x/i)).toHaveCount(0)
    } finally {
      await Promise.all(creators.map((creator) => creator.delete().catch(() => undefined)))
    }
  })
})
