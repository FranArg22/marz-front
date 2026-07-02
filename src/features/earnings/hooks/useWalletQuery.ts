import {
  useGetMyWallet,
  getGetMyWalletQueryKey,
} from '#/shared/api/generated/creator/creator'
import type { Wallet } from '#/shared/api/generated/model'

export function getWalletQueryKey() {
  return getGetMyWalletQueryKey()
}

export function useWalletQuery() {
  return useGetMyWallet({
    query: {
      queryKey: getWalletQueryKey(),
      select: (response): Wallet => {
        if (response.status === 200) return response.data
        throw new Error('Unexpected wallet response')
      },
    },
  })
}
