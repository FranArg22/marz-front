# fn-23-feat-026-metodo-de-pago-reusable-para.2 trackBillingEvent stub y tipos analytics

## Description

Crear `src/features/billing/analytics.ts` con el stub `trackBillingEvent` no-op, siguiendo exactamente el patrón de `src/features/offers/analytics.ts`.

El archivo sirve para tipar los eventos de UI del feature billing. Los eventos se wirean en la task siguiente (F.5). El stub es no-op porque el endpoint de analytics backend no está definido en OpenAPI todavía.

## Archivo a crear

**`src/features/billing/analytics.ts`**:

```ts
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
```

El type `BillingEventName` es interno (no exportado). Solo se exporta la función.

## Test a crear

**`src/features/billing/analytics.test.ts`**:

```ts
import { describe, it, expect } from 'vitest'
import { trackBillingEvent } from './analytics'

describe('trackBillingEvent', () => {
  it('does not throw when called with a valid event', () => {
    expect(() =>
      trackBillingEvent('offers_payment_method_viewed'),
    ).not.toThrow()
  })

  it('does not throw with an optional payload', () => {
    expect(() =>
      trackBillingEvent('offers_payment_method_portal_opened', { source: 'card' }),
    ).not.toThrow()
  })
})
```

## Reglas

- Dos archivos nuevos únicamente (`analytics.ts` y `analytics.test.ts`). No tocar otros archivos.
- No importar nada de Orval ni de React.

## Verificación

```bash
pnpm typecheck
pnpm vitest run src/features/billing/analytics.test.ts
```

## Acceptance

- Existe `src/features/billing/analytics.ts` con `trackBillingEvent` exportado como named export.
- `pnpm typecheck` pasa.
- Un string inválido pasado a `trackBillingEvent` falla typecheck: `trackBillingEvent('inexistente')` debe reportar error de compilación.
- Tests de analytics pasan (`pnpm vitest run src/features/billing/analytics.test.ts`).

## Done summary
Implemented fn-23-feat-026-metodo-de-pago-reusable-para.2; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: