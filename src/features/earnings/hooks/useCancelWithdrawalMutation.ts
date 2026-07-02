import { useQueryClient } from '@tanstack/react-query'
import { useCancelMyWithdrawal } from '#/shared/api/generated/creator/creator'
import { getWalletQueryKey } from './useWalletQuery'
import { getWithdrawalsQueryKey } from './useWithdrawalsQuery'

export function useCancelWithdrawalMutation() {
  const queryClient = useQueryClient()
  return useCancelMyWithdrawal({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getWalletQueryKey() })
        void queryClient.invalidateQueries({
          queryKey: getWithdrawalsQueryKey(),
        })
      },
    },
  })
}
