import { createFileRoute, useRouter } from '@tanstack/react-router'

import { brandPaymentsSearchSchema } from '#/features/payments/api/brandPaymentsSchemas'
import type { BrandPaymentsSearch } from '#/features/payments/api/brandPaymentsSchemas'
import { BrandPaymentsPage } from '#/features/payments/components/BrandPaymentsPage'
import { trackBrandPaymentOpened } from '#/features/payments/analytics'

export const paymentsSearchSchema = brandPaymentsSearchSchema

export const Route = createFileRoute('/_brand/payments')({
  validateSearch: paymentsSearchSchema,
  component: BrandPaymentsRoute,
})

function BrandPaymentsRoute() {
  const filters = Route.useSearch()
  const router = useRouter()

  const handleFiltersChange = (nextFilters: BrandPaymentsSearch) => {
    void router.navigate({
      to: '/payments',
      search: {
        period: nextFilters.period,
        campaignId: nextFilters.campaignId,
        creatorId: nextFilters.creatorId,
        q: nextFilters.q,
      },
    })
  }

  return (
    <BrandPaymentsPage
      filters={filters}
      onFiltersChange={handleFiltersChange}
      onOpenPayment={(row) => {
        trackBrandPaymentOpened({
          declared_payment_id: row.id,
          conversation_id: row.conversation_id,
        })
        void router.navigate({
          to: '/workspace/conversations/$conversationId',
          params: { conversationId: row.conversation_id },
          search: {
            filter: 'all',
            highlightPaymentId: row.id,
          },
        })
      }}
    />
  )
}
