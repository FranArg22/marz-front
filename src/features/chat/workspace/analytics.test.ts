import { describe, it, expect, vi, beforeEach } from 'vitest'

import {
  trackConversationCampaignFilterChanged,
  trackConversationFilterChanged,
  trackConversationRailSearch,
  trackWorkspaceOpened,
} from './analytics'
import * as trackModule from '#/shared/analytics/track'

describe('workspace analytics', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('emits workspace_opened with session_kind', () => {
    const spy = vi.spyOn(trackModule, 'track')
    trackWorkspaceOpened({ session_kind: 'brand' })
    expect(spy).toHaveBeenCalledWith('workspace_opened', {
      session_kind: 'brand',
    })
  })

  it('emits conversation_rail_search with has_results and query_length', () => {
    const spy = vi.spyOn(trackModule, 'track')
    trackConversationRailSearch({ has_results: true, query_length: 5 })
    expect(spy).toHaveBeenCalledWith('conversation_rail_search', {
      has_results: true,
      query_length: 5,
    })
  })

  it('emits conversation_filter_changed with the new filter', () => {
    const spy = vi.spyOn(trackModule, 'track')
    trackConversationFilterChanged({ filter: 'unread' })
    expect(spy).toHaveBeenCalledWith('conversation_filter_changed', {
      filter: 'unread',
    })
  })

  it('emits conversation_campaign_filter_changed with has_campaign', () => {
    const spy = vi.spyOn(trackModule, 'track')
    trackConversationCampaignFilterChanged({ has_campaign: false })
    expect(spy).toHaveBeenCalledWith('conversation_campaign_filter_changed', {
      has_campaign: false,
    })
  })
})
