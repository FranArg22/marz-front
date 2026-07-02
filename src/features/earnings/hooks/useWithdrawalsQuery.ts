import {
  useListMyWithdrawals,
  getListMyWithdrawalsQueryKey,
} from '#/shared/api/generated/creator/creator'
import type { ListMyWithdrawals200 } from '#/shared/api/generated/model'

export function getWithdrawalsQueryKey(params?: {
  page?: number
  per_page?: number
}) {
  return getListMyWithdrawalsQueryKey(params ?? {})
}

export function useWithdrawalsQuery(params?: {
  page?: number
  per_page?: number
}) {
  return useListMyWithdrawals(params ?? {}, {
    query: {
      queryKey: getWithdrawalsQueryKey(params),
      select: (response): ListMyWithdrawals200 => {
        if (response.status === 200) return response.data
        throw new Error('Unexpected withdrawals response')
      },
    },
  })
}
