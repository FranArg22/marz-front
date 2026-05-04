import { track } from '#/shared/analytics/track'

import type { BrandWorkspaceSearch } from './workspaceSearchSchema'

type FilterValue = BrandWorkspaceSearch['filter']

export function trackWorkspaceOpened(payload: {
  session_kind: 'brand' | 'creator'
}): void {
  track('workspace_opened', payload)
}

export function trackConversationRailSearch(payload: {
  has_results: boolean
  query_length: number
}): void {
  track('conversation_rail_search', payload)
}

export function trackConversationFilterChanged(payload: {
  filter: FilterValue
}): void {
  track('conversation_filter_changed', payload)
}

export function trackConversationCampaignFilterChanged(payload: {
  has_campaign: boolean
}): void {
  track('conversation_campaign_filter_changed', payload)
}
