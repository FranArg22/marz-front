import { ingestAnalyticsEvent } from '#/shared/api/generated/analytics/analytics'
import type { AnalyticsEventName } from '#/shared/api/generated/model'

export function postAnalyticsEvent(
  eventName: string,
  properties: object,
): void {
  // Analytics is fire-and-forget; endpoint failures must not block the UI.
  void ingestAnalyticsEvent({
    name: eventName as AnalyticsEventName,
    properties: properties as Record<string, unknown>,
    occurred_at: new Date().toISOString(),
  }).catch(() => {})
}
