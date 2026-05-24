# fn-22-feat-025-paid-plans-stripe-billing-ui.1 api:sync + scaffolding del feature billing

## Description
Sincronizar el cliente Orval con el backend dev (que ya debe tener desplegados los 5 endpoints billing del solution) y armar la estructura de carpetas del nuevo feature `billing/` en `src/features/`.

## Contexto

El solution define 5 endpoints REST nuevos:

- `GET /v1/billing/plans`
- `GET /v1/billing/subscription`
- `POST /v1/billing/checkout-sessions` (requiere `Idempotency-Key`)
- `POST /v1/billing/portal-sessions` (requiere `Idempotency-Key`)
- `POST /v1/billing/webhooks/stripe` (server-only, no se consume desde el cliente)

Y nuevos schemas: `BillingPlan`, `BillingSubscription`, `BillingCheckoutSessionRequest/Response`, `BillingPortalSessionRequest/Response`, `BillingCardSummary`, además de `BrandWorkspace.trial_consumed`.

## Precondición

El backend `marz-api` debe estar corriendo en dev con los endpoints y schemas billing arriba. Si después de `pnpm api:sync` los schemas no aparecen en `openapi/spec.json`, parar y reportar bloqueo: no se mockean los tipos.

## Pasos

1. Correr `pnpm api:sync` en la raíz del repo (regenera `openapi/spec.json` + `src/shared/api/generated/`).
2. Verificar que aparecen los símbolos `BillingPlan`, `BillingSubscription`, `BillingCheckoutSessionRequest`, `BillingCheckoutSessionResponse`, `BillingPortalSessionRequest`, `BillingPortalSessionResponse`, `BillingCardSummary` en `src/shared/api/generated/` (probablemente bajo `model/` y un endpoint file tipo `billing/`).
3. Verificar que `BrandWorkspace` incluye el campo `trial_consumed: boolean`.
4. Crear la estructura de carpetas vacía (no agregar archivos vacíos; las tasks siguientes los pueblan):
   - `src/features/billing/`
   - `src/features/billing/components/`
   - `src/features/billing/hooks/`
5. Committear el diff de los archivos generados (siguen la regla del repo: generated code está committeado).
6. No tocar `src/shared/api/generated/**` a mano.
## Acceptance
- `pnpm api:sync` corre limpio sin errores.
- `pnpm typecheck` pasa.
- `grep -R "BillingPlan" src/shared/api/generated/` devuelve matches.
- `grep -R "BillingSubscription" src/shared/api/generated/` devuelve matches.
- `grep -R "trial_consumed" src/shared/api/generated/` devuelve matches en `BrandWorkspace`.
- Existe `src/features/billing/components/` y `src/features/billing/hooks/`.
- Cero ediciones manuales a `src/shared/api/generated/**` (verificable por diff).
- Verify: `pnpm typecheck && test -d src/features/billing/components && test -d src/features/billing/hooks`
## Done summary
Implemented fn-22-feat-025-paid-plans-stripe-billing-ui.1; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: