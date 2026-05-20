import type { APIRequestContext, Page } from '@playwright/test'

import { expect, getClerkSessionToken, TestUser, test } from '../fixtures'

const API_BASE_URL = (
  process.env.VITE_API_URL ??
  process.env.API_URL ??
  'http://localhost:8080'
).replace(/\/$/, '')

const TEST_SECRET = process.env.MARZ_TEST_SECRET
const SUPPORTED_PLATFORMS = ['instagram', 'tiktok', 'youtube'] as const
const PLATFORM_LABELS = ['Instagram', 'TikTok', 'YouTube']

type ApiErrorEnvelope = {
  code?: string
  details?: Record<string, unknown>
  error?: ApiErrorEnvelope
}

type TestAccount = {
  id: string
  account_id?: string
  clerk_user_id: string
  brand_workspace?: { id: string } | null
  workspace_id?: string | null
  clerk_m2m_token?: string
}

type CampaignFixture = {
  campaign_id: string
  brand_workspace_id: string
  status: string
  target_platforms?: string[]
}

function extractApiError(raw: unknown): {
  code?: string
  details?: Record<string, unknown>
} {
  const body = (raw ?? {}) as ApiErrorEnvelope
  if (body.code) return { code: body.code, details: body.details }
  if (body.error?.code) {
    return { code: body.error.code, details: body.error.details }
  }
  return {}
}

function uniqueKey(prefix: string, workerIndex: number) {
  return `${prefix}-${workerIndex}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`
}

function assertSupportedAllowed(details: Record<string, unknown> | undefined) {
  expect(details?.allowed).toEqual([...SUPPORTED_PLATFORMS])
}

function creatorPayload(platform: string, handle: string) {
  return {
    handle: `${handle}_profile`,
    display_name: 'Creator FEAT 023',
    bio: null,
    niches: ['general'],
    content_types: ['ugc_videos'],
    country: 'AR',
    city: 'Buenos Aires',
    avatar_s3_key: 'test/avatar.png',
    birthday: '1994-03-20',
    whatsapp_e164: '+5491123456789',
    gender: 'prefer_not_say',
    experience_level: 'none',
    tier: 'emergent',
    channels: [
      {
        platform,
        external_handle: handle,
        external_url: null,
        followers: 1200,
        verified: false,
        is_primary: true,
        rate_cards: [],
      },
    ],
    best_videos: [],
    referral_text: null,
  }
}

function brandPayload(attributionSource: string) {
  return {
    name: 'FEAT 023 Brand',
    website_url: 'https://example.com',
    primary_color_hex: '#111111',
    secondary_color_hex: '#eeeeee',
    vertical: 'tech',
    marketing_objective: 'awareness',
    creator_experience: 'never',
    creator_sourcing_intent: 'discover_in_marz',
    monthly_budget_range: 'under_10k',
    timing: 'launch_now',
    attribution: { source: attributionSource },
    contact_name: 'QA Brand',
    contact_title: 'Marketing',
    contact_whatsapp_e164: '+5491123456789',
  }
}

function campaignCreatePayload(platforms: string[]) {
  return {
    name: `FEAT 023 Campaign ${Date.now()}`,
    objective: 'brand_awareness',
    budget_amount: '12000',
    budget_currency: 'USD',
    deadline: '2026-06-30T00:00:00Z',
    brief: {
      brief_source_url: 'https://example.com/brief',
      brief_source_text: 'Campaign brief for FEAT 023 e2e.',
      tone: 'Direct',
      key_messages: ['Use only supported social platforms'],
      do_list: ['Create authentic content'],
      dont_list: ['Do not mention unsupported channels'],
      reference_links: ['https://example.com/reference'],
      brief_pdf_s3_key: null,
      icp_description: 'Creators in Argentina',
      icp_age_min: 18,
      icp_age_max: 45,
      icp_genders: [],
      icp_countries: ['AR'],
      icp_platforms: platforms,
      icp_interests: ['tech'],
      scoring_dimensions: [{ name: 'Audience fit', weight_pct: 100 }],
      hard_filters: [],
      disqualifiers: [],
    },
  }
}

async function productRequest(
  page: Page,
  method: string,
  path: string,
  data?: unknown,
  workspaceId?: string,
) {
  const token = await getClerkSessionToken(page)
  return page.request.fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(workspaceId ? { 'X-Brand-Workspace-Id': workspaceId } : {}),
    },
    data,
  })
}

