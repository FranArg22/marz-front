import { useQueryClient } from '@tanstack/react-query'
import { useCancelMyWithdrawal } from '#/shared/api/generated/creator/creator'
import { trackWithdrawalCancelled } from '../analytics'
import { getWalletQueryKey } from './useWalletQuery'
import { getWithdrawalsQueryKey } from './useWithdrawalsQuery'

export function useCancelWithdrawalMutation() {
  const queryClient = useQueryClient()
  return useCancelMyWithdrawal({
    mutation: {
      onSuccess: (_data, variables) => {
        trackWithdrawalCancelled({ withdrawal_id: variables.id })
        void queryClient.invalidateQueries({ queryKey: getWalletQueryKey() })
        void queryClient.invalidateQueries({
          queryKey: getWithdrawalsQueryKey(),
        })
      },
    },
  })
}
