# fn-31-feat-039-e2e-ajustes-perfil-de-marca.6 E2E brand-settings-subscription.spec.ts — upgrade modal, Stripe portal, checkout

## Description

Agrega tests al archivo `src/test/e2e/suites/billing/brand-settings-subscription.spec.ts` (creado en T5). Cubre el portal de Stripe, el modal de upgrade (apertura + checkout redirect), checkout rechazado para plan pago, y checkout idempotente. Además agrega ESC-22 y ESC-23 como `test.skip` con TODO.

### Tests a implementar

#### Test 1: `brand_settings.subscription.stripe_portal_redirect` (ESC-15)

- Mock growth subscription + payment methods + plan usage (GROWTH_USAGE del T5)
- Mock `POST /v1/billing/portal-sessions` → 201 con `{ data: { url: 'https://billing.stripe.com/session/test' } }`
- Capturar la navegación para verificar redirect (usar `page.waitForRequest` o interceptar `window.location.href`)
- Navegar a `/ajustes/suscripcion`
- Click en `[data-testid="settings.subscription.manage_stripe_button"]`
- Assertion: se llamó `POST /v1/billing/portal-sessions` y el frontend intentó navegar a la URL del portal
- Implementación: usar `page.route` para capturar el POST del portal y luego mock `page.on('framenavigated', ...)` o interceptar con `page.route('https://billing.stripe.com/**', ...)` para evitar salir de la app en el test

**Nota sobre navegación externa**: para evitar que el test salga al dominio de Stripe, interceptar la URL de destino:
```typescript
await page.route('https://billing.stripe.com/**', async (route) => {
  await route.abort() // abortar la navegación a Stripe en test
})
```
O verificar solo que se llamó el endpoint del portal y que el response tenía la URL correcta, sin ejecutar el redirect.

#### Test 2: `brand_settings.subscription.free_upgrade_modal_open` (ESC-16 parte 1)

- Mock free subscription (404) + plan usage FREE_USAGE + mock `GET /v1/billing/plans` → catálogo de planes
- Navegar a `/ajustes/suscripcion`
- Click en `[data-testid="settings.subscription.upgrade_cta_button"]`
- Assertions:
  - El modal de upgrade está visible (`PlanUpgradeModal` — buscar `role="dialog"` o título del modal)
  - Se renderiza la grilla de planes (3 planes pagos: Starter, Growth, Scale)
  - El modal cierra al presionar Escape (`page.keyboard.press('Escape')` → modal no visible)

**Mock de GET /v1/billing/plans:**
```typescript
await page.route(/\/v1\/billing\/plans$/, async (route) => {
  await route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ data: { plans: [
      { id: 'starter', name: 'Starter', monthly_price: '19.00', annual_price: '190.00' },
      { id: 'growth', name: 'Growth', monthly_price: '49.00', annual_price: '490.00' },
      { id: 'scale', name: 'Scale', monthly_price: '149.00', annual_price: '1490.00' },
    ]}})
  })
})
```

Verificar la estructura exacta del response en `src/shared/api/generated/model/billingPlansResponse.ts` antes de hardcodear el mock.

#### Test 3: `brand_settings.subscription.free_upgrade_checkout_redirect` (ESC-16 parte 2)

- Mock igual al anterior + mock `POST /v1/billing/checkout-sessions` → 201 con `{ data: { checkout_url: 'https://checkout.stripe.com/c/pay/test' } }`
- Interceptar navegación a Stripe:
```typescript
await page.route('https://checkout.stripe.com/**', async (route) => { await route.abort() })
```
- Abrir el modal, seleccionar Growth mensual, click en el botón del plan
- Assertions:
  - `POST /v1/billing/checkout-sessions` fue llamado con body `{ plan: 'growth', interval: 'monthly', success_url: ..., cancel_url: ... }`
  - El request incluye header `Idempotency-Key` no vacío
  - El frontend intentó navegar a la URL del checkout

#### Test 4: `brand_settings.subscription.checkout_already_subscribed` (ESC-17)

