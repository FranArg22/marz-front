import {
  createBillingPortalSession,
  useCreateBillingPortalSession,
} from '#/shared/api/generated/brand/brand'
import { generateIdempotencyKey } from '#/shared/api/idempotency'

export type {
  BillingPortalSessionRequest,
  BillingPortalSessionResponse,
} from '#/shared/api/generated/model'

export function useCreatePortalSession() {
  return useCreateBillingPortalSession({
    mutation: {
      mutationFn: ({ data }) =>
        createBillingPortalSession(data, {
          headers: { 'Idempotency-Key': generateIdempotencyKey() },
        }),
    },
  })
}
