import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { useMe } from '#/shared/api/generated/accounts/accounts'
import { useGetPlanUsage } from '#/shared/api/generated/billing/billing'

import { useBillingSubscription } from '../hooks/useBillingSubscription'
import { useOffersPaymentMethods } from '../hooks/useOffersPaymentMethod'
import { BillingSummary } from './BillingSummary'
import { FreePlanCTA } from './FreePlanCTA'
import { PlanUpgradeModal } from './PlanUpgradeModal'
import { PlanUsageCard } from './PlanUsageCard'

export function SubscriptionSection() {
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  // The current plan is already known from /me (fetched on load). Use it as the
  // source of truth for free-vs-paid instead of inferring "free" from a 404 on
  // the subscription endpoint. Free brands then never call subscription /
  // payment-methods (no 404/405/502, no retries, no error noise).
  const meQuery = useMe()
  const plan =
    meQuery.data?.status === 200
      ? meQuery.data.data.brand_workspace?.plan
      : undefined
  const isPaid = plan != null && plan !== 'free'
  const canFetchWorkspaceScoped = typeof window !== 'undefined' && plan != null

  const usageQuery = useGetPlanUsage({
    query: { staleTime: 30_000, enabled: canFetchWorkspaceScoped },
  })
  const subscriptionQuery = useBillingSubscription({
    staleTime: 30_000,
    enabled: canFetchWorkspaceScoped && isPaid,
  })
  const paymentMethodsQuery = useOffersPaymentMethods(
    canFetchWorkspaceScoped && isPaid,
  )

  if (
    meQuery.isLoading ||
    (plan != null && !canFetchWorkspaceScoped) ||
    usageQuery.isLoading
  ) {
    return <LoadingState />
  }

  if (plan == null) {
    return (
      <ErrorState
        message={t`No pudimos cargar tu plan. Recargá la página o probá más tarde.`}
      />
    )
  }

  const usageResponse = usageQuery.data
  if (!usageResponse || usageResponse.status !== 200) {
    return (
      <ErrorState
        message={t`No pudimos cargar el uso de tu plan. Recargá la página o probá más tarde.`}
      />
    )
  }

  if (!isPaid) {
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

  if (subscriptionQuery.isLoading || paymentMethodsQuery.isLoading) {
    return <LoadingState />
  }

  const subscriptionResponse = subscriptionQuery.data
  if (!subscriptionResponse || subscriptionResponse.status !== 200) {
    return (
      <ErrorState
        message={t`No pudimos cargar tu suscripción. Recargá la página o probá más tarde.`}
      />
    )
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
        usageSlot={<PlanUsageCard usage={usageResponse.data} />}
      />
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
