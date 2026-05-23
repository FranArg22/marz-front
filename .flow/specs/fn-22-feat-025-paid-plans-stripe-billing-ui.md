# Billing de planes pagos con Stripe — Frontend

## Goal

Conectar el flujo de billing SaaS Stripe en el frontend: el paywall del onboarding brand (B13) crea Stripe Checkout Sessions reales y redirige al hosted checkout; al volver, una ruta callback espera la activación de la suscripción consultando `GET /v1/billing/subscription`. Una pill en el `AppTopbar` brand alerta los 3 estados de billing accionables (`trial_ending`, `past_due`, `canceled_pending`) y abre el Stripe Customer Portal. Una nueva ruta `/billing` muestra el estado vigente y delega la gestión completa al portal.

Todo se consume vía hooks generados por Orval (`useBillingPlans`, `useBillingSubscription`, mutations de checkout/portal) sin lógica de billing en cliente: el estado vive en server state (React Query) y el backend es la fuente de verdad.

## Scope (in)

- Refactor de `B13PaywallScreen` para consumir `GET /v1/billing/plans` y disparar `POST /v1/billing/checkout-sessions` real.
- Ruta nueva `/onboarding/brand/billing-callback` con poll de `useBillingSubscription` (refetchInterval 2s, timeout 30s) y navegación a step siguiente / paywall según resultado.
- Pill nueva `BillingTopbarPill` montada en `AppTopbar`, condicional por `kind='brand'` y por `subscription_status`.
- Ruta nueva `/billing` (grupo `_brand`) con plan vigente, status, countdown, tarjeta enmascarada, próximo cobro, botón "Gestionar en Stripe" → portal.
- Componentes `PlansGrid`, `PlanCard`, `BillingPage` reutilizables en paywall y billing page.
- 4 hooks tipados Orval-backed para los endpoints billing.
- i18n strings (Lingui) en es-AR y en-US.

## Scope (out)

- Implementación backend Stripe / webhooks / sweepers (épica backend separada).
- Historial de invoices en el frontend (se delega al Customer Portal — RD2 del solution).
- Banner full-width arriba del App Shell (RD4 del solution: usamos pill compacto).
- Cambios en `_creator/` (creator no ve billing).
- Persistencia de billing en Zustand (server state vive en React Query exclusivamente).
- Captura de tarjeta in-app (Stripe Checkout hosted).

## Acceptance criteria

- [ ] El paso B13 del onboarding brand muestra los 6 planes (3 tiers × monthly/annual) leídos de `GET /v1/billing/plans` con toggle interval y CTA "free" que avanza el step sin checkout.
- [ ] Al elegir un plan, `POST /v1/billing/checkout-sessions` se invoca con `plan`, `interval`, `success_url`, `cancel_url`, `Idempotency-Key`; tras 201, el browser navega a `checkout_url`.
- [ ] La ruta `/onboarding/brand/billing-callback?checkout=success` polea `GET /v1/billing/subscription` cada 2s hasta `status` ∈ {`trialing`,`active`} (timeout 30s) y luego navega al step siguiente; con `?checkout=cancelled` o timeout muestra mensaje y vuelve al paywall.
- [ ] `BillingTopbarPill` renderiza copy + color + handler distintos para cada estado (`trial_ending` ≤2d, `past_due`, `canceled_pending`); fuera de esos estados o si `kind='creator'` renderiza `null`.
- [ ] Click en la pill abre Customer Portal (mutation `POST /v1/billing/portal-sessions`) y redirige a `portal_url`.
- [ ] `/billing` (solo `_brand`) muestra plan, status, countdown (`days_until_trial_ends` o `days_until_downgrade`), `card.brand`+`card.last4` enmascarada, `next_invoice_amount_usd`+`next_invoice_at`; 404 si `plan='free'` / `no_subscription`.
- [ ] Todos los hooks billing son Orval-generated; cero `fetch` crudo y cero `useEffect`-fetch.
- [ ] Visual ≥95% match con el `.pen` (B13 paywall + secBilling 4 variantes) en light + dark.
- [ ] Cero strings hardcoded user-facing: todo pasa por Lingui en es-AR + en-US.
- [ ] `pnpm work:post` pasa (lint, typecheck, react-doctor, vitest, e2e, knip, check:api-direct, check:i18n-standards).

## Risks

- **Backend dev no desplegado a tiempo**: F.1 depende de B.6 desplegado en backend dev para que `pnpm api:sync` traiga schemas billing; sin eso, los hooks no se generan. Mitigación: si los schemas no aparecen tras `api:sync`, bloquear la épica antes que mockear el cliente.
- **Stripe Checkout en test mode con prices distintos por env**: los `stripe_price_id` viven en backend; el frontend solo envía `plan`+`interval`. Riesgo de mismatch si seed no corre. Mitigación: E2E de F.5 corre contra backend dev real y falla rápido si plan no existe.
- **`days_until_trial_ends`/`days_until_downgrade` calculados client-side por error**: el solution los expone server-side en `GET /v1/billing/subscription`. Mitigación: lint/review impide cálculo de fechas en componentes; usar directo el campo del response.
- **Hidratación SSR con `new Date()` en pill/countdown**: regla React Doctor prohibe `new Date()` en JSX. Mitigación: usar hook `useClientNow` existente y reaccionar al campo server-side.
