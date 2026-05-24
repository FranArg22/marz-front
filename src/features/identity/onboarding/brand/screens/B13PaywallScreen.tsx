import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { useNavigate } from '@tanstack/react-router'
import { PlansGrid } from '#/features/billing/components/PlansGrid'
import { useBillingPlans } from '#/features/billing/hooks/useBillingPlans'
import type { BillingPlanIdentifier } from '#/shared/api/generated/model/billingPlanIdentifier'
import { useBrandOnboardingStore } from '../store'
import { STEPS, getStepId } from '../steps'

export function B13PaywallScreen() {
  const navigate = useNavigate()
  const store = useBrandOnboardingStore()
  const plansQuery = useBillingPlans()
  const selectedInterval = store.selectedInterval ?? 'month'
  const selectedPlan = store.selectedPlan

  const advanceToNextStep = () => {
    const currentIndex = STEPS.findIndex((s) => s.id === 'paywall')
    if (currentIndex < 0 || currentIndex >= STEPS.length - 1) return
    const nextIndex = currentIndex + 1
    store.goTo(nextIndex)
    void navigate({
      to: '/onboarding/brand/$step',
      params: { step: getStepId(nextIndex) },
    })
  }

  const handlePlanCta = (plan: BillingPlanIdentifier) => {
    store.setSelectedPlan(plan)
    store.setSelectedInterval(selectedInterval)
    store.setFlowChoice('paid')
    advanceToNextStep()
  }

  const handleContinueFree = () => {
    store.setSelectedPlan(null)
    store.setSelectedInterval(null)
    store.setFlowChoice('free')
    advanceToNextStep()
  }

  if (plansQuery.isLoading) {
    return <PaywallSkeleton />
  }

  if (
    plansQuery.isError ||
    !plansQuery.data ||
    plansQuery.data.status !== 200
  ) {
    return (
      <div
        role="alert"
        className="flex w-full max-w-[720px] flex-col items-center gap-4 py-12 text-center"
      >
        <p className="text-sm text-foreground">
          {t`No pudimos cargar los planes. Intentá de nuevo.`}
        </p>
        <button
          type="button"
          onClick={() => {
            void plansQuery.refetch()
          }}
          className="flex h-10 items-center justify-center rounded-xl border border-border bg-card px-4 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
        >
          {t`Reintentar`}
        </button>
      </div>
    )
  }

  const firstName = store.contact_name?.trim().split(/\s+/)[0]

  return (
    <div className="relative flex w-full flex-col items-center gap-6">
      <div className="relative flex w-full max-w-[720px] flex-col items-center gap-2">
        <h1 className="text-center text-[28px] font-bold leading-tight tracking-[-0.02em] text-foreground">
          {firstName ? (
            <Trans>Elegí tu plan, {firstName}.</Trans>
          ) : (
            <Trans>Elegí tu plan.</Trans>
          )}
        </h1>
        <p className="text-center text-[14px] text-muted-foreground">
          <Trans>
            Sin take rate. Sin letra chica. Trial de 7 días en Starter y Growth.
          </Trans>
        </p>
      </div>

      <PlansGrid
        plans={plansQuery.data.data.plans}
        selectedPlan={selectedPlan ?? undefined}
        selectedInterval={selectedInterval}
        onIntervalChange={(interval) => {
          store.setSelectedInterval(interval)
          store.setSelectedPlan(null)
        }}
        onPlanSelect={(plan) => {
          store.setSelectedPlan(plan)
        }}
        onPlanCta={handlePlanCta}
      />

      <button
        type="button"
        onClick={handleContinueFree}
        className="text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <Trans>Prefiero seguir sin acceso a la red de creadores →</Trans>
      </button>
    </div>
  )
}

function PaywallSkeleton() {
  return (
    <div
      role="status"
      aria-label={t`Cargando planes`}
      className="flex w-full flex-col items-center gap-6"
    >
      <div className="h-10 w-40 animate-pulse rounded-full bg-muted" />
      <div className="flex flex-wrap justify-center gap-4">
        {['s-starter', 's-growth', 's-scale'].map((slot) => (
          <div
            key={slot}
            className="h-[560px] w-[260px] animate-pulse rounded-[var(--radius-xl)] bg-muted"
          />
        ))}
      </div>
    </div>
  )
}
