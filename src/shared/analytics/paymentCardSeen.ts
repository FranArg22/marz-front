import { ingestAnalyticsEvent } from '#/shared/api/generated/analytics/analytics'
import { AnalyticsEventName } from '#/shared/api/generated/model'

export interface PaymentCardSeenPayload {
  declared_payment_id: string
}

export function trackCardSeen(payload: PaymentCardSeenPayload) {
  void ingestAnalyticsEvent({
    name: AnalyticsEventName.payment_card_seen,
    properties: payload as unknown as Record<string, unknown>,
  }).catch(() => {
    // Analytics is non-blocking for the payment flow.
  })
}
