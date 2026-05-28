import { useQueryClient } from '@tanstack/react-query'

import {
  createOffersSetupSession,
  getGetBillingSubscriptionQueryKey,
  getListBillingPaymentMethodsQueryKey,
  useCreateOffersSetupSession as useCreateOffersSetupSessionGenerated,
  useListBillingPaymentMethods,
  useSetOffersPaymentMethod as useSetOffersPaymentMethodGenerated,
  useSetSubscriptionPaymentMethod as useSetSubscriptionPaymentMethodGenerated,
} from '#/shared/api/generated/brand/brand'
import { generateIdempotencyKey } from '#/shared/api/idempotency'

function invalidateBilling(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({
    queryKey: getGetBillingSubscriptionQueryKey(),
  })
  void queryClient.invalidateQueries({
    queryKey: getListBillingPaymentMethodsQueryKey(),
  })
}

// Lists the cards attached to the workspace's Stripe customer, flagging which
// pays the subscription and which pays offers.
export function useOffersPaymentMethods(enabled = true) {
  return useListBillingPaymentMethods({
    query: { staleTime: 30_000, enabled },
  })
}

// Pins (or clears, with stripe_payment_method_id: null) the offers payment
// method. Invalidates the subscription + payment-methods reads on success so
// the page reflects the new routing.
export function useSetOffersPaymentMethod() {
  const queryClient = useQueryClient()
  return useSetOffersPaymentMethodGenerated({
    mutation: { onSuccess: () => invalidateBilling(queryClient) },
  })
}

// Sets the card charged for the subscription (updates the Stripe subscription's
// default PM server-side). Invalidates the billing reads on success.
export function useSetSubscriptionPaymentMethod() {
  const queryClient = useQueryClient()
  return useSetSubscriptionPaymentMethodGenerated({
    mutation: { onSuccess: () => invalidateBilling(queryClient) },
  })
}

// Creates a Stripe Checkout setup session to attach a new card for offers.
// Carries a fresh Idempotency-Key, mirroring useCreatePortalSession.
export function useCreateOffersSetupSession() {
  return useCreateOffersSetupSessionGenerated({
    mutation: {
      mutationFn: ({ data }) =>
        createOffersSetupSession(data, {
          headers: { 'Idempotency-Key': generateIdempotencyKey() },
        }),
    },
  })
}
