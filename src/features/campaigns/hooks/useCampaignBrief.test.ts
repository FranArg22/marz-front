import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { createElement } from 'react'

const mockGetCampaignBrief = vi.fn()

vi.mock('#/shared/api/generated/campaigns/campaigns', () => ({
  getCampaignBrief: (...args: unknown[]) => mockGetCampaignBrief(...args),
  getGetCampaignBriefQueryKey: (id: string) => ['campaign-brief', id],
}))

// eslint-disable-next-line import/first
import { useCampaignBrief } from './useCampaignBrief'

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return createElement(QueryClientProvider, { client }, children)
}

describe('useCampaignBrief', () => {
  beforeEach(() => {
    mockGetCampaignBrief.mockReset()
  })

  it('maps backend hard_filters {field, operator, value} into store HardFilter shape', async () => {
    mockGetCampaignBrief.mockResolvedValue({
      data: {
        campaign_id: 'c-1',
        scoring_dimensions: [],
        hard_filters: [
          { field: 'followers', operator: 'gte', value: '10000' },
          { field: 'language', operator: 'eq', value: 'es' },
        ],
        disqualifiers: [],
      },
    })

    const { result } = renderHook(() => useCampaignBrief('c-1'), { wrapper })
    await waitFor(() => {
      expect(result.current.data).toBeTruthy()
    })

    const filters = result.current.data!.draft.brief.hard_filters
    expect(filters).toHaveLength(2)
    expect(filters[0]).toMatchObject({
      filter_type: 'followers',
      filter_value: '10000',
    })
    expect(filters[0]!.id).toBeTruthy()
    expect(filters[1]).toMatchObject({
      filter_type: 'language',
      filter_value: 'es',
    })
  })

  it.todo('hydrates tone, key_messages, do_list, dont_list from response')

  it.todo('defaults missing tone/key_messages/do_list/dont_list to null/[]')
})
