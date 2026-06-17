import { useRef, useState } from 'react'
import { t } from '@lingui/core/macro'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { PlansGrid } from '#/features/billing/components/PlansGrid'
import { useBillingPlans } from '#/features/billing/hooks/useBillingPlans'
import {
  createBillingCheckoutSession,
  useCreateBillingCheckoutSession,
} from '#/shared/api/generated/billing/billing'
import type { BillingInterval } from '#/shared/api/generated/model/billingInterval'
import type { BillingPlanIdentifier } from '#/shared/api/generated/model/billingPlanIdentifier'
import type { CreateCheckoutSessionRequestInterval } from '#/shared/api/generated/model/createCheckoutSessionRequestInterval'
import { generateIdempotencyKey } from '#/shared/api/idempotency'
import { ApiError } from '#/shared/api/mutator'

interface PlanUpgradeModalProps {
  open: boolean
  onClose: () => void
}

export function PlanUpgradeModal({ open, onClose }: PlanUpgradeModalProps) {
  const [selectedInterval, setSelectedInterval] =
    useState<BillingInterval>('month')
  const [selectedPlan, setSelectedPlan] = useState<
    BillingPlanIdentifier | undefined
  >(undefined)
  const checkoutInFlightRef = useRef(false)
  const plansQuery = useBillingPlans()
  const checkoutMutation = useCreateCheckoutSession()

  const plans =
    plansQuery.data?.status === 200 ? plansQuery.data.data.plans : []

  const handlePlanCta = (plan: BillingPlanIdentifier) => {
    if (checkoutMutation.isPending || checkoutInFlightRef.current) return

    checkoutInFlightRef.current = true
    setSelectedPlan(plan)
    checkoutMutation.mutate(
      {
        data: {
          plan,
          interval: checkoutIntervalFromBillingInterval(selectedInterval),
          success_url: `${window.location.origin}/ajustes/suscripcion`,
          cancel_url: `${window.location.origin}/ajustes/suscripcion`,
        },
      },
      {
        onSuccess: (response) => {
          if (response.status === 201) {
            window.location.href = response.data.checkout_url
          }
          checkoutInFlightRef.current = false
        },
        onError: (error) => {
          checkoutInFlightRef.current = false
          if (isAlreadySubscribedError(error)) {
            toast.error(t`Tu workspace ya tiene un plan activo`)
            onClose()
            return
          }

          toast.error(t`Stripe no responde, intentá de nuevo`)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[920px]">
        <DialogHeader>
          <DialogTitle>{t`Mejorar plan`}</DialogTitle>
          <DialogDescription>
            {t`Elegí el plan que querés activar para tu workspace.`}
          </DialogDescription>
        </DialogHeader>

        <PlansGrid
          plans={plans}
          selectedPlan={selectedPlan}
          selectedInterval={selectedInterval}
          onIntervalChange={setSelectedInterval}
          onPlanSelect={setSelectedPlan}
          onPlanCta={handlePlanCta}
          ctaDisabled={checkoutMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  )
}

function useCreateCheckoutSession() {
  return useCreateBillingCheckoutSession({
    mutation: {
      mutationFn: ({ data }) =>
        createBillingCheckoutSession(data, {
          headers: { 'Idempotency-Key': generateIdempotencyKey() },
        }),
    },
  })
}

function checkoutIntervalFromBillingInterval(
  interval: BillingInterval,
): CreateCheckoutSessionRequestInterval {
  return interval === 'year' ? 'yearly' : 'monthly'
}

function isAlreadySubscribedError(error: unknown) {
  return (
    error instanceof ApiError &&
    error.status === 403 &&
    error.code === 'already_subscribed'
  )
}
