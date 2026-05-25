# fn-24-feat-026-e2e-billing-payment-method.2 Extender billing-page.spec.ts con assertions de ESC-1 via testid

## Description

El test existente en `src/test/e2e/suites/billing/billing-page.spec.ts` ya verifica el flujo completo: crea un brand owner, pasa por el Stripe checkout (test mode), navega a `/billing`, y aserta que aparecen `visa •••• 4242` y `Se usa para suscripción y pagos a creators`.

**Este task extiende ese test** — no crea un test nuevo — para que las assertions estén scoped al bloque `data-testid="billing.page.active_subscription_portal"` (añadido en la task anterior `.1`). El objetivo es que el test use el testid como punto de anclaje estable en lugar de buscar texto en toda la página.

### Prerequisito

Task `.1` debe estar completada: `data-testid="billing.page.active_subscription_portal"` existe en `BillingPage.tsx`.

### Archivo a modificar

**`src/test/e2e/suites/billing/billing-page.spec.ts`**

El bloque de assertions tras navegar a `/billing` actualmente es (aprox. líneas 53-68):

```ts
await page.goto('/billing')
await expect(
  page.getByRole('heading', {
    name: /(suscripción está activa|período de prueba)/i,
  }),
).toBeVisible({ timeout: 15_000 })
await expect(page.getByText(/Starter \(mensual\)/i)).toBeVisible()
await expect(page.getByText(/visa •••• 4242/i)).toBeVisible()
await expect(
  page.getByText(/Se usa para suscripción y pagos a creators/i),
).toBeVisible()

await Promise.all([
  page.waitForURL(/billing\.stripe\.com/, { timeout: 30_000 }),
  page.getByRole('button', { name: /Gestionar.*en Stripe/i }).click(),
])
```

**Cambio requerido**: después de las assertions existentes, añadir las scoped al testid. El bloque final debe quedar así:

```ts
await page.goto('/billing')
await expect(
  page.getByRole('heading', {
    name: /(suscripción está activa|período de prueba)/i,
  }),
).toBeVisible({ timeout: 15_000 })
await expect(page.getByText(/Starter \(mensual\)/i)).toBeVisible()
await expect(page.getByText(/visa •••• 4242/i)).toBeVisible()
await expect(
  page.getByText(/Se usa para suscripción y pagos a creators/i),
).toBeVisible()

// ESC-1: bloque combinado de método de pago
const portalBlock = page.getByTestId('billing.page.active_subscription_portal')
await expect(portalBlock).toBeVisible()
await expect(portalBlock.getByText(/visa •••• 4242/i)).toBeVisible()
await expect(
  portalBlock.getByText(/Se usa para suscripción y pagos a creators/i),
).toBeVisible()

await Promise.all([
  page.waitForURL(/billing\.stripe\.com/, { timeout: 30_000 }),
  portalBlock.getByRole('button', { name: /Gestionar.*en Stripe/i }).click(),
])
```

El click del CTA cambia de `page.getByRole(...)` a `portalBlock.getByRole(...)` para que sea unambiguo cuando `same_payment_method=false` (donde habría dos botones `Gestionar en Stripe`).

### Reglas

- NO cambiar el `test.skip(!STRIPE_TEST_MODE_ENABLED, ...)` ni el timeout de 180s.
- NO crear un test case nuevo; extender el existente.
- NO importar nuevos helpers ni fixtures.
- Preservar todas las assertions existentes antes del bloque `portalBlock`.

## Verificación

```bash
pnpm typecheck
# El spec compila sin errores de tipos

# Con backend real y Stripe test mode:
STRIPE_TEST_MODE=1 pnpm test:e2e -- --grep "active_subscription"
```

Sin `STRIPE_TEST_MODE=1` el test se saltea (`test.skip`), lo cual es el comportamiento correcto. La verificación de typecheck no requiere backend.

## Acceptance

- [ ] `billing-page.spec.ts` tiene un `const portalBlock = page.getByTestId('billing.page.active_subscription_portal')`.
- [ ] El bloque `portalBlock` se aserta visible (`toBeVisible`).
- [ ] `portalBlock.getByText(/visa •••• 4242/i)` asertado visible.
- [ ] `portalBlock.getByText(/Se usa para suscripción y pagos a creators/i)` asertado visible.
- [ ] El click final del CTA usa `portalBlock.getByRole('button', { name: /Gestionar.*en Stripe/i })`.
- [ ] Las assertions anteriores al bloque `portalBlock` se mantienen intactas.
- [ ] `pnpm typecheck` pasa sin errores.
- [ ] `pnpm quality-gates` verde (los checks que no requieren backend real).

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