async function productJson(
  page: Page,
  method: string,
  path: string,
  data?: unknown,
  workspaceId?: string,
) {
  const response = await productRequest(page, method, path, data, workspaceId)
  const text = await response.text()
  return {
    response,
    body: text ? (JSON.parse(text) as unknown) : null,
  }
}

async function testApi(
  request: APIRequestContext,
  method: string,
  path: string,
  data?: unknown,
) {
  if (!TEST_SECRET) throw new Error('MARZ_TEST_SECRET is required for Test API')
  const response = await request.fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { 'X-Test-Secret': TEST_SECRET },
    data,
  })
  if (!response.ok()) {
    throw new Error(
      `Test API ${method} ${path} failed: ${response.status()} ${await response.text()}`,
    )
  }
  const text = await response.text()
  return text ? (JSON.parse(text) as unknown) : null
}

async function createRawTestAccount(
  request: APIRequestContext,
  key: string,
  kind: 'brand' | 'creator',
  onboardingStatus: 'onboarding_pending' | 'onboarded' = 'onboarded',
) {
  const account = (await testApi(request, 'POST', '/v1/test/accounts', {
    clerk_user_id: `user_${key.replace(/[^a-zA-Z0-9]/g, '_')}`,
    email: `${key}+clerk_test@example.com`,
    full_name: `E2E ${kind}`,
    kind,
    onboarding_status: onboardingStatus,
    workspace_name: kind === 'brand' ? `Workspace ${key}` : undefined,
  })) as TestAccount

  if (onboardingStatus === 'onboarded') {
    return (await testApi(
      request,
      'POST',
      `/v1/test/accounts/${account.clerk_user_id}/onboard-full`,
      { kind },
    )) as TestAccount
  }

  return account
}

async function seedCampaign(
  request: APIRequestContext,
  brandWorkspaceId: string,
  key: string,
  targetPlatforms: string[],
  status: 'draft' | 'active' = 'draft',
) {
  return (await testApi(
    request,
    'POST',
    '/v1/test/campaigns/campaigns/upsert',
    {
      brand_workspace_id: brandWorkspaceId,
      campaign_key: key,
      name: `FEAT 023 ${key}`,
      objective: 'brand_awareness',
      budget_amount: '12000',
      budget_currency: 'USD',
      deadline: '2026-06-30T00:00:00Z',
      status,
      content_type: 'ugc_videos',
      pricing_model: 'fixed_per_video',
      target_platforms: targetPlatforms,
      configuration_current_step: 'review',
      configuration_completed_steps: [
        'content_type',
        'pricing_model',
        'targeting',
        'bonus',
      ],
      configuration_complete: true,
      configuration_version: 1,
      operational_targeting: {
        countries: ['AR'],
        tiers: ['emergent'],
        follower_min: null,
        follower_max: null,
        genders: [],
        age_min: null,
        age_max: null,
        interests: [],
        content_languages: ['es'],
        source: 'manual',
        adjusted_from_brief: false,
      },
      bonus_config: {
        enabled: false,
        speed_bonus: { enabled: false, windows: [] },
        performance_bonus: { enabled: false, milestones: [] },
      },
      read_dependencies: true,
    },
  )) as CampaignFixture
}

async function seedParticipant(
  request: APIRequestContext,
  campaign: CampaignFixture,
  creatorAccountId: string,
  currentPlatforms: string[],
  status = 'active',
) {
  await testApi(request, 'POST', '/v1/test/campaigns/participants/upsert', {
    campaign_id: campaign.campaign_id,
    brand_workspace_id: campaign.brand_workspace_id,
    creator_account_id: creatorAccountId,
    current_platforms: currentPlatforms,
    status,
    source: 'manual',
  })
}

async function seedVideo(
  request: APIRequestContext,
  campaign: CampaignFixture,
  creatorAccountId: string,
  platform: string,
  key: string,
) {
  await testApi(request, 'POST', '/v1/test/deliverables/videos/upsert', {
    campaign_id: campaign.campaign_id,
    brand_workspace_id: campaign.brand_workspace_id,
    creator_account_id: creatorAccountId,
    platform,
    url: `https://example.com/${key}`,
    fixture_key: key,
    status: 'link_submitted',
    format: 'ugc_video',
  })
}

