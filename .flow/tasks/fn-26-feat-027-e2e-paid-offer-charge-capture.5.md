# fn-26-feat-027-e2e-paid-offer-charge-capture.5 Crear accept-paid-offer.spec.ts — ESC-6 y ESC-7 (creator acepta offer paid: capture exitoso y fallo)

## Description
Crear `src/test/e2e/suites/offers/accept-paid-offer.spec.ts` con ESC-6 y ESC-7: el creator acepta una offer paid (hold activo) y el flujo de fallo de capture.

**Prerequisitos**: Task .1 completada (data-testids) y Task .2 completada (approach de fixture definido).

### Setup de fixture para los tests de creator

Para que el creator pueda aceptar, debe existir una offer en estado `sent` con PaymentIntent en `requires_capture`. El test API no expone un endpoint para seedear este estado directamente.

**Approach**: Usar el fixture `chatPairOfferReady` de `src/test/e2e/support/fixtures.ts` (línea ~118) como base. Este fixture crea un par brand+creator con campaign y application aceptada vía `seedOfferReady`. Encima de eso, el test ejecuta el flujo de brand completo:

1. `chatPairOfferReady` → brand+creator en la misma conversation, campaign lista para offers.
2. Brand: setup billing (navegar a paywall, completar Stripe checkout con `4242`, según approach de T2).
3. Brand: abrir sidesheet, completar offer, hacer click en submit → offer queda en `sent`.
4. Obtener el ID de la offer creada (vía `GET /v1/conversations/{id}/offers` o desde la timeline).
5. Creator: abrir la conversation y aceptar la offer.

Si el approach de T2 confirmó un endpoint de fixture para crear la offer directamente, usar ese approach.

### ESC-6: Creator acepta offer paid — capture exitoso

```
test_id: offers.paid.creator_accept_captures_hold
```

Setup:
- Usar `chatPairOfferReady` fixture para tener brand + creator en la misma conversation.
- Brand completa billing + envío de offer (STRIPE_TEST_MODE=1, tarjeta 4242).
- Offer queda en estado `sent`.

Pasos (como creator):
1. Abrir la conversation como creator.
2. Localizar la card de offer en la timeline.
3. Hacer click en "Aceptar offer" (o equivalente).
4. Esperar confirmación de aceptación.
5. Asertar que la offer pasa a `accepted` (card de offer aceptada visible en timeline).
6. Asertar que la timeline NO contiene "Stripe", "PaymentIntent", "hold", "capture".
7. Refrescar la página y verificar que no se duplica la aceptación.

El test debe tener `test.skip(!STRIPE_TEST_MODE_ENABLED, ...)` y `test.setTimeout(180_000)`.

### ESC-7: Fallo de capture mantiene offer en `sent`

```
test_id: offers.paid.creator_accept_capture_failed
```

Para simular un fallo de capture, usar el approach determinado en T2. Opciones:
- `createTestFault` (schema en `src/shared/api/test-generated/model/createTestFaultRequest.ts`, campos: `method` string, `path` string, `status` number 100-599, `body` object, `count`) para inyectar fallo en el endpoint de aceptación de offer.
- Tarjeta Stripe específica que haga fallar el capture (verificar documentación de Stripe test cards para capture failures).

Setup: igual que ESC-6 pero con mecanismo de fallo de capture configurado antes de que el creator acepte.

Pasos (como creator):
1. Hacer click en "Aceptar offer".
2. Esperar el error (UI muestra mensaje de que el pago no se pudo procesar).
3. Asertar que la offer permanece en `sent` (no aparece card de offer aceptada).
4. Asertar que el botón de aceptar queda en un estado que evita reintentos no seguros (bloqueado, spinner, o equivalente según la implementación).

El test debe tener `test.skip(!STRIPE_TEST_MODE_ENABLED, ...)` y `test.setTimeout(180_000)`.

### Estructura del archivo

```ts
import { expect, test } from '../../support/fixtures'
import { ConversationPage } from '../../poms/conversation.pom'
// imports según T2

const STRIPE_TEST_MODE_ENABLED = process.env.STRIPE_TEST_MODE === '1'

test.describe('Offers: paid offer creator accept flow', () => {
  test('offers.paid.creator_accept_captures_hold', async ({ browser, ... }) => {
    test.skip(!STRIPE_TEST_MODE_ENABLED, 'Requires backend with STRIPE_TEST_MODE=1')
    test.setTimeout(180_000)
    // ESC-6
  })

  test('offers.paid.creator_accept_capture_failed', async ({ browser, ... }) => {
    test.skip(!STRIPE_TEST_MODE_ENABLED, 'Requires backend with STRIPE_TEST_MODE=1')
    test.setTimeout(180_000)
    // ESC-7
  })
})
```

### Reglas

- NO mockear Stripe ni la API en el browser.
- Usar `chatPairOfferReady` de `src/test/e2e/support/fixtures.ts` para el par brand/creator con conversation y campaign lista; extenderlo si hace falta pero no duplicar la lógica de creación de cuentas.
- Si el POM `ConversationPage` (`src/test/e2e/poms/conversation.pom.ts`) no tiene un método para localizar la card de offer y el botón de aceptar, agregar los métodos necesarios al POM existente. Actualmente tiene `timeline`, `messageByText()`, `expectTimelineContains()` pero no métodos de offer cards.
## Acceptance
- [ ] Existe `src/test/e2e/suites/offers/accept-paid-offer.spec.ts`.
- [ ] El archivo tiene test `offers.paid.creator_accept_captures_hold` (ESC-6).
- [ ] ESC-6: verifica card de offer `accepted` en timeline sin texto técnico.
- [ ] ESC-6: verifica que refrescar la página no duplica la aceptación.
- [ ] El archivo tiene test `offers.paid.creator_accept_capture_failed` (ESC-7).
- [ ] ESC-7: verifica que la offer permanece en `sent` tras el fallo.
- [ ] ESC-7: verifica UI de error visible para el creator.
- [ ] Ambos tests tienen `test.skip(!STRIPE_TEST_MODE_ENABLED, ...)` y timeout 180_000.
- [ ] La timeline no contiene "Stripe", "PaymentIntent", "hold", "capture" en ningún escenario.
- [ ] `pnpm typecheck` pasa sin errores.
- [ ] `pnpm quality-gates` verde.
## Done summary
Implemented fn-26-feat-027-e2e-paid-offer-charge-capture.5; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: