# fn-31-feat-039-e2e-ajustes-perfil-de-marca.5 E2E brand-settings-subscription.spec.ts — plan usage cards (paid/free/scale/degradación)

## Description

Crea `src/test/e2e/suites/billing/brand-settings-subscription.spec.ts`. Cubre la card de uso del plan para los tres tiers (growth/free/scale) y el escenario de degradación parcial. Todos los tests usan `page.route()` para mockear los tres endpoints de la sección.

### Endpoints a mockear

- `GET /v1/billing/subscription` → estado de suscripción
- `GET /v1/billing/payment-methods` → métodos de pago (solo en plan pago)
- `GET /v1/billing/plan-usage` → datos de uso del plan

### Mock helpers sugeridos

```typescript
function mockGrowthSubscription(page: Page) {
  return page.route(/\/v1\/billing\/subscription$/, async (route) => {
    if (route.request().method() !== 'GET') { await route.continue(); return }
    await route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ data: {
        plan: 'growth', interval: 'month', status: 'active',
        current_period_end: '2026-07-17T00:00:00Z',
        amount: '49.00', currency: 'USD',
      }})
    })
  })
}

function mockPlanUsage(page: Page, usage: object) {
  return page.route(/\/v1\/billing\/plan-usage$/, async (route) => {
    if (route.request().method() !== 'GET') { await route.continue(); return }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: usage }) })
  })
}

function mockPaymentMethods(page: Page) {
  return page.route(/\/v1\/billing\/payment-methods$/, async (route) => {
    if (route.request().method() !== 'GET') { await route.continue(); return }
    await route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ data: { items: [{ brand: 'visa', last4: '4242', exp_month: 12, exp_year: 2034 }] } })
    })
  })
}

function mockFreeSubscription(page: Page) {
  // Plan free = 404 en /billing/subscription (workspace sin suscripción activa)
  return page.route(/\/v1\/billing\/subscription$/, async (route) => {
    if (route.request().method() !== 'GET') { await route.continue(); return }
    await route.fulfill({ status: 404, contentType: 'application/json',
      body: JSON.stringify({ error: { code: 'subscription_not_found' } }) })
  })
}
```

**Datos de uso por tier:**

```typescript
const GROWTH_USAGE = {
  campaigns_active: { current: 2, limit: 3, available: true },
  creators_active: { current: 3, limit: 15, available: true },
  invitations: { current: 47, limit: 100, cycle_resets_at: '2026-07-17T00:00:00Z', available: true },
}

const FREE_USAGE = {
  campaigns_active: { current: 1, limit: 1, available: true },
  creators_active: { current: 7, limit: null, available: true },
  invitations: { current: 0, limit: 0, cycle_resets_at: null, available: true },
}

const SCALE_USAGE = {
  campaigns_active: { current: 5, limit: null, available: true },
  creators_active: { current: 12, limit: null, available: true },
  invitations: { current: 200, limit: null, cycle_resets_at: null, available: true },
}

const GROWTH_USAGE_DEGRADED = {
  campaigns_active: { current: 2, limit: 3, available: true },
  creators_active: { current: null, limit: 15, available: false },
  invitations: { current: 47, limit: 100, cycle_resets_at: '2026-07-17T00:00:00Z', available: true },
}
```

### Tests a implementar

#### Test 1: `brand_settings.subscription.paid_plan_summary` (ESC-11 parte 1)

- Mock: `mockGrowthSubscription` + `mockPaymentMethods` + `mockPlanUsage(GROWTH_USAGE)`
- Navegar a `/ajustes/suscripcion`
- Assertions:
  - Texto del plan visible (e.g., "Growth" o "growth" — buscar con `/Growth/i`)
  - Tarjeta de pago visible "visa •••• 4242" (o similar)
  - El botón `[data-testid="settings.subscription.manage_stripe_button"]` está visible y enabled
  - La card de uso está visible (`[data-testid="plan-usage.campaigns"]` visible)

#### Test 2: `brand_settings.subscription.plan_usage_card_paid` (ESC-11 parte 2)