async function openCreatorChannels(page: Page, user: TestUser) {
  await user.signIn(page)
  await page.goto('/onboarding/creator/channels')
  await page.getByRole('button', { name: /Agregar canal/i }).click()
}

async function expectCreatorPlatformOptions(page: Page) {
  await openCreatorPlatformSelect(page)
  await expect(page.getByRole('option')).toHaveText(PLATFORM_LABELS)
  await expect(page.getByRole('option', { name: /Twitch/i })).toHaveCount(0)
  await expect(page.getByRole('option', { name: /Twitter|^X$/i })).toHaveCount(0)
  await page.keyboard.press('Escape')
}

async function openCreatorPlatformSelect(page: Page) {
  await page.getByRole('combobox').filter({ hasText: /Instagram/ }).first().click()
}

async function expectBrandAttributionOptions(page: Page) {
  await expect(page.getByRole('radiogroup', { name: /Fuente/i })).toBeVisible()
  await expect(page.getByRole('radio')).toHaveText([
    'Instagram',
    'Referido',
    'Búsqueda',
    'Otro',
    'TikTok',
    'LinkedIn',
    'Reddit',
  ])
  await expect(page.getByRole('radio', { name: /Twitter|^X$/i })).toHaveCount(0)
}

async function expectPlatformFilterOptions(page: Page) {
  await page.getByRole('combobox', { name: /Filter by platform/i }).click()
  await expect(page.getByRole('option')).toHaveText([
    'All platforms',
    'YouTube',
    'Instagram',
    'TikTok',
  ])
  await expect(page.getByRole('option', { name: /Twitch|Twitter|^X$/i })).toHaveCount(0)
  await page.keyboard.press('Escape')
}

async function expectCampaignDetailReadFiltered(
  page: Page,
  campaignId: string,
  workspaceId: string,
) {
  const detail = await productJson(
    page,
    'GET',
    `/v1/campaigns/${campaignId}/detail`,
    undefined,
    workspaceId,
  )
  expect(detail.response.ok()).toBe(true)
  const body = detail.body as { data?: { platforms?: string[] }; platforms?: string[] }
  const platforms = body.data?.platforms ?? body.platforms ?? []
  expect(platforms).not.toContain('x')
  expect(platforms).not.toContain('twitch')
  expect(platforms).not.toContain('twitter_x')
}

