import { useState } from 'react'
import { t } from '@lingui/core/macro'
import { useNavigate } from '@tanstack/react-router'
import { PlansGrid } from '#/features/billing/components/PlansGrid'
import { useBillingPlans } from '#/features/billing/hooks/useBillingPlans'
import { useCreateCheckoutSession } from '#/features/billing/hooks/useCreateCheckoutSession'
import type { BillingInterval } from '#/shared/api/generated/model/billingInterval'
import type { BillingPlanIdentifier } from '#/shared/api/generated/model/billingPlanIdentifier'
import { ApiError } from '#/shared/api/mutator'
import { useBrandOnboardingStore } from '../store'
import { STEPS, getStepId } from '../steps'

type PaywallErrorKind =
  | 'subscription_active'
  | 'validation'
  | 'stripe_unavailable'
  | 'generic'

/* eslint-disable lingui/no-unlocalized-strings -- API error codes are not user-facing copy. */
function classifyError(error: unknown): PaywallErrorKind {
  if (!(error instanceof ApiError)) return 'generic'
  if (error.status === 409 && error.code === 'subscription_already_active') {
    return 'subscription_active'
  }
  if (error.status === 422 && error.code.startsWith('validation.')) {
    return 'validation'
  }
  if (error.status === 502 && error.code === 'stripe_unavailable') {
    return 'stripe_unavailable'
  }
  return 'generic'
}
/* eslint-enable lingui/no-unlocalized-strings */

export function B13PaywallScreen() {
  const navigate = useNavigate()
  const store = useBrandOnboardingStore()
  const plansQuery = useBillingPlans()
  const checkout = useCreateCheckoutSession()

  const [selectedInterval, setSelectedInterval] =
    useState<BillingInterval>('month')
  const [selectedPlan, setSelectedPlan] =
    useState<BillingPlanIdentifier | null>(null)
  const [errorKind, setErrorKind] = useState<PaywallErrorKind | null>(null)

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

  const handleContinuePaid = () => {
    if (!selectedPlan || checkout.isPending) return
    setErrorKind(null)
    const origin = window.location.origin
    checkout.mutate(
      {
        data: {
          plan: selectedPlan,
          interval: selectedInterval,
          success_url: `${origin}/onboarding/brand/billing-callback?checkout=success`,
          cancel_url: `${origin}/onboarding/brand/billing-callback?checkout=cancelled`,
        },
      },
      {
        onSuccess: (response) => {
          if (response.status === 201) {
            window.location.assign(response.data.checkout_url)
          }
        },
        onError: (error) => {
          setErrorKind(classifyError(error))
        },
      },
    )
  }

  if (plansQuery.isLoading) {
    return <PaywallSkeleton />
  }

  if (plansQuery.isError || !plansQuery.data || plansQuery.data.status !== 200) {
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
        <h1 className="text-center text-[28px] font-semibold leading-tight tracking-[-0.02em] text-foreground">
          {firstName ? t`Elegí tu plan, ${firstName}.` : t`Elegí tu plan.`}
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          {t`Sin take rate. Sin letra chica.`}
        </p>
      </div>

      <PlansGrid
        plans={plansQuery.data.data.plans}
        selectedPlan={selectedPlan ?? undefined}
        selectedInterval={selectedInterval}
        onIntervalChange={(interval) => {
          setSelectedInterval(interval)
          setSelectedPlan(null)
        }}
        onPlanSelect={(plan) => {
          setSelectedPlan(plan)
          setErrorKind(null)
        }}
      />

      {errorKind ? (
        <PaywallError
          kind={errorKind}
          onAdvance={advanceToNextStep}
          onRetry={handleContinuePaid}
        />
      ) : null}

      <button
        type="button"
        onClick={handleContinuePaid}
        disabled={!selectedPlan || checkout.isPending}
        className="flex h-11 min-w-[260px] items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        {checkout.isPending
          ? t`Redirigiendo a Stripe…`
          : t`Continuar con plan pago`}
      </button>

      <button
        type="button"
        onClick={advanceToNextStep}
        className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {t`Prefiero seguir sin la red de creadores`}
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
            className="h-[280px] w-[260px] animate-pulse rounded-2xl bg-muted"
          />
        ))}
      </div>
    </div>
  )
}

interface PaywallErrorProps {
  kind: PaywallErrorKind
  onAdvance: () => void
  onRetry: () => void
}

function PaywallError({ kind, onAdvance, onRetry }: PaywallErrorProps) {
  if (kind === 'subscription_active') {
    return (
      <div
        role="alert"
        className="flex w-full max-w-[720px] flex-col items-center gap-3 rounded-xl border border-border bg-card p-4 text-center"
      >
        <p className="text-sm text-foreground">
          {t`Ya tenés una suscripción activa.`}
        </p>
        <button
          type="button"
          onClick={onAdvance}
          className="flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground"
        >
          {t`Continuar`}
        </button>
      </div>
    )
  }

  if (kind === 'stripe_unavailable') {
    return (
      <div
        role="alert"
        className="flex w-full max-w-[720px] flex-col items-center gap-3 rounded-xl border border-border bg-card p-4 text-center"
      >
        <p className="text-sm text-foreground">
          {t`Stripe no responde, intentá de nuevo.`}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="flex h-10 items-center justify-center rounded-xl border border-border bg-background px-4 text-xs font-semibold text-foreground"
        >
          {t`Reintentar`}
        </button>
      </div>
    )
  }

  if (kind === 'validation') {
    return (
      <p role="alert" className="text-sm text-destructive">
        {t`Plan inválido, refrescá la página.`}
      </p>
    )
  }

  return (
    <p role="alert" className="text-sm text-destructive">
      {t`No pudimos iniciar el checkout. Intentá de nuevo.`}
    </p>
  )
}
