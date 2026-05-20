import type { APIResponse, Page, TestInfo } from '@playwright/test'
import { createHash } from 'node:crypto'

import {
  expect,
  getClerkSessionToken,
  test,
  TestUser,
} from '../fixtures'

const API_BASE_URL = (
  process.env.VITE_API_URL ??
  process.env.API_URL ??
  'http://localhost:8080'
).replace(/\/$/, '')

const TEST_SECRET = process.env.MARZ_TEST_SECRET
const RUN_ID = process.env.E2E_RUN_ID ?? `${Date.now().toString(36)}${process.pid}`
const supportedPlatforms = ['instagram', 'tiktok', 'youtube'] as const

type SupportedPlatform = (typeof supportedPlatforms)[number]
type ApiErrorEnvelope = {
  code?: string
  message?: string
  details?: Record<string, unknown>
  error?: ApiErrorEnvelope
}

type CreatorChannelInput = {
  platform: string
  handle: string
}

type TestCampaign = {
  campaign_id: string
  brand_workspace_id: string
  status: string
  target_platforms?: string[]
}

function extractApiError(raw: unknown): {
  code?: string
  message?: string
  details?: Record<string, unknown>
} {
  const body = (raw ?? {}) as ApiErrorEnvelope
  if (body.code) {
    return { code: body.code, message: body.message, details: body.details }
  }
  if (body.error?.code) {
    return {
      code: body.error.code,
      message: body.error.message,
      details: body.error.details,
    }
  }
  return {}
}

async function responseJson(response: APIResponse): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  return JSON.parse(text) as unknown
}

function uniqueKey(testInfo: TestInfo, suffix: string) {
  const hash = createHash('sha1')
    .update(`${testInfo.testId}:${suffix}`)
    .digest('hex')
    .slice(0, 8)
  return `${testInfo.workerIndex}.${RUN_ID}.${hash}`
}

function makeUser(testInfo: TestInfo, kind: 'brand' | 'creator', suffix: string) {
  const key = uniqueKey(testInfo, `${kind}.${suffix}`)
  return new TestUser(
    `e2e_feat023_${kind}_${key}`,
    `e2e.feat023.${kind}.${key}+clerk_test@example.com`,
    `E2E FEAT023 ${kind}`,
  )
}

async function productRequest(
  page: Page,
  method: string,
  path: string,
  params: {
    token: string
    workspaceId?: string
    data?: unknown
  },
) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${params.token}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
  if (params.workspaceId) headers['X-Brand-Workspace-Id'] = params.workspaceId

  return page.request.fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    data: params.data,
  })
}

async function testApiPost<T>(
  page: Page,
  path: string,
  data: Record<string, unknown>,
): Promise<T> {
  if (!TEST_SECRET) {
    throw new Error('MARZ_TEST_SECRET is required for FEAT-023 E2E fixtures')
  }

  const response = await page.request.post(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Test-Secret': TEST_SECRET,
    },
    data,
  })
  const body = await responseJson(response)
  expect(response.ok(), `${path} failed: ${JSON.stringify(body)}`).toBe(true)
  return body as T
}

async function expectSupportedPlatformOptions(page: Page) {
  await page.getByRole('button', { name: /Agregar canal/i }).click()
  const trigger = page.getByRole('combobox').first()
  await trigger.click()

  await expect(page.getByRole('option', { name: 'Instagram' })).toBeVisible()
  await expect(page.getByRole('option', { name: 'TikTok' })).toBeVisible()
  await expect(page.getByRole('option', { name: 'YouTube' })).toBeVisible()
  await expect(page.getByRole('option', { name: /Twitch/i })).toHaveCount(0)
  await expect(page.getByRole('option', { name: /Twitter|^X$/i })).toHaveCount(0)
}

