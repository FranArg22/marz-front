# fn-22-feat-025-paid-plans-stripe-billing-ui.4 Refactor B13PaywallScreen con Stripe Checkout real

## Description
Reemplazar la UI mock del paso B13 del onboarding brand por una integración real con Stripe Checkout, usando `PlansGrid` (task 3) + `useBillingPlans` + `useCreateCheckoutSession` (task 2).

## Archivo principal

`src/features/identity/onboarding/brand/screens/B13PaywallScreen.tsx`.

## Comportamiento

1. Cargar planes con `useBillingPlans()`. Loading → skeleton del grid. Error → mensaje de error con CTA "Reintentar" (refetch del query).
2. Estado local mínimo: `selectedInterval: 'month' | 'year'` (default `'month'`), `selectedPlan: 'starter' | 'growth' | 'scale' | null`. `useState`. No persistir en Zustand (es state efímero de form).
3. Renderizar `<PlansGrid plans interval selectedPlan onIntervalChange onPlanSelect />`.
4. CTA primario "Continuar con plan pago":
   - Habilitado solo si `selectedPlan != null`.
   - Click → `mutate({ data: { plan, interval, success_url, cancel_url } })` con:
     - `success_url`: `${window.location.origin}/onboarding/brand/billing-callback?checkout=success`
     - `cancel_url`: `${window.location.origin}/onboarding/brand/billing-callback?checkout=cancelled`
   - `onSuccess` (response 201): `window.location.assign(response.data.checkout_url)`.
   - `onError`:
     - 409 `subscription_already_active` → mostrar mensaje "Ya tenés una suscripción activa" + CTA "Continuar" que avanza el step (la sub ya existe).
     - 422 `validation.*` → mensaje genérico de "Plan inválido, refrescá la página".
     - 502 `stripe_unavailable` → mensaje "Stripe no responde, intentá de nuevo" + CTA reintentar.
     - Otro → mensaje genérico de error.
5. CTA secundario footer "Prefiero seguir sin la red de creadores":
   - Click → llamar a la función del onboarding store/handler que avanza al step siguiente sin checkout. El workspace ya está en `plan='free'` por default; no se llama checkout.
   - Verificar en `src/features/identity/onboarding/brand/store.ts` y `steps.ts` cuál es el mecanismo de avance del step y reutilizarlo. **No** duplicar lógica de avance.

## Reglas críticas

- No usar `react-hook-form`. Si necesitás form (no debería para 1 select), TanStack Form + Zod. Acá basta con `useState` + handler.
- No hardcodear strings: todo via Lingui.
- No mutar `brand_workspaces.plan` ni nada del backend: el plan se confirma vía webhook server-side; el frontend solo redirige a Checkout y espera.
- Cero `useEffect` para fetching. Toda la data del server por hook.
- El éxito del checkout NO se confirma en este componente: confirma en la billing-callback page (task 5).

## Tests (Vitest + Testing Library)

- Render: muestra `PlansGrid` con planes mockeados.
- Selección de plan habilita CTA primario.
- Click en CTA primario llama mutation con `plan`, `interval`, `success_url`, `cancel_url` correctos.
- `onSuccess` → `window.location.assign` invocado con `checkout_url` (mockear `window.location`).
- 409 → muestra mensaje "ya tenés sub activa" + CTA de avance.
- Click en CTA "free" avanza step sin invocar mutation (verificar que el spy de la mutation NO se llama).
- Loading state → skeleton renderiza.
- Error en `useBillingPlans` → mensaje + botón refetch.

## E2E

Diferir el E2E completo paywall → Stripe Checkout test mode a la task 5 (callback), que cubre el flow end-to-end. Acá basta con tests unit.
## Acceptance
- `B13PaywallScreen.tsx` consume `useBillingPlans` + `useCreateCheckoutSession`.
- Cero mock data hardcoded de planes en el componente.
- CTA primario deshabilitado sin plan seleccionado.
- `success_url` y `cancel_url` apuntan a `/onboarding/brand/billing-callback?checkout=success|cancelled`.
- CTA "free" avanza step usando el mecanismo existente del onboarding store/steps, sin invocar checkout mutation.
- Errores 409/422/502/genérico tienen mensajes distintos y testeados.
- Cero strings hardcoded user-facing.
- Cero `useEffect`-fetch ni `fetch` crudo.
- Cero edición de archivos generados.
- Tests Vitest pasan.
- `B13PaywallScreen.test.tsx` cubre los 6 escenarios arriba.
- Verify: `pnpm vitest run src/features/identity/onboarding/brand/screens/B13PaywallScreen && pnpm lint && pnpm typecheck && pnpm react-doctor`
## Done summary
Implemented fn-22-feat-025-paid-plans-stripe-billing-ui.4; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: