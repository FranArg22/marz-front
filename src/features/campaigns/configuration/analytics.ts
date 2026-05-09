import { track } from '#/shared/analytics/track'
import type { CampaignConfiguration, CampaignConfigurationStep } from './hooks'

const STARTED_DEDUP_WINDOW_MS = 5 * 60 * 1000
const startedByCampaign = new Map<string, number>()

export function trackCampaignConfigurationStarted(campaignId: string): void {
  const now = Date.now()
  const lastStartedAt = startedByCampaign.get(campaignId)
  if (lastStartedAt && now - lastStartedAt < STARTED_DEDUP_WINDOW_MS) return

  startedByCampaign.set(campaignId, now)
  track('campaign_configuration_started', {
    campaign_id: campaignId,
  })
}

export function trackCampaignConfigurationStepCompleted({
  campaignId,
  step,
  previousConfig,
  nextConfig,
}: {
  campaignId: string
  step: CampaignConfigurationStep
  previousConfig: CampaignConfiguration
  nextConfig: CampaignConfiguration
}): void {
  if (!didStepBecomeCompleted(step, previousConfig, nextConfig)) return

  track('campaign_configuration_step_completed', {
    campaign_id: campaignId,
    step,
    configuration_version: nextConfig.configuration_version,
  })
}

export function trackCampaignConfigurationActivated(
  config: CampaignConfiguration,
): void {
  track('campaign_configuration_activated', {
    campaign_id: config.campaign_id,
    content_type: config.content_type,
    pricing_model: config.pricing_model,
    bonus_enabled: config.bonus_config.enabled,
    targeting_adjusted: config.operational_targeting.adjusted_from_brief,
    plan_allows_campaign_board: config.plan.allows_campaign_board,
    plan_allows_automatic_matching: config.plan.allows_automatic_matching,
    configuration_version: config.configuration_version,
  })
}

export function trackCampaignConfigurationAbandoned(
  config: CampaignConfiguration,
): void {
  track('campaign_configuration_abandoned', {
    campaign_id: config.campaign_id,
    current_step: config.current_step,
    configuration_version: config.configuration_version,
  })
}

export function didStepBecomeCompleted(
  step: CampaignConfigurationStep,
  previousConfig: Pick<CampaignConfiguration, 'completed_steps'>,
  nextConfig: Pick<CampaignConfiguration, 'completed_steps'>,
): boolean {
  return (
    !previousConfig.completed_steps.includes(step) &&
    nextConfig.completed_steps.includes(step)
  )
}

export function resetCampaignConfigurationAnalyticsGuards(): void {
  startedByCampaign.clear()
}
