# fn-33-feat-ach-withdrawals-creator-wallet.8 E2E: withdrawals happy path + edge cases

## Description

Crear spec Playwright en `src/test/e2e/suites/earnings/withdrawals.spec.ts`. Usar el patrón existente de los specs de settings (fixtures, mocks con `page.route`, helpers de seed).

### Patrón de referencia

Ver `src/test/e2e/suites/creator-settings/wallet.spec.ts` para:
- Cómo usar `onboardedCreatorUser.signIn(page)`
- Cómo mockear con `page.route('**/v1/...')`
- Cómo seedear data con `page.request.fetch(...)`
- Cómo usar `getClerkSessionToken(page)`

### Casos de test

**Test 1: `earnings.withdrawals.shows_balance`**
```
Seed: creator con balance $152.50 en wallet
Goto: /earnings
Verify: "Balance disponible" KPI visible con "$153" (o "$152.50" si se usa maximumFractionDigits:2)
Verify: "Próximo pago" NO visible
Verify: botón "Retirar" visible y habilitado
```

Implementar con mock de wallet:
```ts
await page.route('**/v1/creators/me/wallet', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      balance: { amount: '152.50', currency: 'USD' },
      withdrawal_fee_pct: '2.5',
      min_withdrawal: { amount: '10.00', currency: 'USD' },
      can_withdraw: true,
      eligibility: {
        requires_w8ben: false,
        w8ben_redirect_url: null,
        has_payout_account: true,
        has_inflight_withdrawal: false,
      },
    }),
  })
})
```

**Test 2: `earnings.withdrawals.happy_path`**
```
Seed: wallet con balance $100.00, can_withdraw: true, payout_account existente
Goto: /earnings
Click: "Retirar"
Verify: modal abierto con input de monto
Fill: "50" en el input
Verify: desglose visible "Retirás USD 50.00 / Comisión... − USD 1.25 / Vas a recibir USD 48.75"
Mock: POST /v1/creators/me/withdrawals → 201 { id: 'w-1', status: 'requested', gross: '50.00', fee: '1.25', net: '48.75', currency: 'USD', requested_at: '...' }
Click: "Confirmar retiro"
Verify: paso 2 visible con "Solicitud enviada"
Click: "Cerrar"
Verify: modal cerrado
```

**Test 3: `earnings.withdrawals.below_minimum_blocked`**
```
Setup: wallet con can_withdraw: true
Open modal
Fill: "5" en input
Verify: mensaje "Mínimo USD 10.00" visible
Verify: botón "Confirmar" deshabilitado
```

**Test 4: `earnings.withdrawals.inflight_button_disabled`**
```
Mock: wallet con has_inflight_withdrawal: true, can_withdraw: false
Goto: /earnings
Verify: botón "Retiro en proceso" visible y deshabilitado
```

**Test 5: `earnings.withdrawals.w8ben_gate`**
```
Mock: wallet con requires_w8ben: true, w8ben_redirect_url: 'https://pagos.go-marz.com/w8?token=abc', can_withdraw: false
Goto: /earnings
Verify: botón "Completar formulario W-8BEN" visible
Click: botón
Verify: modal W-8BEN visible con título "Formulario W-8BEN requerido"
Verify: botón "Completar formulario" visible (no hacemos click real para no redirigir)
```

**Test 6: `earnings.withdrawals.history_list`**
```
Mock: GET /v1/creators/me/withdrawals → { items: [
  { id: 'w-1', status: 'sent', net: { amount: '97.50', currency: 'USD' }, requested_at: '2026-06-01T10:00:00Z', sent_at: '2026-06-02T09:00:00Z' },
  { id: 'w-2', status: 'requested', net: { amount: '48.75', currency: 'USD' }, requested_at: '2026-06-28T10:00:00Z', sent_at: null }
], total: 2, page: 1, per_page: 10 }
Goto: /earnings
Verify: "Historial de retiros" heading visible
Verify: fila con "Enviado ✓" visible
Verify: fila con "En cola" visible
Verify: montos netos visibles ($97.50 y $48.75)
Verify: botón "Cancelar" visible SOLO en la fila con status 'requested' (w-2)
Verify: botón "Cancelar" NO visible en la fila con status 'sent' (w-1)
```

