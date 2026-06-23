import posthog from 'posthog-js'

/**
 * PostHog product analytics (client-only). Combo elegido: session replay con
 * inputs enmascarados + autocapture de clicks + pageviews en navegación SPA.
 *
 * No-op cuando `VITE_POSTHOG_KEY` está vacío (mismo criterio que Sentry/Faro):
 * así dev y E2E no emiten eventos. El project token es público (ingest), no es
 * secreto. Complementa el dashboard Prometheus *business* — no lo reemplaza.
 */
let initialized = false

export function initPosthog(): void {
  if (typeof window === 'undefined') return
  if (import.meta.env.VITE_E2E) return
  if (initialized) return

  const key = import.meta.env.VITE_POSTHOG_KEY
  if (!key) return

  posthog.init(key, {
    api_host: import.meta.env.VITE_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    autocapture: true,
    capture_pageview: 'history_change',
    capture_pageleave: true,
    // Session replay: enmascarar todos los inputs por default (privacidad).
    session_recording: {
      maskAllInputs: true,
    },
  })
  initialized = true
}

export function identifyPosthogUser(
  distinctId: string,
  properties?: Record<string, unknown>,
): void {
  if (!initialized) return
  posthog.identify(distinctId, properties)
}

export function resetPosthogUser(): void {
  if (!initialized) return
  posthog.reset()
}