test.describe('FEAT-023 social platform cleanup', () => {
  test('ESC-1: Creator no puede guardar Twitch como Creator channel', async ({
    page,
    creatorOnboardingUser,
  }) => {
    await openCreatorChannels(page, creatorOnboardingUser)
    await expectCreatorPlatformOptions(page)

    const { response, body } = await productJson(
      page,
      'POST',
      '/v1/onboarding/creator:complete',
      creatorPayload('twitch', 'creator_fe23'),
    )

    expect(response.status()).toBe(422)
    const { code, details } = extractApiError(body)
    expect(code).toBe('validation.invalid_value')
    expect(String(details?.field ?? '')).toContain('platform')
    expect(details?.value).toBe('twitch')
    assertSupportedAllowed(details)
    await expect(page).toHaveURL(/\/onboarding\/creator\/channels/)
  })

  test('ESC-2: Creator happy-path con plataformas oficiales', async ({
    page,
    creatorOnboardingUser,
  }) => {
    await openCreatorChannels(page, creatorOnboardingUser)
    await expectCreatorPlatformOptions(page)

    const { response, body } = await productJson(
      page,
      'POST',
      '/v1/onboarding/creator:complete',
      creatorPayload('instagram', 'creator_fe23_ig'),
    )

    expect(response.ok()).toBe(true)
    const me = (body as { data?: { creator_profile?: { handle?: string } } }).data
    expect(me?.creator_profile?.handle).toBe('creator_fe23_ig_profile')
  })

  test('ESC-3: Creator no puede guardar Twitter/X como Creator channel', async ({
    page,
    creatorOnboardingUser,
  }) => {
    await openCreatorChannels(page, creatorOnboardingUser)
    await expectCreatorPlatformOptions(page)

    const { response, body } = await productJson(
      page,
      'POST',
      '/v1/onboarding/creator:complete',
      creatorPayload('twitter_x', 'creator_fe23_x'),
    )

    expect(response.status()).toBe(422)
    const { code, details } = extractApiError(body)
    expect(code).toBe('validation.invalid_value')
    expect(String(details?.field ?? '')).toContain('platform')
    expect(details?.value).toBe('twitter_x')
    assertSupportedAllowed(details)
    await expect(page).toHaveURL(/\/onboarding\/creator\/channels/)
  })

  test('ESC-4: Brand B11 attribution sin Twitter/X', async ({
    page,
    brandOnboardingUser,
  }) => {
    await brandOnboardingUser.signIn(page)
    await page.goto('/onboarding/brand/attribution')
    await expectBrandAttributionOptions(page)

    const { response, body } = await productJson(
      page,
      'POST',
      '/v1/onboarding/brand:complete',
      brandPayload('twitter_x'),
    )

    expect(response.status()).toBe(422)
    const { code, details } = extractApiError(body)
    expect(code).toBe('validation.invalid_value')
    expect(String(details?.field ?? '')).toContain('attribution')
    expect(details?.value).toBe('twitter_x')
    expect(details?.allowed).not.toContain('twitter_x')
  })

  test('ESC-5: Brand crea Campaign draft con plataformas oficiales y rechaza X', async ({
    page,
    onboardedBrandUser,
  }) => {
    await onboardedBrandUser.signIn(page)
    const workspaceId = onboardedBrandUser.accountId
      ? (await productJson(page, 'GET', '/v1/me')).body
      : null
    const me = workspaceId as { data?: { brand_workspace?: { id: string } } }
    const brandWorkspaceId = me.data?.brand_workspace?.id
    expect(brandWorkspaceId).toBeTruthy()

    const invalid = await productJson(
      page,
      'POST',
      '/v1/campaigns',
      campaignCreatePayload(['instagram', 'x']),
      brandWorkspaceId,
    )
    expect(invalid.response.status()).toBe(422)
    const invalidError = extractApiError(invalid.body)
    expect(invalidError.code).toBe('validation.invalid_value')
    expect(JSON.stringify(invalidError.details)).toContain('x')
    assertSupportedAllowed(invalidError.details)

    const valid = await productJson(
      page,
      'POST',
      '/v1/campaigns',
      campaignCreatePayload(['instagram', 'tiktok']),
      brandWorkspaceId,
    )
    expect(valid.response.ok()).toBe(true)
    const created = valid.body as { data?: { campaign_id?: string; status?: string } }
    expect(created.data?.campaign_id).toBeTruthy()
    expect(created.data?.status).toBe('draft')
  })

  test('ESC-6: Activar Campaign sin plataformas operativas muestra 409 inline', async ({
    page,
    request,
  }, testInfo) => {
    const key = uniqueKey('feat023-esc6-brand', testInfo.workerIndex)
    const brand = await createRawTestAccount(request, key, 'brand')
    const brandWorkspaceId = brand.brand_workspace?.id ?? brand.workspace_id
    expect(brandWorkspaceId).toBeTruthy()
    const campaign = await seedCampaign(
      request,
      brandWorkspaceId!,
      `${key}-legacy-only`,
      ['twitter_x', 'twitch'],
    )

    const uiUser = new TestUser(
      key,
      `${key}+clerk_test@example.com`,
      'E2E Brand',
    )
    uiUser.clerkUserId = brand.clerk_user_id
    uiUser.accountId = brand.account_id ?? brand.id

    await uiUser.signIn(page)
    await page.goto(`/campaigns/${campaign.campaign_id}/configuration/review`)
    await page.getByRole('button', { name: /Activar campana|Activar campaña/i }).click()
    await expect(page.getByRole('alert')).toContainText(
      /Campaign has no supported platforms|plataformas soportadas/i,
    )

    const detail = await productJson(
      page,
      'GET',
      `/v1/campaigns/${campaign.campaign_id}/detail`,
      undefined,
      brandWorkspaceId,
    )
    expect(detail.response.ok()).toBe(true)
    const body = detail.body as { data?: { status?: string }; status?: string }
    expect(body.data?.status ?? body.status).toBe('draft')
  })

  test('ESC-7: Activar Campaign con mix valido y legacy activa y filtra legacy', async ({
    page,
    request,
  }, testInfo) => {
    const key = uniqueKey('feat023-esc7-brand', testInfo.workerIndex)
    const brand = await createRawTestAccount(request, key, 'brand')
    const brandWorkspaceId = brand.brand_workspace?.id ?? brand.workspace_id
    expect(brandWorkspaceId).toBeTruthy()
    const campaign = await seedCampaign(
      request,
      brandWorkspaceId!,
      `${key}-mixed`,
      ['instagram', 'twitter_x'],
    )

    const uiUser = new TestUser(
      key,
      `${key}+clerk_test@example.com`,
      'E2E Brand',
    )
    uiUser.clerkUserId = brand.clerk_user_id
    uiUser.accountId = brand.account_id ?? brand.id
    await uiUser.signIn(page)

    const activate = await productJson(
      page,
      'POST',
      `/v1/campaigns/${campaign.campaign_id}/configuration/activate`,
      { configuration_version: 1 },
      brandWorkspaceId,
    )
    expect(activate.response.ok()).toBe(true)

    const detail = await productJson(
      page,
      'GET',
      `/v1/campaigns/${campaign.campaign_id}/detail`,
      undefined,
      brandWorkspaceId,
    )
    expect(detail.response.ok()).toBe(true)
    const body = detail.body as {
      data?: { status?: string; platforms?: string[] }
      status?: string
      platforms?: string[]
    }
    expect(body.data?.status ?? body.status).toBe('active')
    expect(body.data?.platforms ?? body.platforms).toEqual(['instagram'])
  })

  test('ESC-8: GET campaigns con fixtures legacy no expone legacy en reads', async ({
    page,
    request,
  }, testInfo) => {
    const key = uniqueKey('feat023-esc8', testInfo.workerIndex)
    const brand = await createRawTestAccount(request, `${key}-brand`, 'brand')
    const creator = await createRawTestAccount(request, `${key}-creator`, 'creator')
    const brandWorkspaceId = brand.brand_workspace?.id ?? brand.workspace_id
    expect(brandWorkspaceId).toBeTruthy()
    const campaign = await seedCampaign(
      request,
      brandWorkspaceId!,
      `${key}-legacy-storage`,
      ['instagram', 'x', 'twitch'],
      'active',
    )
    await seedParticipant(request, campaign, creator.account_id ?? creator.id, [
      'instagram',
    ])
    await seedVideo(request, campaign, creator.account_id ?? creator.id, 'instagram', `${key}-ig`)
    await seedVideo(request, campaign, creator.account_id ?? creator.id, 'twitch', `${key}-tw`)

    const uiUser = new TestUser(
      `${key}-brand`,
      `${key}-brand+clerk_test@example.com`,
      'E2E Brand',
    )
    uiUser.clerkUserId = brand.clerk_user_id
    uiUser.accountId = brand.account_id ?? brand.id
    await uiUser.signIn(page)

    await expectCampaignDetailReadFiltered(page, campaign.campaign_id, brandWorkspaceId!)

    const participants = await productJson(
      page,
      'GET',
      `/v1/campaigns/${campaign.campaign_id}/participants`,
      undefined,
      brandWorkspaceId,
    )
    expect(participants.response.ok()).toBe(true)
    expect(JSON.stringify(participants.body)).not.toMatch(/"x"|"twitch"|twitter_x/)

    const videos = await productJson(
      page,
      'GET',
      `/v1/campaigns/${campaign.campaign_id}/videos`,
      undefined,
      brandWorkspaceId,
    )
    expect(videos.response.ok()).toBe(true)
    expect(JSON.stringify(videos.body)).not.toMatch(/"x"|"twitch"|twitter_x/)

    await page.goto(`/campaigns/${campaign.campaign_id}?tab=creators`)
    await expectPlatformFilterOptions(page)
    await expect(page.getByText(/Twitch|Twitter|twitter_x/)).toHaveCount(0)

    await page.goto(`/campaigns/${campaign.campaign_id}?tab=videos`)
    await expectPlatformFilterOptions(page)
    await expect(page.getByText(/Twitch|Twitter|twitter_x/)).toHaveCount(0)
  })

  test('ESC-10: GET brand onboarding con attribution legacy devuelve estado no seleccionado', async ({
    page,
    request,
  }, testInfo) => {
    const key = uniqueKey('feat023-esc10-brand', testInfo.workerIndex)
    const brand = await createRawTestAccount(request, key, 'brand')
    const brandWorkspaceId = brand.brand_workspace?.id ?? brand.workspace_id
    expect(brandWorkspaceId).toBeTruthy()

    await testApi(
      request,
      'POST',
      '/v1/test/identity/brand-onboarding-profiles/upsert',
      {
        brand_workspace_id: brandWorkspaceId,
        attribution_source: 'twitter_x',
        completed_by_account_id: brand.account_id ?? brand.id,
      },
    )

    const uiUser = new TestUser(
      key,
      `${key}+clerk_test@example.com`,
      'E2E Brand',
    )
    uiUser.clerkUserId = brand.clerk_user_id
    uiUser.accountId = brand.account_id ?? brand.id
    await uiUser.signIn(page)

    await page.goto('/onboarding/brand/attribution')
    await expectBrandAttributionOptions(page)
    await expect(page.getByRole('radio', { checked: true })).toHaveCount(0)

    const candidates = [
      '/v1/identity/onboarding/brand',
      '/v1/brands/me',
      '/v1/onboarding/brand',
    ]
    let observed: unknown = null
    for (const candidate of candidates) {
      const result = await productJson(page, 'GET', candidate, undefined, brandWorkspaceId)
      if (result.response.ok()) {
        observed = result.body
        break
      }
    }
    if (observed) {
      expect(JSON.stringify(observed)).not.toContain('twitter_x')
    }
  })

  test('ESC-11: Filtros de creators/videos tras quitar Twitch muestran y resetean resultados validos', async ({
    page,
    request,
  }, testInfo) => {
    const key = uniqueKey('feat023-esc11', testInfo.workerIndex)
    const brand = await createRawTestAccount(request, `${key}-brand`, 'brand')
    const creatorIg = await createRawTestAccount(request, `${key}-creator-ig`, 'creator')
    const creatorTk = await createRawTestAccount(request, `${key}-creator-tk`, 'creator')
    const brandWorkspaceId = brand.brand_workspace?.id ?? brand.workspace_id
    expect(brandWorkspaceId).toBeTruthy()
    const campaign = await seedCampaign(
      request,
      brandWorkspaceId!,
      `${key}-mixed-creators`,
      ['instagram', 'tiktok', 'youtube'],
      'active',
    )
    await seedParticipant(request, campaign, creatorIg.account_id ?? creatorIg.id, [
      'instagram',
    ])
    await seedParticipant(request, campaign, creatorTk.account_id ?? creatorTk.id, [
      'tiktok',
    ])
    await seedVideo(request, campaign, creatorIg.account_id ?? creatorIg.id, 'instagram', `${key}-ig`)
    await seedVideo(request, campaign, creatorTk.account_id ?? creatorTk.id, 'tiktok', `${key}-tk`)

    const uiUser = new TestUser(
      `${key}-brand`,
      `${key}-brand+clerk_test@example.com`,
      'E2E Brand',
    )
    uiUser.clerkUserId = brand.clerk_user_id
    uiUser.accountId = brand.account_id ?? brand.id
    await uiUser.signIn(page)

    await page.goto(`/campaigns/${campaign.campaign_id}?tab=creators`)
    await expectPlatformFilterOptions(page)
    await page.getByRole('combobox', { name: /Filter by platform/i }).click()
    await page.getByRole('option', { name: 'Instagram' }).click()
    await expect(page).toHaveURL(/platform=instagram/)
    await page.getByRole('combobox', { name: /Filter by platform/i }).click()
    await page.getByRole('option', { name: 'TikTok' }).click()
    await expect(page).toHaveURL(/platform=tiktok/)
    await page.getByRole('button', { name: /Clear/i }).click()
    await expect(page).not.toHaveURL(/platform=/)
    await expect(page.getByText(/Twitch|Twitter|twitter_x/)).toHaveCount(0)

    await page.goto(`/campaigns/${campaign.campaign_id}?tab=videos`)
    await expectPlatformFilterOptions(page)
    await page.getByRole('combobox', { name: /Filter by platform/i }).click()
    await page.getByRole('option', { name: 'Instagram' }).click()
    await expect(page).toHaveURL(/platform=instagram/)
    await page.getByRole('combobox', { name: /Filter by platform/i }).click()
    await page.getByRole('option', { name: 'TikTok' }).click()
    await expect(page).toHaveURL(/platform=tiktok/)
    await page.getByRole('button', { name: /Clear/i }).click()
    await expect(page).not.toHaveURL(/platform=/)
    await expect(page.getByText(/Twitch|Twitter|twitter_x/)).toHaveCount(0)
  })
})
