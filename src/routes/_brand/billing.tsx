import { createFileRoute } from '@tanstack/react-router'
import { Trans } from '@lingui/react/macro'

export const Route = createFileRoute('/_brand/billing')({
  component: BillingRoute,
})

function BillingRoute() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">
        <Trans>Billing</Trans>
      </h1>
    </div>
  )
}
