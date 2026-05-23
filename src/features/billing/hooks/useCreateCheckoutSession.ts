import {
  createBillingCheckoutSession,
  useCreateBillingCheckoutSession,
} from '#/shared/api/generated/brand/brand'
import { generateIdempotencyKey } from '#/shared/api/idempotency'

export type {
  BillingCheckoutSessionRequest,
  BillingCheckoutSessionResponse,
} from '#/shared/api/generated/model'

export function useCreateCheckoutSession() {
  return useCreateBillingCheckoutSession({
    mutation: {
      mutationFn: ({ data }) =>
        createBillingCheckoutSession(data, {
          headers: { 'Idempotency-Key': generateIdempotencyKey() },
        }),
    },
  })
}
