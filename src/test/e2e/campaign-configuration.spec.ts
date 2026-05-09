import { test, expect } from './fixtures'

const campaignId = '00000000-0000-4000-8000-000000000101'
const brandWorkspaceId = '00000000-0000-4000-8000-000000000102'

type ConfigurationStep =
  | 'content_type'
  | 'pricing_model'
  | 'targeting'
  | 'bonus'
  | 'review'

function makeConfiguration(state: {
  currentStep: ConfigurationStep
  completedSteps: ConfigurationStep[]
  configurationVersion: number
  contentType: 'influencer_posts' | 'ugc_videos' | null
  pricingModel: 'fixed_per_video' | 'per_views' | null
}) {
  return {
    campaign_id: campaignId,
    brand_workspace_id: brandWorkspaceId,
    status: 'draft',
    editable: true,
    block_reason: null,
    current_step: state.currentStep,
    completed_steps: state.completedSteps,
    configuration_complete: false,
    configuration_version: state.configurationVersion,
    content_type: state.contentType,
    pricing_model: state.pricingModel,
    operational_targeting: {
      countries: [],
      tiers: [],
      follower_min: null,
      follower_max: null,
      genders: [],
      age_min: null,
      age_max: null,
      interests: [],
      content_languages: [],
      source: 'brief_prefill',
      adjusted_from_brief: false,
    },
    bonus_config: {
      enabled: false,
      speed_bonus: { enabled: false, windows: [] },
      performance_bonus: { enabled: false, milestones: [] },
    },
    brief_summary: {
      confirmed_at: '2026-05-09T10:00:00Z',
      objective: 'brand_awareness',
      icp_description: null,
      icp_age_min: null,
      icp_age_max: null,
      icp_genders: [],
      icp_countries: [],
      icp_platforms: [],
      icp_interests: [],
      scoring_dimensions_count: 0,
      hard_filters_count: 0,
      disqualifiers_count: 0,
    },
    plan: {
      workspace_plan: 'paid',
      allows_campaign_board: true,
      allows_automatic_matching: true,
    },
    updated_at: '2026-05-09T10:00:00Z',
  }
}

test.describe('Campaign configuration wizard', () => {
  test('completa content type y pricing model preservando selección tras reload', async ({
    page,
    onboardedBrandUser,
  }) => {
    const state = {
      currentStep: 'content_type' as ConfigurationStep,
      completedSteps: [] as ConfigurationStep[],
      configurationVersion: 1,
      contentType: null as 'influencer_posts' | 'ugc_videos' | null,
      pricingModel: null as 'fixed_per_video' | 'per_views' | null,
    }

    await page.route(`**/v1/campaigns/${campaignId}/configuration`, (route) =>
      route.fulfill({ json: makeConfiguration(state) }),
    )
    await page.route(
      `**/v1/campaigns/${campaignId}/configuration/content_type`,
      async (route) => {
        const body = route.request().postDataJSON() as {
          content_type: 'influencer_posts' | 'ugc_videos'
          configuration_version: number
        }
        expect(body).toEqual({
          content_type: 'ugc_videos',
          configuration_version: 1,
        })
        state.contentType = body.content_type
        state.currentStep = 'pricing_model'
        state.completedSteps = ['content_type']
        state.configurationVersion = 2
        await route.fulfill({ json: makeConfiguration(state) })
      },
    )
    await page.route(
      `**/v1/campaigns/${campaignId}/configuration/pricing_model`,
      async (route) => {
        const body = route.request().postDataJSON() as {
          pricing_model: 'fixed_per_video' | 'per_views'
          configuration_version: number
        }
        expect(body).toEqual({
          pricing_model: 'per_views',
          configuration_version: 2,
        })
        state.pricingModel = body.pricing_model
        state.currentStep = 'targeting'
        state.completedSteps = ['content_type', 'pricing_model']
        state.configurationVersion = 3
        await route.fulfill({ json: makeConfiguration(state) })
      },
    )

    await onboardedBrandUser.signIn(page)
    await page.goto(`/campaigns/${campaignId}/configuration`)

    await expect(page).toHaveURL(
      new RegExp(`/campaigns/${campaignId}/configuration/content_type$`),
    )
    await page.getByRole('button', { name: /ugc videos/i }).click()
    await page.getByRole('button', { name: /continuar/i }).click()

    await expect(page).toHaveURL(
      new RegExp(`/campaigns/${campaignId}/configuration/pricing_model$`),
    )

    await page.reload()
    await expect(page).toHaveURL(
      new RegExp(`/campaigns/${campaignId}/configuration/pricing_model$`),
    )
    await page.getByRole('button', { name: /atrás/i }).click()
    await expect(
      page.getByRole('button', { name: /ugc videos/i }),
    ).toHaveAttribute('aria-pressed', 'true')

    await page.goto(`/campaigns/${campaignId}/configuration/pricing_model`)
    await expect(page).toHaveURL(
      new RegExp(`/campaigns/${campaignId}/configuration/pricing_model$`),
    )

    await page.getByRole('button', { name: /per views/i }).click()
    await page.getByRole('button', { name: /continuar/i }).click()

    await expect(page).toHaveURL(
      new RegExp(`/campaigns/${campaignId}/configuration/targeting$`),
    )
  })
})
