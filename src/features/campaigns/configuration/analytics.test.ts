import { beforeEach, describe, expect, it } from 'vitest'

import { getTrackedEvents, resetTrackedEvents } from '#/shared/analytics/track'
import {
  didStepBecomeCompleted,
  resetCampaignConfigurationAnalyticsGuards,
  trackCampaignConfigurationStarted,
  trackCampaignConfigurationStepCompleted,
} from './analytics'
import type { CampaignConfiguration } from './hooks'

const campaignId = '00000000-0000-4000-8000-000000000001'

function makeConfig(
  overrides: Partial<CampaignConfiguration> = {},
): CampaignConfiguration {
  return {
    campaign_id: campaignId,
    brand_workspace_id: '00000000-0000-4000-8000-000000000002',
    status: 'draft',
    editable: true,
    block_reason: null,
    current_step: 'content_type',
    completed_steps: [],
    configuration_complete: false,
    configuration_version: 1,
    content_type: null,
    pricing_model: null,
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
    ...overrides,
  }
}

describe('campaign configuration analytics', () => {
  beforeEach(() => {
    resetTrackedEvents()
    resetCampaignConfigurationAnalyticsGuards()
  })

  it('deduplicates started events for the same campaign', () => {
    trackCampaignConfigurationStarted(campaignId)
    trackCampaignConfigurationStarted(campaignId)

    expect(getTrackedEvents()).toHaveLength(1)
    expect(getTrackedEvents()[0]?.event).toBe('campaign_configuration_started')
  })

  it('detects when a step becomes completed', () => {
    expect(
      didStepBecomeCompleted(
        'content_type',
        makeConfig({ completed_steps: [] }),
        makeConfig({ completed_steps: ['content_type'] }),
      ),
    ).toBe(true)
  })

  it('does not emit step_completed when re-saving an already completed step', () => {
    trackCampaignConfigurationStepCompleted({
      campaignId,
      step: 'content_type',
      previousConfig: makeConfig({ completed_steps: ['content_type'] }),
      nextConfig: makeConfig({
        completed_steps: ['content_type'],
        configuration_version: 2,
      }),
    })

    expect(getTrackedEvents()).toHaveLength(0)
  })

  it('emits step_completed when a step moves from incomplete to complete', () => {
    trackCampaignConfigurationStepCompleted({
      campaignId,
      step: 'content_type',
      previousConfig: makeConfig({ completed_steps: [] }),
      nextConfig: makeConfig({
        completed_steps: ['content_type'],
        configuration_version: 2,
      }),
    })

    expect(getTrackedEvents()).toEqual([
      expect.objectContaining({
        event: 'campaign_configuration_step_completed',
        payload: {
          campaign_id: campaignId,
          step: 'content_type',
          configuration_version: 2,
        },
      }),
    ])
  })
})
