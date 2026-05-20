import type { APIRequestContext, Page } from '@playwright/test'

import { expect, getClerkSessionToken, TestUser, test } from '../fixtures'

const API_BASE_URL = (
  process.env.VITE_API_URL ??
  process.env.API_URL ??
  'http://localhost:8080'
).replace(/\/$/, '')

const TEST_SECRET = process.env.MARZ_TEST_SECRET
const supportedPlatforms = ['instagram', 'tiktok', 'youtube']
const supportedPlatformLabels = ['Instagram', 'TikTok', 'YouTube']

type ApiErrorEnvelope = {
  code?: string
  details?: {
    field?: string
    value?: unknown
    allowed?: unknown
    field_errors?: Record<string, string[]>
  }
  error?: ApiErrorEnvelope
}

type TestAccount = {
  id: string
  brand_workspace?: { id: string } | null
}

type ProductRequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  workspaceId?: string
}

function extractApiError(raw: unknown): {
  code?: string
  details?: ApiErrorEnvelope['details']
} {
  const body = (raw ?? {}) as ApiErrorEnvelope
  if (body.code) return { code: body.code, details: body.details }
  if (body.error?.code) {
    return { code: body.error.code, details: body.error.details }
  }
  return {}
}

async function productRequest(
  page: Page,
  path: string,
  options: ProductRequestOptions = {},
) {
  const token = await getClerkSessionToken(page)
  return page.request.fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.workspaceId
        ? { 'X-Brand-Workspace-Id': options.workspaceId }
        : {}),
    },
    data: options.body,
  })
}

