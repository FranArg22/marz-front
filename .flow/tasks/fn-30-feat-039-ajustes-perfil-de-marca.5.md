# fn-30-feat-039-ajustes-perfil-de-marca.5 PlanUpgradeModal

## Description

> ESTA TAREA REQUIERE MIRAR EL DISEÑO — node_ids: ninguno específico en `FEAT-039.pen` (el modal no tiene diseño en este `.pen`; reusa `PlansGrid` y `PlanCard` existentes de `src/features/billing/components/`)

Implementar el modal de upgrade de plan para workspaces en `plan=free`. El modal muestra la grilla de planes, permite elegir intervalo (mensual/anual) y redirige al Stripe Checkout.

Verificar primero si `PlansGrid` de `src/features/billing/components/PlansGrid.tsx` es reutilizable directamente (ya existe de FEAT-025) o si necesita adaptación mínima.

## Archivo a crear

### `src/features/billing/settings/PlanUpgradeModal.tsx`

Modal con:
1. Toggle mensual / anual.
2. `PlansGrid` (de `src/features/billing/components/PlansGrid.tsx`) mostrando los 3 planes pagos (starter, growth, scale). Datos de `useBillingPlans()` — hook wrapper existente en `src/features/billing/hooks/useBillingPlans.ts`.
3. Click en un plan → mutation de checkout.

**Mutation de checkout con Idempotency-Key:**

Crear un hook wrapper (o inline en el componente) que envuelva `createBillingCheckoutSession` del Orval generado, añadiendo el header `Idempotency-Key`. Seguir el patrón existente de `src/features/billing/hooks/useCreatePortalSession.ts`:

```ts
import {
  createBillingCheckoutSession,
  useCreateBillingCheckoutSession,
} from '#/shared/api/generated/billing/billing'
import { generateIdempotencyKey } from '#/shared/api/idempotency'

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
```

`generateIdempotencyKey()` (de `#/shared/api/idempotency`) ya maneja el fallback para contextos no-secure (dev sobre http). NO usar `crypto.randomUUID()` directo.

**Payload de la mutation:**
```ts
{
  plan: selectedPlan,         // 'starter' | 'growth' | 'scale'
  interval: selectedInterval, // 'monthly' | 'yearly'
  success_url: `${window.location.origin}/ajustes/suscripcion`,
  cancel_url: `${window.location.origin}/ajustes/suscripcion`,
}
```

**On success (201):** redirigir a `response.data.checkout_url` vía `window.location.href = checkout_url`.

**On error 403 `already_subscribed`:** cerrar modal + toast "Tu workspace ya tiene un plan activo".

**Idempotency:** el botón queda `disabled` mientras `isPending` (la mutation está en curso). Esto previene doble click que generaría un segundo `Idempotency-Key` y dos sesiones.

**Props:**
```ts
interface PlanUpgradeModalProps {
  open: boolean
  onClose: () => void
}
```

**Integración con `FreePlanCTA`:** el botón "Mejorar plan" en `FreePlanCTA` (task 4) llama `onUpgrade` que el `SubscriptionSection` usa para setear `open=true` en el modal. El modal se monta en `SubscriptionSection` (o en la ruta) para que el portal sea correcto.

## Reglas

- No duplicar lógica de planes: usar `PlansGrid` y `PlanCard` existentes sin copiarlos.
- `generateIdempotencyKey()` de `#/shared/api/idempotency` — nunca `crypto.randomUUID()` directo (falla en contextos no-secure como dev http).
- Focus trap al abrir el modal; Escape para cerrar (usar la primitiva de Dialog del repo — ver imports en componentes existentes que usan modales).
- Sin estado propio para los datos de planes: delegar a `useBillingPlans`.
- Strings via Lingui.

## Tests (Vitest)

`src/features/billing/settings/PlanUpgradeModal.test.tsx`:
- Modal abierto con plan free → muestra grilla de 3 planes.
- Click en plan growth mensual → mutation llamada con `plan='growth'`, `interval='monthly'`, y `Idempotency-Key` presente en el request headers.
- Doble click → segunda llamada no se dispara (botón disabled durante `isPending`).
- On success → `window.location.href` apunta al `checkout_url`.
- Error 403 `already_subscribed` → toast de error + modal cierra.
- Escape → modal cierra.

## Acceptance
- [ ] Modal muestra grilla de 3 planes con toggle mensual/anual.
- [ ] Click en plan → mutation con `Idempotency-Key` (via `generateIdempotencyKey()`) → redirect a `checkout_url`.
- [ ] Doble click no genera dos sessions (botón disabled mientras `isPending`).
- [ ] Error 403 `already_subscribed` → toast + cierre.
- [ ] Focus trap activo; Escape cierra.
- [ ] `pnpm typecheck && pnpm vitest run src/features/billing/settings/PlanUpgradeModal` pasan.
- Verify: `pnpm typecheck && pnpm vitest run src/features/billing/settings/PlanUpgradeModal`

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
