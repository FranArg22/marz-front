import { useEffect, useState } from 'react'
import {
  Link,
  createFileRoute,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import { t } from '@lingui/core/macro'
import { z } from 'zod'

import { useBillingSubscription } from '#/features/billing/hooks/useBillingSubscription'
import { useBrandOnboardingStore } from '#/features/identity/onboarding/brand/store'
import { STEPS, getStepId } from '#/features/identity/onboarding/brand/steps'

const TIMEOUT_MS = 30_000
const POLL_INTERVAL_MS = 2_000

const searchSchema = z.object({
  checkout: z.string().optional(),
})

export const Route = createFileRoute('/onboarding/brand/billing-callback')({
  validateSearch: (search) => searchSchema.parse(search),
  beforeLoad: ({ search }) => {
    if (search.checkout === 'success') return
    throw redirect({
      to: '/onboarding/brand/$step',
      params: { step: 'paywall' },
    })
  },
  component: BillingCallbackPage,
})

function BillingCallbackPage() {
  const navigate = useNavigate()
  const goTo = useBrandOnboardingStore((s) => s.goTo)
  const [timedOut, setTimedOut] = useState(false)

  const subscription = useBillingSubscription({
    refetchInterval: timedOut ? false : POLL_INTERVAL_MS,
  })

  const status =
    subscription.data?.status === 200
      ? subscription.data.data.status
      : undefined
  const isActive = status === 'active' || status === 'trialing'

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimedOut(true)
    }, TIMEOUT_MS)
    return () => {
      clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (!isActive) return
    const confirmationIndex = STEPS.findIndex((s) => s.id === 'confirmation')
    if (confirmationIndex < 0) return
    goTo(confirmationIndex)
    void navigate({
      to: '/onboarding/brand/$step',
      params: { step: getStepId(confirmationIndex) },
      replace: true,
    })
  }, [goTo, isActive, navigate])

  if (timedOut && !isActive) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <div
          role="alert"
          className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 text-center"
        >
          <h1 className="text-lg font-semibold text-foreground">
            {t`Estamos demorando, refrescá en unos minutos`}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t`Tu pago se procesó pero todavía no vemos la suscripción activa.`}
          </p>
          <Link
            to="/onboarding/brand/$step"
            params={{ step: 'paywall' }}
            className="flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground"
          >
            {t`Volver al paywall`}
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div
        role="status"
        aria-live="polite"
        className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 text-center"
      >
        <div
          className="size-10 animate-spin rounded-full border-2 border-muted border-t-primary"
          aria-hidden="true"
        />
        <h1 className="text-lg font-semibold text-foreground">
          {t`Activando tu plan…`}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t`Estamos confirmando el pago con Stripe.`}
        </p>
      </div>
    </main>
  )
}
