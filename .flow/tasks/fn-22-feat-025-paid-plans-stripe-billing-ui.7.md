# fn-22-feat-025-paid-plans-stripe-billing-ui.7 BillingPage en ruta /billing (4 variantes de estado)

## Description
Ruta nueva `/billing` (grupo `_brand`) y componente `BillingPage` que muestra el estado de la suscripción y delega gestión al Stripe Customer Portal.

## Archivos

- Nueva ruta: `src/routes/_brand/billing.tsx` (file-based; entra al guard de `_brand.tsx` automáticamente).
- Nuevo componente: `src/features/billing/components/BillingPage.tsx`.

## Estructura ruta

La ruta es composición pura (`profiles/knowledge/routing.md` y `base-react.md`):

- `createFileRoute` con `loader` que prefetchea `useBillingSubscription`.
- Si el response es 404 `no_subscription` o `plan === 'free'`: `throw redirect({ to: '/' })` desde `loader`.
- Render: `<BillingPage />` (sin lógica adicional en la ruta).

## Componente `BillingPage`

Lee `useBillingSubscription({ staleTime: 30_000 })`. 4 variantes visuales según `status`:

### `trialing`

- Header "Estás en período de prueba"
- Plan: `{plan} ({interval})` + amount.
- Countdown: `days_until_trial_ends` con copy "Tu trial termina en N días".
- Tarjeta: si `card.brand` + `card.last4`, mostrar `•••• {last4}` + ícono brand; si null, mostrar "Sin tarjeta cargada".
- Próximo cobro: `next_invoice_amount_usd` + `next_invoice_at` formateado.
- CTA primario "Gestionar en Stripe" → portal.

### `active`

- Header "Tu suscripción está activa"
- Plan, tarjeta, próximo cobro.
- CTA "Gestionar en Stripe".

### `past_due`

- Header destacado en color destructive "Tu último cobro falló"
- Sub-mensaje "Tenés N días para regularizar antes de perder acceso" donde N = 7 - días desde `past_due_started_at` (calcular server-side; si el response no expone ese campo, mostrar mensaje genérico "Actualizá tu tarjeta para mantener el acceso" sin countdown — no calcular fecha en cliente).
- Plan, tarjeta.
- CTA primario destacado "Actualizar tarjeta en Stripe" → portal.

### `canceled`

- Header "Cancelaste tu suscripción"
- Copy "Mantenés acceso hasta DD/MM/YYYY" usando `cancel_at` formateado.
- Plan, tarjeta (read-only).
- CTA "Gestionar en Stripe" (permite reactivar).

## Botón portal

- Wrappea `useCreatePortalSession()`.
- `mutate({ data: { return_url: `${window.location.origin}/billing` } })` → `onSuccess` → `window.location.assign(response.data.portal_url)`.
- Loading: spinner inline + botón disabled.
- Error: toast/inline message "Stripe no responde, intentá de nuevo".

## Reglas

- `Intl.DateTimeFormat` / `Intl.NumberFormat` hoisteados a module scope.
- Headings `font-semibold`.
- Cero `new Date()` en JSX; los días vienen del server (`days_until_trial_ends`).
- Cero strings hardcoded.
- Cero invalidaciones manuales de query.
- Cero estado de cliente para data del backend.
- Tokens y utilities Tailwind exclusivamente.

## Consulta al `.pen`

Antes de implementar, leer `secBilling` del `.pen` via Pencil MCP. 4 variantes light + dark. Mapear cada propiedad a token/utility.

## Tests (Vitest)

- 4 tests, uno por status, verifican que renderiza el bloque correcto.
- Test que verifica `plan='free'` → la ruta hace redirect (testeable mockeando el loader o assertando que el componente no renderiza si pasa).
- Test que click en "Gestionar en Stripe" invoca mutation y `window.location.assign`.
- Test de error de mutation muestra mensaje de fallback.

## E2E (Playwright)

`src/test/e2e/billing-page.spec.ts`:
- Seedear workspace brand con sub `active`.
- Navegar a `/billing`.
- Verificar plan + tarjeta visible.
- Click en "Gestionar en Stripe" → verificar redirect a `billing.stripe.com/...` (modo test).

Correr solo este spec; no `pnpm test:e2e` full.
## Acceptance
- `src/routes/_brand/billing.tsx` existe y es composición pura.
- Redirect a `/` cuando `plan='free'` / `no_subscription`, hecho en `loader`/`beforeLoad`.
- `BillingPage` renderiza 4 bloques distintos por `status` (testeados).
- Cero cálculos de fecha en cliente; `days_until_*` y `cancel_at` se leen del response.
- `Intl.*` hoisteados a module scope.
- Cero strings hardcoded; cero colores hex.
- Botón "Gestionar en Stripe" usa `useCreatePortalSession` y redirige a `portal_url`.
- Tests Vitest pasan (6+ casos).
- E2E del flow `active` → portal pasa.
- Verify: `pnpm vitest run src/features/billing/components/BillingPage src/routes/_brand/billing && pnpm test:e2e src/test/e2e/billing-page.spec.ts && pnpm lint && pnpm typecheck && pnpm react-doctor`
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
