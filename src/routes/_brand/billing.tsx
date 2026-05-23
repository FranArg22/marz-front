import { createFileRoute, redirect } from '@tanstack/react-router'

import { BillingPage } from '#/features/billing/components/BillingPage'
import { getGetBillingSubscriptionQueryOptions } from '#/shared/api/generated/brand/brand'
import { ApiError } from '#/shared/api/mutator'

export const Route = createFileRoute('/_brand/billing')({
  loader: async ({ context }) => {
    const response = await context.queryClient
      .ensureQueryData(getGetBillingSubscriptionQueryOptions())
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 404) {
          return { status: 404 as const, data: null }
        }
        throw err
      })
    if (response.status === 404) {
      throw redirect({ to: '/' })
    }
  },
  component: BillingPage,
})
