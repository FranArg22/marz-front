import { useCallback } from 'react'

import { useIngestAnalyticsEvent } from '#/shared/api/generated/analytics/analytics'
import { AnalyticsEventName } from '#/shared/api/generated/model'

export type MarkAsPaidStep = 'amount' | 'final_confirmation'

type PaymentAnalyticsEvent =
  | 'payment_mark_opened'
  | 'payment_mark_amount_overridden'
  | 'payment_mark_cancelled'

export function usePaymentAnalytics(deliverableId: string | null) {
  const { mutateAsync } = useIngestAnalyticsEvent()

  const trackPaymentEvent = useCallback(
    (eventName: PaymentAnalyticsEvent, payload?: { step?: MarkAsPaidStep }) => {
      if (!deliverableId) return

      void mutateAsync({
        data: {
          name: AnalyticsEventName[eventName],
          properties: {
            deliverable_id: deliverableId,
            ...(payload?.step ? { step: payload.step } : {}),
          },
        },
      }).catch(() => {
        // Analytics is non-blocking for the payment flow.
      })
    },
    [deliverableId, mutateAsync],
  )

  return {
    trackOpened: () => trackPaymentEvent('payment_mark_opened'),
    trackAmountOverridden: () =>
      trackPaymentEvent('payment_mark_amount_overridden'),
    trackCancelled: (step: MarkAsPaidStep) =>
      trackPaymentEvent('payment_mark_cancelled', { step }),
  }
}