- Mock: igual al anterior
- Navegar a `/ajustes/suscripcion`
- Assertions en mini-cards (los `data-testid` de `PlanUsageCard` ya existen):
  - `[data-testid="plan-usage.campaigns"]` contiene texto "2 de 3"
  - `[data-testid="plan-usage.creators"]` contiene texto "3 de 15"
  - `[data-testid="plan-usage.invitations"]` contiene texto "47 de 100"
  - `[data-testid="plan-usage.invitations"]` contiene texto de reinicio de ciclo (regex `/Reinicia/i`)
  - Las mini-cards de campaigns y creators tienen `role="progressbar"` visible

#### Test 3: `brand_settings.subscription.free_cta_visible` (ESC-12 parte 1)

- Mock: `mockFreeSubscription` + `mockPlanUsage(FREE_USAGE)`
- Navegar a `/ajustes/suscripcion`
- Assertions:
  - El texto "Plan gratuito" visible (o similar según `FreePlanCTA`)
  - Botón `[data-testid="settings.subscription.upgrade_cta_button"]` visible y enabled
  - NO hay `[data-testid="settings.subscription.manage_stripe_button"]`

#### Test 4: `brand_settings.subscription.plan_usage_card_free` (ESC-12 parte 2)

- Mock: igual al anterior
- Assertions en mini-cards:
  - `[data-testid="plan-usage.campaigns"]` contiene "1 de 1"
  - `[data-testid="plan-usage.creators"]` contiene texto "de ∞" (o equivalente — `PlanUsageCard` renderiza `∞` cuando `limit === null`)
  - `[data-testid="plan-usage.invitations"]` contiene "N/A" (cuando `limit === 0`, el componente renderiza "N/A")
  - La mini-card de invitaciones NO tiene `role="progressbar"` (no hay barra cuando es N/A)
  - La mini-card de creators NO tiene `role="progressbar"` (sin barra cuando es ilimitado)

#### Test 5: `brand_settings.subscription.plan_usage_card_scale` (ESC-13)

- Mock: `mockScaleSubscription` (crear similar a growth pero `plan: 'scale'`) + `mockPlanUsage(SCALE_USAGE)`
- Assertions:
  - Las tres mini-cards contienen "de ∞"
  - Ninguna mini-card tiene `role="progressbar"`

#### Test 6: `brand_settings.subscription.plan_usage_partial_degradation` (ESC-14)

- Mock growth subscription + `mockPlanUsage(GROWTH_USAGE_DEGRADED)` (creators_active `available: false`)
- Navegar a `/ajustes/suscripcion`
- Assertions:
  - `[data-testid="plan-usage.campaigns"]` renderiza normalmente (visible con "2 de 3")
  - `[data-testid="plan-usage.creators"]` muestra "No disponible" (según `PlanUsageCard.tsx` cuando `!metric.available`)
  - `[data-testid="plan-usage.invitations"]` renderiza normalmente

**Referencia**: `PlanUsageCard.tsx` en `src/features/billing/settings/PlanUsageCard.tsx` ya existe con los `data-testid`. Verificar que `plan-usage.creators` con `available: false` renderiza el texto "No disponible".

### Verificación

```bash
pnpm test:e2e -- src/test/e2e/suites/billing/brand-settings-subscription.spec.ts --grep "plan_usage|paid_plan|free_cta"
pnpm typecheck
```

## Acceptance

- [ ] Existe `src/test/e2e/suites/billing/brand-settings-subscription.spec.ts`.
- [ ] Test `brand_settings.subscription.paid_plan_summary`: plan "Growth" visible, botón Stripe visible.
- [ ] Test `brand_settings.subscription.plan_usage_card_paid`: "2 de 3", "3 de 15", "47 de 100" + reinicio de ciclo.
- [ ] Test `brand_settings.subscription.free_cta_visible`: FreePlanCTA visible, botón upgrade visible, no botón Stripe.
- [ ] Test `brand_settings.subscription.plan_usage_card_free`: "1 de 1", "X de ∞", "N/A" sin barra de invitaciones.
- [ ] Test `brand_settings.subscription.plan_usage_card_scale`: tres "X de ∞", sin barras.
- [ ] Test `brand_settings.subscription.plan_usage_partial_degradation`: creators muestra "No disponible", resto OK.
- [ ] `pnpm typecheck` pasa.
- [ ] `pnpm quality-gates` verde.

## Done summary
Implemented fn-31-feat-039-e2e-ajustes-perfil-de-marca.5; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: