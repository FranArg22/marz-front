import { useInfiniteQuery } from '@tanstack/react-query'

import { listCampaignApplications } from '#/shared/api/generated/campaigns/campaigns'
import type {
  CampaignApplicationListResponse,
  ListCampaignApplicationsParams,
} from '#/shared/api/generated/model'

const DEFAULT_LIMIT = 12

export function getCampaignApplicationsQueryKey(
  campaignId: string,
  params?: Record<string, unknown>,
) {
  return ['campaign', campaignId, 'applications', params ?? {}] as const
}

export function useCampaignApplicationsQuery(campaignId: string) {
  const params = {
    limit: DEFAULT_LIMIT,
  } satisfies ListCampaignApplicationsParams

  return useInfiniteQuery({
    queryKey: getCampaignApplicationsQueryKey(campaignId, params),
    queryFn: async ({ pageParam, signal }) => {
      const response = await listCampaignApplications(
        campaignId,
        {
          ...params,
          ...(pageParam ? { cursor: pageParam } : {}),
        },
        { signal },
      )
      if (response.status !== 200) {
        throw new Error('Campaign applications failed')
      }
      return response.data
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: CampaignApplicationListResponse) =>
      lastPage.next_cursor ?? undefined,
  })
}