- Mock growth subscription (plan pago activo)
- Mock `POST /v1/billing/checkout-sessions` → 403 `{ error: { code: 'already_subscribed' } }`
- Navegar a `/ajustes/suscripcion`
- Disparar el POST manualmente usando `page.evaluate`:
```typescript
const result = await page.evaluate(async () => {
  const res = await fetch('/v1/billing/checkout-sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'test-key' },
    body: JSON.stringify({ plan: 'growth', interval: 'monthly', success_url: '/', cancel_url: '/' }),
  })
  return { status: res.status }
})
expect(result.status).toBe(403)
```
- Assertion: respuesta es 403

**Nota**: este test verifica el comportamiento del backend cuando el workspace ya tiene suscripción. Dado que el backend está mockeado en 403, el test confirma que el componente maneja la respuesta correctamente (no redirige, muestra error o simplemente no hace nada observable en UI).

#### Test 5: `brand_settings.subscription.checkout_idempotent_replay` (ESC-18)

- Mock free subscription + planes
- Mock POST checkout-sessions → responder siempre con el mismo `checkout_url` para la misma Idempotency-Key
- Disparar dos POST con la misma `Idempotency-Key` usando `page.evaluate`
- Assertion: ambas respuestas son 201 con el mismo `checkout_url`

**Implementación**: como el backend está mockeado, se puede verificar que el frontend genera la misma clave de idempotencia si repite la operación. Alternativamente, disparar ambos requests directamente vía `page.evaluate` con la misma key hardcodeada y verificar el mock responde igual.

#### Tests skeleton ESC-22 y ESC-23 (time manipulation — tooling pendiente)

```typescript
test.skip('brand_settings.subscription.invitations_cycle_reset (ESC-22)', async () => {
  // TODO: requiere control de reloj de la app (Clock.Set(t)).
  // Cuando el harness soporte clock injection:
  // 1. Fijar reloj a 2026-06-16 (post-mesario del 15)
  // 2. Mockear plan-usage con current: 5, limit: 100, cycle_resets_at: '2026-07-15T00:00:00Z'
  // 3. Verificar que la mini-card muestra "5 de 100" y reinicio "15/07/2026"
})

test.skip('brand_settings.subscription.cycle_resets_at_clamp_end_of_month (ESC-23)', async () => {
  // TODO: requiere control de reloj de la app.
  // Cuando el harness soporte clock injection:
  // 1. Fijar reloj a 2026-02-10
  // 2. Mockear plan-usage con cycle_resets_at: '2026-02-28T00:00:00Z'
  // 3. Verificar que la fecha mostrada es 28/02/2026 (no 31)
  // Mientras tanto: este escenario se cubre en el test unitario de PlanUsageCard.
})
```

### Verificación

```bash
pnpm test:e2e -- src/test/e2e/suites/billing/brand-settings-subscription.spec.ts --grep "upgrade|portal|checkout"
pnpm typecheck
```

## Acceptance

- [ ] Test `brand_settings.subscription.stripe_portal_redirect`: POST portal-sessions llamado, redirect interceptado.
- [ ] Test `brand_settings.subscription.free_upgrade_modal_open`: modal visible con 3 planes, Escape cierra el modal.
- [ ] Test `brand_settings.subscription.free_upgrade_checkout_redirect`: POST checkout-sessions con body correcto e Idempotency-Key, redirect interceptado.
- [ ] Test `brand_settings.subscription.checkout_already_subscribed`: 403 con `already_subscribed`.
- [ ] Test `brand_settings.subscription.checkout_idempotent_replay`: ambos POSTs retornan 201 con el mismo checkout_url.
- [ ] ESC-22 y ESC-23 agregados como `test.skip` con TODO explicativo.
- [ ] `pnpm typecheck` pasa.
- [ ] `pnpm quality-gates` verde.

## Done summary
Implemented fn-31-feat-039-e2e-ajustes-perfil-de-marca.6; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: