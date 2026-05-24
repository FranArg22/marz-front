import { createFileRoute, redirect } from '@tanstack/react-router'

import { BillingPage } from '#/features/billing/components/BillingPage'
import { getGetBillingSubscriptionQueryOptions } from '#/shared/api/generated/brand/brand'
import { ApiError } from '#/shared/api/mutator'

export const Route = createFileRoute('/_brand/billing')({
  loader: async ({ context }) => {
    const response = await context.queryClient
      .ensureQueryData(getGetBillingSubscriptionQueryOptions())
      .catch((err: unknown) => {
        if (err instanceof ApiError) {
          if (err.status === 404) {
            return { status: 404 as const, data: null }
          }
          // 401 (no/expired token) and 403 (wrong role) should not crash the
          // route. The client-side BillingPage will re-query once Clerk hydrates
          // the session; in the meantime we render the page shell.
          if (err.status === 401 || err.status === 403) {
            return { status: err.status, data: null }
          }
        }
        throw err
      })
    if (response.status === 404) {
      throw redirect({ to: '/' })
    }
  },
  component: BillingPage,
})