**Test 7: `earnings.withdrawals.detail_comprobante`**
```
Mock: lista con w-1 (sent)
Mock: GET /v1/creators/me/withdrawals/w-1 → { id: 'w-1', status: 'sent', gross: { amount: '100.00', currency: 'USD' }, fee: { amount: '2.50', currency: 'USD' }, net: { amount: '97.50', currency: 'USD' }, requested_at: '2026-06-01T10:00:00Z', sent_at: '2026-06-02T09:00:00Z', mercury_transaction_id: 'txn_123' }
Click: "Ver detalle" en la fila w-1
Verify: modal "Comprobante de retiro" abierto
Verify: "USD 100.00" (bruto), "USD 2.50" (comisión), "USD 97.50" (neto) visibles
Verify: "Enviado ✓" badge visible
Verify: referencia Mercury "txn_123" visible
Verify: botón "Cancelar retiro" NO visible (status es 'sent')
```

**Test 8: `earnings.withdrawals.cancel_requested`**
```
Mock: wallet con balance $100.00
Mock: GET /v1/creators/me/withdrawals → { items: [
  { id: 'w-3', status: 'requested', net: { amount: '48.75', currency: 'USD' }, requested_at: '2026-06-28T10:00:00Z', sent_at: null }
], total: 1, page: 1, per_page: 10 }
Mock: POST /v1/creators/me/withdrawals/w-3/cancel → 200 { id: 'w-3', status: 'cancelled' }
Goto: /earnings
Verify: fila w-3 con "En cola" y botón "Cancelar" visible
Click: "Cancelar"
Verify: diálogo de confirmación visible
Click: confirmar cancelación
Verify: POST cancel fue llamado
Verify: fila actualizada (tras invalidación)
```

### Estructura del archivo

```ts
import type { Page } from '@playwright/test'
import { test, expect } from '../../support/fixtures'

const WALLET_API = '**/v1/creators/me/wallet'
const WITHDRAWALS_API = '**/v1/creators/me/withdrawals'

test.describe('Earnings — Withdrawals', () => {
  // test 1...
  // test 2...
  // ...
})

// helpers
async function mockWallet(page: Page, overrides: Partial<WalletPayload> = {}) { ... }
async function gotoEarnings(page: Page, user: ...) { ... }
```

### Notas de implementación

- El `onboardedCreatorUser` de las fixtures probablemente no tiene balance — mockear el wallet en todos los tests que lo necesiten con `page.route`
- Para el test de happy path, también mockear `GET /v1/creators/me/withdrawals` (historial) para que no falle por no tener data real
- Usar `await expect(locator).toBeVisible()` en lugar de assertions sincrónicas
- No usar `await page.waitForTimeout(...)` — usar `await expect(...)` que tiene retry

## Acceptance

- [ ] Spec `src/test/e2e/suites/earnings/withdrawals.spec.ts` creado con los 8 tests
- [ ] Test 1: balance visible en KPI, "Próximo pago" ausente
- [ ] Test 2: happy path completo — modal abre, desglose correcto, confirma, paso 2 visible
- [ ] Test 3: mínimo $10 bloqueado client-side, botón deshabilitado
- [ ] Test 4: in-flight → botón deshabilitado
- [ ] Test 5: W-8BEN gate → modal interstitial visible
- [ ] Test 6: historial con estados correctos + botón cancelar solo en `requested`
- [ ] Test 7: comprobante con bruto/comisión/neto y referencia Mercury, sin botón cancelar (sent)
- [ ] Test 8: cancelar retiro `requested` — confirma, POST cancel ejecutado, UI se actualiza
- [ ] `pnpm test:e2e` pasa (todos los tests nuevos en verde)
- [ ] `pnpm quality-gates` en verde completo

## Done summary
Implemented fn-33-feat-ach-withdrawals-creator-wallet.8; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: