import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { useGetPlanUsage } from '#/shared/api/generated/billing/billing'

import { useBillingSubscription } from '../hooks/useBillingSubscription'
import { useOffersPaymentMethods } from '../hooks/useOffersPaymentMethod'
import { BillingSummary } from './BillingSummary'
import { FreePlanCTA } from './FreePlanCTA'
import { PlanUpgradeModal } from './PlanUpgradeModal'
import { PlanUsageCard } from './PlanUsageCard'

export function SubscriptionSection() {
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const subscriptionQuery = useBillingSubscription({ staleTime: 30_000 })
  const paymentMethodsQuery = useOffersPaymentMethods()
  const usageQuery = useGetPlanUsage({ query: { staleTime: 30_000 } })

  if (subscriptionQuery.isLoading || usageQuery.isLoading) {
    return <LoadingState />
  }

  const subscriptionResponse = subscriptionQuery.data
  const usageResponse = usageQuery.data

  if (!usageResponse || usageResponse.status !== 200) {
    return (
      <ErrorState
        message={t`No pudimos cargar el uso de tu plan. Recargá la página o probá más tarde.`}
      />
    )
  }

  const isFree =
    isSubscriptionNotFound(subscriptionQuery.error, subscriptionResponse) ||
    (subscriptionResponse?.status === 200 &&
      (subscriptionResponse.data.plan as string) === 'free')

  if (isFree) {
    return (
      <SubscriptionShell>
        <FreePlanCTA onUpgrade={() => setUpgradeOpen(true)} />
        <PlanUsageCard usage={usageResponse.data} />
        {upgradeOpen ? (
          <PlanUpgradeModal
            open={upgradeOpen}
            onClose={() => setUpgradeOpen(false)}
          />
        ) : null}
      </SubscriptionShell>
    )
  }

  if (!subscriptionResponse || subscriptionResponse.status !== 200) {
    return (
      <ErrorState
        message={t`No pudimos cargar tu suscripción. Recargá la página o probá más tarde.`}
      />
    )
  }

  if (paymentMethodsQuery.isLoading) {
    return <LoadingState />
  }

  const paymentMethods =
    paymentMethodsQuery.data?.status === 200
      ? paymentMethodsQuery.data.data
      : undefined

  return (
    <SubscriptionShell>
      <BillingSummary
        subscription={subscriptionResponse.data}
        paymentMethods={paymentMethods}
      />
      <PlanUsageCard usage={usageResponse.data} />
    </SubscriptionShell>
  )
}

function SubscriptionShell({ children }: { children: React.ReactNode }) {
  return <section className="flex w-full flex-col gap-6">{children}</section>
}

function LoadingState() {
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

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-card p-6">
      <p className="text-sm text-destructive">{message}</p>
    </div>
  )
}

function isSubscriptionNotFound(
  error: unknown,
  response: { status: number } | undefined,
) {
  if (response?.status === 404) return true
  if (!error || typeof error !== 'object') return false
  return 'status' in error && error.status === 404
}
