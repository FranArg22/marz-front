import { useInfiniteQuery } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'

import {
  getCampaignApplicationsQueryKey,
  useCampaignApplicationsQuery,
} from './queries'

vi.mock('@tanstack/react-query', () => ({
  useInfiniteQuery: vi.fn(() => ({})),
}))

describe('campaign applications queries', () => {
  it('uses hierarchical query keys with params', () => {
    expect(
      getCampaignApplicationsQueryKey('campaign-1', {
        limit: 12,
      }),
    ).toEqual(['campaign', 'campaign-1', 'applications', { limit: 12 }])
  })

  it('configures an infinite applications query', () => {
    useCampaignApplicationsQuery('campaign-1')

    expect(useInfiniteQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['campaign', 'campaign-1', 'applications', { limit: 12 }],
        initialPageParam: undefined,
      }),
    )
  })
})
