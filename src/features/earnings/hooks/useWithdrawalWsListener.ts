import { useQueryClient } from '@tanstack/react-query'

import {
  getGetMyWalletQueryKey,
  getGetMyWithdrawalQueryKey,
  getListMyWithdrawalsQueryKey,
} from '#/shared/api/generated/creator/creator'
import type { DomainEventEnvelope } from '#/shared/ws/events'
import { useWebSocket } from '#/shared/ws/useWebSocket'

interface WithdrawalUpdatedPayload {
  id: string
  status: string
  net: { amount: string; currency: string }
}

export function useWithdrawalWsListener() {
  const queryClient = useQueryClient()

  useWebSocket({
    enabled: true,
    handlers: {
      'withdrawal.updated': (envelope) => {
        const payload = (
          envelope as DomainEventEnvelope<WithdrawalUpdatedPayload>
        ).payload

        void queryClient.invalidateQueries({
          queryKey: getGetMyWalletQueryKey(),
        })
        void queryClient.invalidateQueries({
          queryKey: getListMyWithdrawalsQueryKey({}),
        })
        void queryClient.invalidateQueries({
          queryKey: getGetMyWithdrawalQueryKey(payload.id),
        })
      },
    },
  })
}
