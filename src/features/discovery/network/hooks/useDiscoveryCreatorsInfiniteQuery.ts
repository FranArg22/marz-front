import { useInfiniteQuery } from '@tanstack/react-query'

import { getDiscoveryCreators } from '#/shared/api/generated/brand/brand'
import type {
  DiscoveryCreatorsResponse,
  GetDiscoveryCreatorsParams,
} from '#/shared/api/generated/model'

const PAGE_LIMIT = 24

export function getDiscoveryCreatorsQueryKey(
  params: Omit<GetDiscoveryCreatorsParams, 'cursor'>,
) {
  return ['discovery', 'creators', params] as const
}

export function useDiscoveryCreatorsInfiniteQuery(
  params: Omit<GetDiscoveryCreatorsParams, 'cursor' | 'limit'>,
) {
  return useInfiniteQuery({
    queryKey: getDiscoveryCreatorsQueryKey(params),
    queryFn: async ({ pageParam, signal }) => {
      const response = await getDiscoveryCreators(
        {
          ...params,
          limit: PAGE_LIMIT,
          ...(pageParam ? { cursor: pageParam } : {}),
        },
        { signal },
      )

      if (response.status !== 200) {
        throw new Error('Discovery creators query failed')
      }

      return response.data
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: DiscoveryCreatorsResponse) =>
      lastPage.next_cursor ?? undefined,
  })
}