async function patchCreatorChannels(
  page: Page,
  token: string,
  channels: CreatorChannelInput[],
) {
  return productRequest(page, 'PATCH', '/v1/creators/me/channels', {
    token,
    data: {
      channels: channels.map((channel, index) => ({
        platform: channel.platform,
        external_handle: channel.handle,
        external_url: null,
        followers: null,
        verified: false,
        is_primary: index === 0,
        rate_cards: [],
      })),
    },
  })
}

function expectInvalidPlatformError(raw: unknown, value: string) {
  const { code, details } = extractApiError(raw)
  expect(code).toBe('validation.invalid_value')
  expect(String(details?.field ?? '')).toContain('platform')
  expect(details?.value).toBe(value)
  expect(details?.allowed).toEqual([...supportedPlatforms])
}

function validBrandPayload(source: string) {
  return {
    name: `Feat023 Brand ${source}`,
    website_url: 'https://example.com',
    primary_color_hex: '#0EA5E9',
    secondary_color_hex: '#111827',
    brandfetch_snapshot: null,
    vertical: 'tech',
    marketing_objective: 'awareness',
    creator_experience: 'never',
    creator_sourcing_intent: 'discover_in_marz',
    monthly_budget_range: 'under_10k',
    timing: 'this_month',
    attribution: { source },
    contact_name: 'E2E Brand Contact',
    contact_title: 'Growth',
    contact_whatsapp_e164: '+15555550123',
  }
}

