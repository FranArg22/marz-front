import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { createElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  CampaignActivityItem,
  CampaignOverviewResponse,
} from '#/shared/api/generated/model'

import {
  markCampaignEventSeen,
  useCampaignTopicSubscription,
} from './useCampaignTopicSubscription'
import { campaignOverviewQueryKey } from './useCampaignOverviewQuery'

let mockWsHandlers: Record<string, (event: unknown) => void> = {}
let mockWsStatus = 'idle'
const mockSend = vi.fn()

vi.mock('#/shared/ws/useWebSocket', () => ({
  useWebSocket: (opts: {
    handlers?: Record<string, (event: unknown) => void>
    enabled?: boolean
  }) => {
    mockWsHandlers = opts.handlers ?? {}
    return { status: mockWsStatus, send: mockSend }
  },
}))

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('markCampaignEventSeen', () => {
  it('dedupes repeated event ids', () => {
    const seen = new Set<string>()

    expect(markCampaignEventSeen(seen, 'event-1')).toBe(true)
    expect(markCampaignEventSeen(seen, 'event-1')).toBe(false)
  })

  it('keeps the set capped with LRU insertion order', () => {
    const seen = new Set<string>()

    expect(markCampaignEventSeen(seen, 'event-1', 2)).toBe(true)
    expect(markCampaignEventSeen(seen, 'event-2', 2)).toBe(true)
    expect(markCampaignEventSeen(seen, 'event-3', 2)).toBe(true)

    expect([...seen]).toEqual(['event-2', 'event-3'])
    expect(markCampaignEventSeen(seen, 'event-1', 2)).toBe(true)
  })
})

describe('useCampaignTopicSubscription', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    mockWsStatus = 'idle'
    mockWsHandlers = {}
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
  })

  it('subscribes and unsubscribes to the campaign topic while open', () => {
    mockWsStatus = 'open'

    const { unmount } = renderHook(
      () => useCampaignTopicSubscription('campaign-1'),
      { wrapper: createWrapper(queryClient) },
    )

    expect(mockSend).toHaveBeenCalledWith({
      type: 'subscribe',
      topic: 'campaign:campaign-1',
    })

    unmount()

    expect(mockSend).toHaveBeenCalledWith({
      type: 'unsubscribe',
      topic: 'campaign:campaign-1',
    })
  })

  it('invalidates applications when discovery applications change', () => {
    mockWsStatus = 'open'
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    renderHook(() => useCampaignTopicSubscription('campaign-1'), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      mockWsHandlers['campaigns.discovery.updated']?.({
        event_id: 'event-1',
        event_type: 'campaigns.discovery.updated',
        schema_version: 'v1',
        aggregate_id: 'campaign-1',
        aggregate_type: 'campaign',
        occurred_at: '2026-05-09T00:00:00Z',
        payload: {
          campaign_id: 'campaign-1',
          changed: { section: 'applications' },
        },
      })
    })

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['campaign', 'campaign-1', 'applications'],
    })
  })

  it('dedupes websocket events before invalidating applications', () => {
    mockWsStatus = 'open'
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    renderHook(() => useCampaignTopicSubscription('campaign-1'), {
      wrapper: createWrapper(queryClient),
    })

    const event = {
      event_id: 'event-1',
      event_type: 'campaigns.discovery.updated',
      schema_version: 'v1',
      aggregate_id: 'campaign-1',
      aggregate_type: 'campaign',
      occurred_at: '2026-05-09T00:00:00Z',
      payload: {
        campaign_id: 'campaign-1',
        changed: { section: 'applications' },
      },
    }

    act(() => {
      mockWsHandlers['campaigns.discovery.updated']?.(event)
      mockWsHandlers['campaigns.discovery.updated']?.({
        ...event,
        payload: {
          campaign_id: 'campaign-1',
          changed: { section: 'applications' },
        },
      })
    })

    expect(invalidateSpy).toHaveBeenCalledTimes(1)
  })

  it('prepends activity when the overview cache exists', () => {
    mockWsStatus = 'open'
    const initialActivity = makeActivity('activity-1')
    queryClient.setQueryData<CampaignOverviewResponse>(
      campaignOverviewQueryKey('campaign-1'),
      {
        applications_count: 1,
        reach_available: false,
        reach: null,
        budget_total_usd: '1000',
        budget_spent_usd: '0',
        spend_paid_usd: '0.00',
        spend_pending_approval_usd: '0.00',
        spend_pending_offers_usd: '0.00',
        spend_pending_offers_count: 0,
        offers_count: 0,
        spend_committed_usd: '0.00',
        campaign: {
          campaign_id: 'campaign-1',
          name: 'Campaign',
          status: 'draft',
          objective: 'awareness',
          deadline: null,
          platforms: [],
          audience_description: null,
          content_model: null,
          pricing_model: null,
          action_flags: {
            can_edit: true,
            can_activate: false,
            can_pause: false,
            can_resume: false,
          },
        },
        creators_preview: [],
        recent_activity: [initialActivity],
      },
    )

    renderHook(() => useCampaignTopicSubscription('campaign-1'), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      mockWsHandlers['campaigns.activity.created']?.({
        event_id: 'event-1',
        event_type: 'campaigns.activity.created',
        schema_version: 'v1',
        aggregate_id: 'campaign-1',
        aggregate_type: 'campaign',
        occurred_at: '2026-05-09T00:00:00Z',
        payload: {
          campaign_id: 'campaign-1',
          activity: makeActivity('activity-2'),
        },
      })
    })

    expect(
      queryClient
        .getQueryData<CampaignOverviewResponse>(
          campaignOverviewQueryKey('campaign-1'),
        )
        ?.recent_activity.map((item) => item.id),
    ).toEqual(['activity-2', 'activity-1'])
  })
})

function makeActivity(id: string): CampaignActivityItem {
  return {
    id,
    source: 'discovery',
    source_ref_type: 'application',
    source_ref_id: id,
    actor_account_id: null,
    creator_account_id: null,
    title: 'Activity',
    body: null,
    occurred_at: '2026-05-09T00:00:00Z',
  }
}
