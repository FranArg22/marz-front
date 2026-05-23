import { useGetBillingSubscription } from '#/shared/api/generated/brand/brand'

export type { BillingSubscription } from '#/shared/api/generated/model'

export interface UseBillingSubscriptionOptions {
  staleTime?: number
  refetchInterval?: number | false
  enabled?: boolean
}

export function useBillingSubscription(
  options?: UseBillingSubscriptionOptions,
) {
  return useGetBillingSubscription({
    query: {
      staleTime: options?.staleTime ?? 60_000,
      refetchInterval: options?.refetchInterval ?? false,
      enabled: options?.enabled,
    },
  })
}