async function testApi<T>(
  request: APIRequestContext,
  path: string,
  body: unknown,
): Promise<T> {
  if (!TEST_SECRET) {
    throw new Error('MARZ_TEST_SECRET is required for Test API fixtures')
  }

  const response = await request.post(`${API_BASE_URL}${path}`, {
    headers: {
      'X-Test-Secret': TEST_SECRET,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    data: body,
  })

  if (!response.ok()) {
    throw new Error(
      `Test API ${path} failed: ${response.status()} ${await response.text()}`,
    )
  }

  return (await response.json()) as T
}

function creatorPayload(platform: string, handle: string) {
  return {
    handle: `${handle}_main`,
    display_name: 'Creator FEAT 023',
    bio: 'Creator fixture for FEAT-023',
    niches: ['lifestyle'],
    content_types: ['ugc_videos'],
    country: 'AR',
    city: 'Buenos Aires',
    avatar_s3_key: 'test/feat023/avatar.png',
    birthday: '1994-03-12',
    whatsapp_e164: '+5491155555555',
    gender: 'prefer_not_say',
    experience_level: '1_to_5',
    tier: 'emergent',
    channels: [
      {
        platform,
        external_handle: handle,
        external_url: null,
        followers: 1200,
        verified: false,
        is_primary: true,
        rate_cards: [
          {
            format: 'ugc_video',
            rate_amount: '100.00',
            rate_currency: 'USD',
          },
        ],
      },
    ],
    best_videos: [],
    referral_text: null,
  }
}

function brandPayload(attributionSource: string) {
  return {
    name: 'Brand FEAT 023',
    website_url: 'https://feat023.example.com',
    primary_color_hex: '#111111',
    secondary_color_hex: '#eeeeee',
    brandfetch_snapshot: null,
    vertical: 'tech',
    marketing_objective: 'brand_awareness',
    creator_experience: 'none',
    creator_sourcing_intent: 'marz_discovery',
    monthly_budget_range: '25k_to_50k',
    timing: 'now',
    attribution: { source: attributionSource },
    contact_name: 'Rodrigo',
    contact_title: 'Growth Lead',
    contact_whatsapp_e164: '+5491155555555',
  }
}

function campaignCreatePayload(platforms: string[]) {
  return {
    name: `FEAT-023 campaign ${Date.now()}`,
    objective: 'brand_awareness',
    budget_amount: '42000.00',
    budget_currency: 'USD',
    deadline: null,
    brief: {
      brief_source_url: 'https://feat023.example.com/brief',
      brief_source_text: 'Campaign fixture for FEAT-023',
      icp_platforms: platforms,
      icp_countries: ['AR'],
      icp_genders: [],
      icp_interests: ['fitness'],
      hard_filters: [],
      disqualifiers: [],
      scoring_dimensions: [],
    },
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
    interests: ['fitness'],
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
    workspaceId: string
    key: string
    platforms: string[]
    status?: 'draft' | 'active'
    configurationComplete?: boolean
  },
) {
  return testApi<{
    campaign_id: string
    brand_workspace_id: string
    status: string
    target_platforms: string[]
  }>(request, '/v1/test/campaigns/campaigns/upsert', {
    brand_workspace_id: params.workspaceId,
    campaign_key: params.key,
    name: `FEAT-023 ${params.key}`,
    objective: 'brand_awareness',
    budget_amount: '42000.00',
    budget_currency: 'USD',
    deadline: null,
    status: params.status ?? 'draft',
    content_type: 'ugc_videos',
    pricing_model: 'fixed_per_video',
    target_platforms: params.platforms,
    operational_targeting: operationalTargeting(),
    bonus_config: bonusConfig(),
    configuration_current_step: 'review',
    configuration_completed_steps: [
      'content_type',
      'pricing_model',
      'targeting',
      'bonus',
    ],
    configuration_complete: params.configurationComplete ?? true,
    configuration_version: 1,
    read_dependencies: true,
  })
}

async function seedParticipant(
  request: APIRequestContext,
  params: {
    campaignId: string
    workspaceId: string
    creatorAccountId: string
    platforms: string[]
  },
) {
  await testApi(request, '/v1/test/campaigns/participants/upsert', {
    campaign_id: params.campaignId,
    brand_workspace_id: params.workspaceId,
    creator_account_id: params.creatorAccountId,
    current_platforms: params.platforms,
    status: 'active',
    source: 'manual',
  })
}

async function seedVideo(
  request: APIRequestContext,
  params: {
    campaignId: string
    workspaceId: string
    creatorAccountId: string
    platform: string
    fixtureKey: string
  },
) {
  await testApi(request, '/v1/test/deliverables/videos/upsert', {
    campaign_id: params.campaignId,
    brand_workspace_id: params.workspaceId,
    creator_account_id: params.creatorAccountId,
    platform: params.platform,
    url: `https://videos.example.com/${params.fixtureKey}`,
    fixture_key: params.fixtureKey,
    status: 'link_submitted',
    format: 'ugc_video',
  })
}

async function openPlatformSelect(page: Page, name: RegExp) {
  await page.getByRole('combobox', { name }).click()
  const listbox = page.getByRole('listbox')
  await expect(listbox).toBeVisible()
  return listbox
}

async function expectOnlySupportedPlatformOptions(page: Page, name: RegExp) {
  const listbox = await openPlatformSelect(page, name)
  for (const label of supportedPlatformLabels) {
    await expect(listbox.getByRole('option', { name: label })).toBeVisible()
  }
  await expect(listbox.getByRole('option', { name: /Twitch/i })).toHaveCount(0)
  await expect(listbox.getByRole('option', { name: /Twitter|X/i })).toHaveCount(
    0,
  )
  await page.keyboard.press('Escape')
}

async function getBrandWorkspaceId(user: {
  onboardFull: (kind: 'brand') => Promise<TestAccount>
}) {
  const me = await user.onboardFull('brand')
  const workspaceId = me.brand_workspace?.id
  if (!workspaceId) throw new Error('Expected test brand workspace')
  return workspaceId
}

test.describe('FEAT-023 social platform cleanup', () => {
  test('ESC-1: creator cannot save Twitch as creator channel', async ({
    page,
    creatorOnboardingUser,
  }) => {
    await creatorOnboardingUser.signIn(page)
    await page.goto('/onboarding/creator/channels')

    await expect(page.getByRole('button', { name: /Instagram/ })).toBeVisible()
    await expect(page.getByText(/Twitch/i)).toHaveCount(0)

    const response = await productRequest(
      page,
      '/v1/onboarding/creator:complete',
      {
        method: 'POST',
        body: creatorPayload('twitch', 'creator_fe23'),
      },
    )
    const { code, details } = extractApiError(await response.json())

    expect(response.status()).toBe(422)
    expect(code).toBe('validation.invalid_value')
    expect(details?.field).toContain('platform')
    expect(details?.value).toBe('twitch')
    expect(details?.allowed).toEqual(supportedPlatforms)
    await expect(page).toHaveURL(/\/onboarding\/creator\/channels/)
  })

  test('ESC-2: creator happy path with official platform', async ({
    page,
    creatorOnboardingUser,
  }) => {
    await creatorOnboardingUser.signIn(page)
    await page.goto('/onboarding/creator/channels')

    await expect(page.getByRole('button', { name: /Instagram/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /TikTok/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /YouTube/ })).toBeVisible()

    const response = await productRequest(
      page,
      '/v1/onboarding/creator:complete',
      {
        method: 'POST',
        body: creatorPayload('instagram', 'creator_fe23_ig'),
      },
    )

    expect(response.ok()).toBeTruthy()
    await expect(page).toHaveURL(/\/onboarding\/creator\/channels/)
  })

  test('ESC-3: creator cannot save Twitter/X as creator channel', async ({
    page,
    creatorOnboardingUser,
  }) => {
    await creatorOnboardingUser.signIn(page)
    await page.goto('/onboarding/creator/channels')

    await expect(page.getByText(/Twitter|Twitch|twitter_x/i)).toHaveCount(0)

    const response = await productRequest(
      page,
      '/v1/onboarding/creator:complete',
      {
        method: 'POST',
        body: creatorPayload('twitter_x', 'creator_fe23_x'),
      },
    )
    const { code, details } = extractApiError(await response.json())

    expect(response.status()).toBe(422)
    expect(code).toBe('validation.invalid_value')
    expect(details?.field).toContain('platform')
    expect(details?.value).toBe('twitter_x')
    expect(details?.allowed).toEqual(supportedPlatforms)
    await expect(page).toHaveURL(/\/onboarding\/creator\/channels/)
  })

  test('ESC-4: brand B11 attribution has no Twitter/X and rejects twitter_x', async ({
    page,
    brandOnboardingUser,
  }) => {
    await brandOnboardingUser.signIn(page)
    await page.goto('/onboarding/brand/attribution')

    await expect(page.getByText(/¿Cómo llegaste a Marz/i)).toBeVisible()
    await expect(page.getByRole('radio', { name: /Instagram/i })).toBeVisible()
    await expect(page.getByRole('radio', { name: /TikTok/i })).toBeVisible()
    await expect(page.getByRole('radio', { name: /LinkedIn/i })).toBeVisible()
    await expect(page.getByRole('radio', { name: /Reddit/i })).toBeVisible()
    await expect(page.getByRole('radio', { name: /Búsqueda/i })).toBeVisible()
    await expect(page.getByRole('radio', { name: /Referido/i })).toBeVisible()
    await expect(page.getByRole('radio', { name: /Otro/i })).toBeVisible()
    await expect(page.getByRole('radio', { name: /Twitter|X/i })).toHaveCount(0)

    const response = await productRequest(page, '/v1/onboarding/brand:complete', {
      method: 'POST',
      body: brandPayload('twitter_x'),
    })
    const { code, details } = extractApiError(await response.json())

    expect(response.status()).toBe(422)
    expect(code).toBe('validation.invalid_value')
    expect(details?.allowed).not.toContain('twitter_x')
    await expect(page).toHaveURL(/\/onboarding\/brand\/attribution/)
  })

  test('ESC-5: brand campaign creation accepts official platforms and rejects X', async ({
    page,
    onboardedBrandUser,
  }) => {
    await onboardedBrandUser.signIn(page)
    const workspaceId = await getBrandWorkspaceId(onboardedBrandUser)
    await page.goto('/campaigns/new')
    await expect(page.getByText(/Twitter|Twitch/i)).toHaveCount(0)

    const illegal = await productRequest(page, '/v1/campaigns', {
      method: 'POST',
      workspaceId,
      body: campaignCreatePayload(['instagram', 'x']),
    })
    const illegalError = extractApiError(await illegal.json())
    expect(illegal.status()).toBe(422)
    expect(illegalError.code).toBe('validation.invalid_value')
    expect(illegalError.details?.allowed).toEqual(supportedPlatforms)

    const valid = await productRequest(page, '/v1/campaigns', {
      method: 'POST',
      workspaceId,
      body: campaignCreatePayload(['instagram', 'tiktok']),
    })
    expect(valid.ok()).toBeTruthy()
  })

  test('ESC-6: activating campaign with only legacy platforms renders inline 409', async ({
    page,
    request,
    onboardedBrandUser,
  }) => {
    await onboardedBrandUser.signIn(page)
    const workspaceId = await getBrandWorkspaceId(onboardedBrandUser)
    const campaign = await seedCampaign(request, {
      workspaceId,
      key: 'only-legacy-platforms',
      platforms: ['twitter_x', 'twitch'],
    })

    await page.goto(`/campaigns/${campaign.campaign_id}/configuration/review`)
    await page.getByRole('button', { name: /Activar campaña/i }).click()

    const alert = page.getByRole('alert')
    await expect(alert).toBeVisible()
    await expect(alert).toContainText(/platform|plataformas|soportadas/i)

    const detail = await productRequest(
      page,
      `/v1/campaigns/${campaign.campaign_id}`,
      { workspaceId },
    )
    const body = (await detail.json()) as { status?: string }
    expect(body.status).toBe('draft')
  })

  test('ESC-7: activating campaign with supported plus legacy filters legacy', async ({
    page,
    request,
    onboardedBrandUser,
  }) => {
    await onboardedBrandUser.signIn(page)
    const workspaceId = await getBrandWorkspaceId(onboardedBrandUser)
    const campaign = await seedCampaign(request, {
      workspaceId,
      key: 'mix-legacy-supported',
      platforms: ['instagram', 'twitter_x'],
    })

    const activate = await productRequest(
      page,
      `/v1/campaigns/${campaign.campaign_id}/configuration/activate`,
      {
        method: 'POST',
        workspaceId,
        body: { configuration_version: 1 },
      },
    )
    expect(activate.ok()).toBeTruthy()

    const detail = await productRequest(
      page,
      `/v1/campaigns/${campaign.campaign_id}`,
      { workspaceId },
    )
    const body = (await detail.json()) as {
      status?: string
      platforms?: string[]
    }
    expect(body.status).toBe('active')
    expect(body.platforms).toEqual(['instagram'])

    await page.goto(`/campaigns/${campaign.campaign_id}`)
    await expect(page.getByText(/twitter_x|Twitter|Twitch/i)).toHaveCount(0)
  })

  test('ESC-8: campaign reads and detail filters hide legacy platforms', async ({
    page,
    request,
    onboardedBrandUser,
  }) => {
    await onboardedBrandUser.signIn(page)
    const workspaceId = await getBrandWorkspaceId(onboardedBrandUser)
    const campaign = await seedCampaign(request, {
      workspaceId,
      key: 'legacy-in-storage',
      platforms: ['instagram', 'x', 'twitch'],
      status: 'active',
    })

    const detail = await productRequest(
      page,
      `/v1/campaigns/${campaign.campaign_id}`,
      { workspaceId },
    )
    const body = (await detail.json()) as { platforms?: string[] }
    expect(body.platforms).toEqual(['instagram'])

    await page.goto(`/campaigns/${campaign.campaign_id}?tab=creators`)
    await expectOnlySupportedPlatformOptions(page, /Filter by platform/i)
    await expect(page.getByText(/Twitter|Twitch|x|twitter_x/i)).toHaveCount(0)

    await page.goto(`/campaigns/${campaign.campaign_id}?tab=videos`)
    await expectOnlySupportedPlatformOptions(page, /Filter by platform/i)
    await expect(page.getByText(/Twitter|Twitch|x|twitter_x/i)).toHaveCount(0)
  })

  test('ESC-10: legacy brand attribution reads as unselected in B11', async ({
    page,
    request,
    onboardedBrandUser,
  }) => {
    await onboardedBrandUser.signIn(page)
    const workspaceId = await getBrandWorkspaceId(onboardedBrandUser)
    await testApi(request, '/v1/test/identity/brand-onboarding-profiles/upsert', {
      brand_workspace_id: workspaceId,
      attribution_source: 'twitter_x',
    })

    const response = await productRequest(
      page,
      '/v1/identity/onboarding/brand',
      { workspaceId },
    )
    if (response.ok()) {
      const body = (await response.json()) as {
        attribution_source?: string | null
        attribution?: { source?: string | null } | null
      }
      expect(body.attribution_source ?? body.attribution?.source ?? null).toBe(
        null,
      )
    }

    await onboardedBrandUser.setOnboardingState('onboarding_pending', 'brand')
    await page.goto('/onboarding/brand/attribution')
    await expect(page.getByText(/¿Cómo llegaste a Marz/i)).toBeVisible()
    await expect(page.getByRole('radio', { checked: true })).toHaveCount(0)
    await expect(page.getByRole('radio', { name: /Twitter|X/i })).toHaveCount(0)
  })

  test('ESC-11: creators and videos platform filters reset and keep valid rows', async ({
    page,
    request,
    onboardedBrandUser,
  }, testInfo) => {
    const brandWorkspaceId = await getBrandWorkspaceId(onboardedBrandUser)
    const creator = new TestUser(
      `e2e_feat023_creator_${testInfo.workerIndex}_${Date.now()}`,
      `e2e.feat023.creator.${testInfo.workerIndex}.${Date.now()}+clerk_test@example.com`,
      'FEAT 023 Creator',
    )

    await creator.ensureExists()
    await creator.onboardFull('creator')
    const creatorAccountId = creator.accountId
    if (!creatorAccountId) {
      await creator.delete()
      throw new Error('Expected creator account id')
    }

    try {
      const campaign = await seedCampaign(request, {
        workspaceId: brandWorkspaceId,
        key: 'mixed-creators-valid-filters',
        platforms: ['instagram', 'tiktok', 'youtube'],
        status: 'active',
      })
      await seedParticipant(request, {
        campaignId: campaign.campaign_id,
        workspaceId: brandWorkspaceId,
        creatorAccountId,
        platforms: ['instagram', 'tiktok'],
      })
      await seedVideo(request, {
        campaignId: campaign.campaign_id,
        workspaceId: brandWorkspaceId,
        creatorAccountId,
        platform: 'instagram',
        fixtureKey: 'feat023-instagram-video',
      })
      await seedVideo(request, {
        campaignId: campaign.campaign_id,
        workspaceId: brandWorkspaceId,
        creatorAccountId,
        platform: 'tiktok',
        fixtureKey: 'feat023-tiktok-video',
      })

      await onboardedBrandUser.signIn(page)
      await page.goto(`/campaigns/${campaign.campaign_id}?tab=creators`)
      await expectOnlySupportedPlatformOptions(page, /Filter by platform/i)
      await openPlatformSelect(page, /Filter by platform/i)
      await page.getByRole('option', { name: 'Instagram' }).click()
      await expect(page).toHaveURL(/platform=instagram/)
      await openPlatformSelect(page, /Filter by platform/i)
      await page.getByRole('option', { name: 'TikTok' }).click()
      await expect(page).toHaveURL(/platform=tiktok/)
      await page.getByRole('button', { name: /Clear/i }).click()
      await expect(page).not.toHaveURL(/platform=/)
      await expect(page.getByText(/Twitch/i)).toHaveCount(0)

      await page.goto(`/campaigns/${campaign.campaign_id}?tab=videos`)
      await expectOnlySupportedPlatformOptions(page, /Filter by platform/i)
      await openPlatformSelect(page, /Filter by platform/i)
      await page.getByRole('option', { name: 'Instagram' }).click()
      await expect(page).toHaveURL(/platform=instagram/)
      await openPlatformSelect(page, /Filter by platform/i)
      await page.getByRole('option', { name: 'TikTok' }).click()
      await expect(page).toHaveURL(/platform=tiktok/)
      await page.getByRole('button', { name: /Clear/i }).click()
      await expect(page).not.toHaveURL(/platform=/)
      await expect(page.getByText(/Twitch/i)).toHaveCount(0)
    } finally {
      await creator.delete()
    }
  })
})
