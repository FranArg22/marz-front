// Analytics soft-disabled: backend endpoint not yet defined in OpenAPI.
// Re-enable by routing through the Orval-generated client once the endpoint exists.

type BillingEventName =
  | 'offers_payment_method_viewed'
  | 'offers_payment_method_portal_opened'

export function trackBillingEvent(
  _event: BillingEventName,
  _payload?: Record<string, unknown>,
): void {
  // no-op until backend analytics endpoint is defined in OpenAPI
}
