import { useGetMyWithdrawal } from '#/shared/api/generated/creator/creator'
import type { Withdrawal } from '#/shared/api/generated/model'

export function useWithdrawalDetailQuery(
  id: string,
  options?: { enabled?: boolean },
) {
  return useGetMyWithdrawal(id, {
    query: {
      enabled: options?.enabled ?? true,
      select: (response): Withdrawal => {
        if (response.status === 200) return response.data
        throw new Error('Unexpected withdrawal response')
      },
    },
  })
}
