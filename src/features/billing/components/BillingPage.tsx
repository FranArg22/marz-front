import { Loader2 } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { BillingSummary } from '../settings/BillingSummary'
import { useBillingSubscription } from '../hooks/useBillingSubscription'

export function BillingPage() {
  const subscriptionQuery = useBillingSubscription({ staleTime: 30_000 })

  if (subscriptionQuery.isLoading) {
    return (
      <div
        className="flex min-h-[40vh] items-center justify-center"
        role="status"
        aria-label={t`Cargando suscripción`}
      >
        <Loader2
          aria-hidden="true"
          className="size-6 animate-spin text-muted-foreground"
        />
      </div>
    )
  }

  const response = subscriptionQuery.data
  if (!response || response.status !== 200) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">
          {t`No pudimos cargar tu suscripción. Recargá la página o probá más tarde.`}
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <BillingSummary
        subscription={response.data}
        paymentMethodsMode="self-fetch"
        returnUrl="/billing"
      />
    </div>
  )
}
