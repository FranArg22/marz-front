import { useQuery } from '@tanstack/react-query'
import type { UseQueryOptions } from '@tanstack/react-query'

import { listVideos } from '#/shared/api/generated/campaigns/campaigns'
import type {
  CampaignVideoListResponse,
  ListVideosParams,
} from '#/shared/api/generated/model'
import { ApiError } from '#/shared/api/mutator'

const CAMPAIGN_VIDEOS_STALE_TIME = 30_000

export type CampaignVideosParams = Pick<
  ListVideosParams,
  'cursor' | 'limit' | 'search' | 'status' | 'platform' | 'creator_account_id'
>

function videosQueryKey(
  campaignId: string | undefined,
  params: CampaignVideosParams,
) {
  return ['videos', { campaignId, ...params }] as const
}

export function matchesVideosQueryForCampaign(campaignId: string) {
  return (query: { queryKey: readonly unknown[] }) => {
    if (query.queryKey[0] !== 'videos') return false
    const params = query.queryKey[1]
    return (
      typeof params === 'object' &&
      params !== null &&
      'campaignId' in params &&
      (params as { campaignId?: string }).campaignId === campaignId
    )
  }
}

function videosQueryOptions(
  campaignId: string | undefined,
  params: CampaignVideosParams,
) {
  return {
    queryKey: videosQueryKey(campaignId, params),
    queryFn: async (): Promise<CampaignVideoListResponse> => {
      const response = await listVideos({
        ...params,
        campaign_id: campaignId,
      })
      if (response.status !== 200) {
        throw new ApiError(
          response.status,
          'campaign_videos_error',
          'Videos request failed',
        )
      }
      return response.data
    },
    staleTime: CAMPAIGN_VIDEOS_STALE_TIME,
    retry: (failureCount: number, error: Error) => {
      if (error instanceof ApiError && error.status === 404) return false
      return failureCount < 2
    },
  } satisfies UseQueryOptions<CampaignVideoListResponse, Error>
}

export function useCampaignVideosQuery(
  campaignId: string | undefined,
  params: CampaignVideosParams,
) {
  return useQuery(videosQueryOptions(campaignId || undefined, params))
}
