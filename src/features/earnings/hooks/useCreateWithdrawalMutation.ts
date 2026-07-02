import { useQueryClient } from '@tanstack/react-query'
import { useCreateWithdrawal } from '#/shared/api/generated/creator/creator'
import { getWalletQueryKey } from './useWalletQuery'
import { getWithdrawalsQueryKey } from './useWithdrawalsQuery'

export function useCreateWithdrawalMutation(idempotencyKey: string) {
  const queryClient = useQueryClient()
  return useCreateWithdrawal({
    request: { headers: { 'Idempotency-Key': idempotencyKey } },
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