function campaignCreatePayload(platforms: string[]) {
  return {
    name: `Feat023 Campaign ${platforms.join('-')}`,
    objective: 'brand_awareness',
    budget_amount: '1000',
    budget_currency: 'USD',
    deadline: null,
    brief: {
      brief_source_url: 'https://example.com/brief',
      brief_source_text: 'Brief de prueba FEAT-023',
      tone: 'Directo',
      key_messages: ['Mensaje principal'],
      do_list: [],
      dont_list: [],
      reference_links: [],
      icp_description: 'Creators de prueba',
      icp_age_min: null,
      icp_age_max: null,
      icp_genders: [],
      icp_countries: ['AR'],
      icp_platforms: platforms,
      icp_interests: [],
      scoring_dimensions: [],
      hard_filters: [],
      disqualifiers: [],
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
    interests: [],
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
  page: Page,
  brandWorkspaceId: string,
  testInfo: TestInfo,
  params: {
    key: string
    status?: 'draft' | 'active'
    targetPlatforms: string[]
  },
) {
  return testApiPost<TestCampaign>(page, '/v1/test/campaigns/campaigns/upsert', {
    brand_workspace_id: brandWorkspaceId,
    campaign_key: uniqueKey(testInfo, params.key),
    name: `Feat023 ${params.key}`,
    status: params.status ?? 'draft',
    objective: 'brand_awareness',
    budget_amount: '1000',
    budget_currency: 'USD',
    deadline: '2026-06-30T00:00:00Z',
    content_type: 'influencer_posts',
    pricing_model: 'fixed_per_video',
    target_platforms: params.targetPlatforms,
    operational_targeting: operationalTargeting(),
    bonus_config: bonusConfig(),
    configuration_current_step: 'review',
    configuration_completed_steps: [
      'content_type',
      'pricing_model',
      'targeting',
      'bonus',
      'review',
    ],
    configuration_complete: true,
    read_dependencies: true,
  })
}

async function seedParticipant(
  page: Page,
  campaignId: string,
  brandWorkspaceId: string,
  creatorAccountId: string,
  platforms: SupportedPlatform[],
) {
  await testApiPost(page, '/v1/test/campaigns/participants/upsert', {
    campaign_id: campaignId,
    brand_workspace_id: brandWorkspaceId,
    creator_account_id: creatorAccountId,
    current_platforms: platforms,
    status: 'active',
    source: 'manual',
  })
}

async function seedVideo(
  page: Page,
  campaignId: string,
  brandWorkspaceId: string,
  creatorAccountId: string,
  platform: SupportedPlatform,
  testInfo: TestInfo,
) {
  await testApiPost(page, '/v1/test/deliverables/videos/upsert', {
    campaign_id: campaignId,
    brand_workspace_id: brandWorkspaceId,
    creator_account_id: creatorAccountId,
    platform,
    fixture_key: uniqueKey(testInfo, `video.${platform}`),
    url: `https://example.com/${platform}/${uniqueKey(testInfo, platform)}`,
    status: 'link_submitted',
  })
}

test.describe('FEAT-023 eliminación de Twitter/X y Twitch', () => {
  test('ESC-1: creator no puede guardar Twitch como Creator channel', async ({
    page,
    creatorOnboardingUser,
  }) => {
    await creatorOnboardingUser.signIn(page)
    await page.goto('/onboarding/creator/channels')
    await expectSupportedPlatformOptions(page)

    const token = await getClerkSessionToken(page)
    const response = await patchCreatorChannels(page, token, [
      { platform: 'twitch', handle: 'creator_fe23' },
    ])
    const body = await responseJson(response)

    expect(response.status()).toBe(422)
    expectInvalidPlatformError(body, 'twitch')

    const me = await productRequest(page, 'GET', '/v1/me', { token })
    const meBody = (await responseJson(me)) as { onboarding_status?: string }
    expect(meBody.onboarding_status).toBe('onboarding_pending')
  })

  test('ESC-2: creator happy-path con plataformas oficiales', async ({
    page,
    creatorOnboardingUser,
  }) => {
    await creatorOnboardingUser.signIn(page)
    await page.goto('/onboarding/creator/channels')
    await expectSupportedPlatformOptions(page)

    const token = await getClerkSessionToken(page)
    const response = await patchCreatorChannels(page, token, [
      { platform: 'instagram', handle: 'creator_fe23_ig' },
    ])
    const body = await responseJson(response)

    expect(response.ok(), JSON.stringify(body)).toBe(true)
    const channelsResponse = await productRequest(
      page,
      'GET',
      '/v1/creators/me/channels',
      { token },
    )
    const channelsBody = await responseJson(channelsResponse)
    expect(channelsResponse.ok(), JSON.stringify(channelsBody)).toBe(true)
    expect(JSON.stringify(channelsBody)).toContain('creator_fe23_ig')
    expect(JSON.stringify(channelsBody)).toContain('instagram')
  })

  test('ESC-3: creator no puede guardar Twitter/X como Creator channel', async ({
    page,
    creatorOnboardingUser,
  }) => {
    await creatorOnboardingUser.signIn(page)
    await page.goto('/onboarding/creator/channels')
    await expectSupportedPlatformOptions(page)

    const token = await getClerkSessionToken(page)
    const response = await patchCreatorChannels(page, token, [
      { platform: 'twitter_x', handle: 'creator_fe23_x' },
    ])
    const body = await responseJson(response)

    expect(response.status()).toBe(422)
    expectInvalidPlatformError(body, 'twitter_x')
  })

  test('ESC-4: brand B11 attribution sin Twitter/X', async ({
    page,
    brandOnboardingUser,
  }) => {
    await brandOnboardingUser.signIn(page)
    await page.goto('/onboarding/brand/attribution')

    await expect(page.getByRole('radio', { name: 'Instagram' })).toBeVisible()
    await expect(page.getByRole('radio', { name: 'TikTok' })).toBeVisible()
    await expect(page.getByRole('radio', { name: 'LinkedIn' })).toBeVisible()
    await expect(page.getByRole('radio', { name: 'Reddit' })).toBeVisible()
    await expect(page.getByRole('radio', { name: /Twitter|^X$/i })).toHaveCount(0)

    const token = await getClerkSessionToken(page)
    const response = await productRequest(
      page,
      'POST',
      '/v1/onboarding/brand:complete',
      { token, data: validBrandPayload('twitter_x') },
    )
    const body = await responseJson(response)
    const { code, details } = extractApiError(body)

    expect(response.status()).toBe(422)
    expect(code).toBe('validation.invalid_value')
    expect(String(details?.field ?? '')).toContain('attribution')
    expect(details?.allowed).not.toContain('twitter_x')
  })

  test('ESC-5: brand crea Campaign draft con plataformas oficiales y rechaza X', async ({
    page,
    onboardedBrandUser,
  }) => {
    const me = await onboardedBrandUser.onboardFull('brand')
    const workspaceId = me.brand_workspace?.id
    expect(workspaceId).toBeTruthy()

    await onboardedBrandUser.signIn(page)
    const token = await getClerkSessionToken(page)
    const illegal = await productRequest(page, 'POST', '/v1/campaigns', {
      token,
      workspaceId,
      data: campaignCreatePayload(['instagram', 'x']),
    })
    const illegalBody = await responseJson(illegal)
    const illegalError = extractApiError(illegalBody)

    expect(illegal.status()).toBe(422)
    expect(illegalError.code).toBe('validation.invalid_value')
    expect(JSON.stringify(illegalError.details ?? {})).toContain('x')

    const valid = await productRequest(page, 'POST', '/v1/campaigns', {
      token,
      workspaceId,
      data: campaignCreatePayload(['instagram', 'tiktok']),
    })
    const validBody = await responseJson(valid)

    expect(valid.ok(), JSON.stringify(validBody)).toBe(true)
    expect(JSON.stringify(validBody)).toContain('draft')
  })

  test('ESC-6: activar Campaign sin plataformas operativas muestra 409 inline en ReviewStep', async ({
    page,
  }, testInfo) => {
    const brand = makeUser(testInfo, 'brand', 'esc6')
    try {
      await brand.ensureExists()
      const me = await brand.onboardFull('brand')
      const workspaceId = me.brand_workspace?.id
      expect(workspaceId).toBeTruthy()
      const campaign = await seedCampaign(page, workspaceId!, testInfo, {
        key: 'legacy-only',
        targetPlatforms: ['x', 'twitch'],
      })

      await brand.signIn(page)
      await page.goto(`/campaigns/${campaign.campaign_id}/configuration/review`)
      await page.getByRole('button', { name: /Activar campaña/i }).click()

      const alert = await page.getByRole('alert')
      await expect(alert).toBeVisible()
      await expect(alert).toContainText(/platform|plataformas/i)

      const token = await getClerkSessionToken(page)
      const detail = await productRequest(
        page,
        'GET',
        `/v1/campaigns/${campaign.campaign_id}/detail`,
        { token, workspaceId },
      )
      const detailBody = JSON.stringify(await responseJson(detail))
      expect(detailBody).toContain('draft')
      expect(detailBody).not.toContain('"active"')
    } finally {
      await brand.delete().catch(() => {})
    }
  })

  test('ESC-7: activar Campaign con mix válido y legacy activa y filtra legacy', async ({
    page,
  }, testInfo) => {
    const brand = makeUser(testInfo, 'brand', 'esc7')
    try {
      await brand.ensureExists()
      const me = await brand.onboardFull('brand')
      const workspaceId = me.brand_workspace?.id
      expect(workspaceId).toBeTruthy()
      const campaign = await seedCampaign(page, workspaceId!, testInfo, {
        key: 'mixed-platforms',
        targetPlatforms: ['instagram', 'x'],
      })

      await brand.signIn(page)
      const token = await getClerkSessionToken(page)
      const config = await productRequest(
        page,
        'GET',
        `/v1/campaigns/${campaign.campaign_id}/configuration`,
        { token, workspaceId },
      )
      const configBody = (await responseJson(config)) as {
        configuration_version?: number
      }
      const activation = await productRequest(
        page,
        'POST',
        `/v1/campaigns/${campaign.campaign_id}/configuration/activate`,
        {
          token,
          workspaceId,
          data: { configuration_version: configBody.configuration_version ?? 1 },
        },
      )
      const activationBody = await responseJson(activation)
      expect(activation.ok(), JSON.stringify(activationBody)).toBe(true)

      const detail = await productRequest(
        page,
        'GET',
        `/v1/campaigns/${campaign.campaign_id}/detail`,
        { token, workspaceId },
      )
      const detailText = JSON.stringify(await responseJson(detail))
      expect(detailText).toContain('active')
      expect(detailText).toContain('instagram')
      expect(detailText).not.toContain('twitter_x')
      expect(detailText).not.toContain('"x"')
      expect(detailText).not.toContain('twitch')
    } finally {
      await brand.delete().catch(() => {})
    }
  })

  test('ESC-8: GET campaigns con fixtures legacy no expone legacy en reads', async ({
    page,
  }, testInfo) => {
    const brand = makeUser(testInfo, 'brand', 'esc8-brand')
    const creator = makeUser(testInfo, 'creator', 'esc8-creator')
    try {
      await Promise.all([brand.ensureExists(), creator.ensureExists()])
      const [brandMe, creatorMe] = await Promise.all([
        brand.onboardFull('brand'),
        creator.onboardFull('creator'),
      ])
      const workspaceId = brandMe.brand_workspace?.id
      expect(workspaceId).toBeTruthy()
      const campaign = await seedCampaign(page, workspaceId!, testInfo, {
        key: 'legacy-read-filter',
        status: 'active',
        targetPlatforms: ['instagram', 'x', 'twitch'],
      })
      await seedParticipant(page, campaign.campaign_id, workspaceId!, creatorMe.id, [
        'instagram',
      ])
      await seedVideo(
        page,
        campaign.campaign_id,
        workspaceId!,
        creatorMe.id,
        'instagram',
        testInfo,
      )

      await brand.signIn(page)
      const token = await getClerkSessionToken(page)
      const [detail, participants, videos] = await Promise.all([
        productRequest(
          page,
          'GET',
          `/v1/campaigns/${campaign.campaign_id}/detail`,
          { token, workspaceId },
        ),
        productRequest(
          page,
          'GET',
          `/v1/campaigns/${campaign.campaign_id}/participants`,
          { token, workspaceId },
        ),
        productRequest(
          page,
          'GET',
          `/v1/campaigns/${campaign.campaign_id}/videos`,
          { token, workspaceId },
        ),
      ])
      const combined = JSON.stringify([
        await responseJson(detail),
        await responseJson(participants),
        await responseJson(videos),
      ])
      expect(combined).toContain('instagram')
      expect(combined).not.toContain('"x"')
      expect(combined).not.toContain('twitch')

      await page.goto(`/campaigns/${campaign.campaign_id}?tab=creators`)
      await expect(page.getByRole('combobox', { name: /Filter by platform/i })).toBeVisible()
      await expect(page.getByText(/Twitter|Twitch|twitter_x/i)).toHaveCount(0)

      await page.goto(`/campaigns/${campaign.campaign_id}?tab=videos`)
      await expect(page.getByRole('combobox', { name: /Filter by platform/i })).toBeVisible()
      await expect(page.getByText(/Twitter|Twitch|twitter_x/i)).toHaveCount(0)
    } finally {
      await Promise.all([
        brand.delete().catch(() => {}),
        creator.delete().catch(() => {}),
      ])
    }
  })

  test('ESC-10: GET brand onboarding con attribution legacy responde sin twitter_x', async ({
    page,
  }, testInfo) => {
    const brand = makeUser(testInfo, 'brand', 'esc10')
    try {
      await brand.ensureExists()
      const me = await brand.onboardFull('brand')
      const workspaceId = me.brand_workspace?.id
      expect(workspaceId).toBeTruthy()
      await testApiPost(page, '/v1/test/identity/brand-onboarding-profiles/upsert', {
        brand_workspace_id: workspaceId,
        attribution_source: 'twitter_x',
        completed_by_account_id: me.id,
      })

      await brand.signIn(page)
      const token = await getClerkSessionToken(page)
      const response = await productRequest(
        page,
        'GET',
        '/v1/identity/onboarding/brand',
        { token, workspaceId },
      )
      const bodyText = JSON.stringify(await responseJson(response))
      expect(response.ok(), bodyText).toBe(true)
      expect(bodyText).not.toContain('twitter_x')

      await page.goto('/onboarding/brand/attribution')
      await expect(page.getByRole('radio', { checked: true })).toHaveCount(0)
      await expect(page.getByRole('radio', { name: /Twitter|^X$/i })).toHaveCount(0)
    } finally {
      await brand.delete().catch(() => {})
    }
  })

  test('ESC-11: filtros de creators/videos tras quitar Twitch hacen reset y muestran resultados válidos', async ({
    page,
  }, testInfo) => {
    const brand = makeUser(testInfo, 'brand', 'esc11-brand')
    const creator = makeUser(testInfo, 'creator', 'esc11-creator')
    try {
      await Promise.all([brand.ensureExists(), creator.ensureExists()])
      const [brandMe, creatorMe] = await Promise.all([
        brand.onboardFull('brand'),
        creator.onboardFull('creator'),
      ])
      const workspaceId = brandMe.brand_workspace?.id
      expect(workspaceId).toBeTruthy()
      const campaign = await seedCampaign(page, workspaceId!, testInfo, {
        key: 'filter-reset',
        status: 'active',
        targetPlatforms: ['instagram', 'tiktok', 'twitch'],
      })
      await seedParticipant(page, campaign.campaign_id, workspaceId!, creatorMe.id, [
        'instagram',
      ])
      await seedVideo(
        page,
        campaign.campaign_id,
        workspaceId!,
        creatorMe.id,
        'instagram',
        testInfo,
      )

      await brand.signIn(page)
      await page.goto(`/campaigns/${campaign.campaign_id}?tab=creators`)
      const creatorsPlatform = page.getByRole('combobox', {
        name: /Filter by platform/i,
      })
      await creatorsPlatform.click()
      await expect(page.getByRole('option', { name: 'Instagram' })).toBeVisible()
      await expect(page.getByRole('option', { name: 'TikTok' })).toBeVisible()
      await expect(page.getByRole('option', { name: 'YouTube' })).toBeVisible()
      await expect(page.getByRole('option', { name: /Twitch/i })).toHaveCount(0)
      await page.getByRole('option', { name: 'Instagram' }).click()
      await expect(page).toHaveURL(/platform=instagram/)
      await page.getByRole('button', { name: /Clear/i }).click()
      await expect(page).not.toHaveURL(/platform=instagram/)
      await expect(page.getByText(/Twitch|Twitter|twitter_x/i)).toHaveCount(0)

      await page.goto(`/campaigns/${campaign.campaign_id}?tab=videos`)
      const videosPlatform = page.getByRole('combobox', {
        name: /Filter by platform/i,
      })
      await videosPlatform.click()
      await expect(page.getByRole('option', { name: 'Instagram' })).toBeVisible()
      await expect(page.getByRole('option', { name: 'TikTok' })).toBeVisible()
      await expect(page.getByRole('option', { name: 'YouTube' })).toBeVisible()
      await expect(page.getByRole('option', { name: /Twitch/i })).toHaveCount(0)
      await page.getByRole('option', { name: 'Instagram' }).click()
      await expect(page).toHaveURL(/platform=instagram/)
      await page.getByRole('button', { name: /Clear/i }).click()
      await expect(page).not.toHaveURL(/platform=instagram/)
      await expect(page.getByText(/Twitch|Twitter|twitter_x/i)).toHaveCount(0)
    } finally {
      await Promise.all([
        brand.delete().catch(() => {}),
        creator.delete().catch(() => {}),
      ])
    }
  })
})
