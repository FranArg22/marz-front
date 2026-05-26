# fn-24-feat-026-e2e-billing-payment-method FEAT-026 E2E: billing payment method portal (ESC-1)

## Overview

Agrega cobertura E2E Playwright para el bloque combinado de método de pago en `/billing` (introducido por FEAT-026). El escenario cubre el caso `same_payment_method=true`: la página muestra `visa •••• 4242`, el badge `Se usa para suscripción y pagos a creators`, y el CTA abre el portal Stripe.

El backend test-spec (`openapi/test-spec.json`) **no expone** un endpoint `/v1/test/billing/*` para seedear subscriptions directamente. El test existente en `src/test/e2e/suites/billing/billing-page.spec.ts` ya crea la subscription via el flujo Stripe checkout (`STRIPE_TEST_MODE=1`). Los tasks de este epic extienden ese test existente:

1. Agregan `data-testid="billing.page.active_subscription_portal"` al bloque combinado en `src/features/billing/components/BillingPage.tsx`.
2. Añaden assertions scoped al testid dentro del test existente (no se crea un test nuevo ni se mockan endpoints).

## Scope

**Incluye**:
- Wrapper `data-testid` en `BillingPage.tsx` → `PaymentMethodBlock` rama `same_payment_method=true`
- Assertions en `billing-page.spec.ts` usando `getByTestId('billing.page.active_subscription_portal')`

**Fuera de scope**:
- Endpoint `/v1/test/billing/subscriptions/upsert` (requiere backend — mejora futura)
- Nuevo test case independiente del flujo Stripe checkout

## Quick commands

- `pnpm typecheck`
- `pnpm vitest run src/features/billing/`
- `STRIPE_TEST_MODE=1 pnpm test:e2e -- billing-page`

## Acceptance

- [ ] `data-testid="billing.page.active_subscription_portal"` existe en `BillingPage.tsx` rama `same_payment_method=true`
- [ ] `billing-page.spec.ts` aserta el bloque via `page.getByTestId('billing.page.active_subscription_portal')`
- [ ] Dentro del bloque se verifica texto `visa •••• 4242` y badge `Se usa para suscripción y pagos a creators`
- [ ] Click en CTA `Gestionar.*en Stripe` scoped al bloque, redirige a `billing.stripe.com`
- [ ] `pnpm typecheck` pasa
- [ ] `pnpm quality-gates` verde

## References

- Componente: `src/features/billing/components/BillingPage.tsx` — `PaymentMethodBlock`
- Componente: `src/features/billing/components/PaymentMethodCard.tsx`
- Spec E2E: `src/test/e2e/suites/billing/billing-page.spec.ts`
- Test API: `src/shared/api/test-generated/test/test.ts` (sin endpoint billing aún)
