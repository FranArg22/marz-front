import { useQuery } from '@tanstack/react-query'
import type { UseQueryOptions } from '@tanstack/react-query'

import { listCreators } from '#/shared/api/generated/campaigns/campaigns'
import type {
  CampaignParticipantListResponse,
  ListCreatorsParams,
} from '#/shared/api/generated/model'
import { ApiError } from '#/shared/api/mutator'

const CAMPAIGN_PARTICIPANTS_STALE_TIME = 30_000

export type CampaignParticipantsParams = Pick<
  ListCreatorsParams,
  'cursor' | 'limit' | 'search' | 'status' | 'platform'
>

function participantsQueryKey(
  campaignId: string | undefined,
  params: CampaignParticipantsParams,
) {
  return ['creators', { campaignId, ...params }] as const
}

export function matchesCreatorsQueryForCampaign(campaignId: string) {
  return (query: { queryKey: readonly unknown[] }) => {
    if (query.queryKey[0] !== 'creators') return false
    const params = query.queryKey[1]
    return (
      typeof params === 'object' &&
      params !== null &&
      'campaignId' in params &&
      (params as { campaignId?: string }).campaignId === campaignId
    )
  }
}

function participantsQueryOptions(
  campaignId: string | undefined,
  params: CampaignParticipantsParams,
) {
  return {
    queryKey: participantsQueryKey(campaignId, params),
    queryFn: async (): Promise<CampaignParticipantListResponse> => {
      const response = await listCreators({
        ...params,
        campaign_id: campaignId,
      })
      if (response.status !== 200) {
        throw new ApiError(
          response.status,
          'campaign_participants_error',
          'Creators request failed',
        )
      }
      return response.data
    },
    staleTime: CAMPAIGN_PARTICIPANTS_STALE_TIME,
    retry: (failureCount: number, error: Error) => {
      if (error instanceof ApiError && error.status === 404) return false
      return failureCount < 2
    },
  } satisfies UseQueryOptions<CampaignParticipantListResponse, Error>
}

export function useCampaignParticipantsQuery(
  campaignId: string | undefined,
  params: CampaignParticipantsParams,
) {
  return useQuery(participantsQueryOptions(campaignId || undefined, params))
}
