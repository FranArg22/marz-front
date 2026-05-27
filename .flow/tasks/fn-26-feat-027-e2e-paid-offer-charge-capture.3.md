# fn-26-feat-027-e2e-paid-offer-charge-capture.3 Crear send-paid-offer.spec.ts — ESC-1, ESC-2, ESC-3 (brand envia offer paid: resumen, hold exitoso, hold rechazado)

## Description
Crear el archivo `src/test/e2e/suites/offers/send-paid-offer.spec.ts` con los tests E2E para ESC-1, ESC-2 y ESC-3.

**Prerequisitos**: Task .1 completada (data-testids en componentes) y Task .2 completada (approach de setup confirmado).

### Setup de fixture (basado en el approach definido en T2)

El repo ya tiene un fixture `chatPairOfferReady` en `src/test/e2e/support/fixtures.ts` (línea ~118) que crea un par brand+creator con campaign y application aceptada, listo para enviar offers. Usar este fixture como punto de partida: proporciona `brandPage`, `creatorPage`, `conversationId` y los usuarios onboardeados.

Encima de `chatPairOfferReady`, agregar el setup de billing para obtener un brand con plan pago y `offers_payment_method`. El patrón sigue a `src/test/e2e/suites/billing/billing-page.spec.ts`:

1. Usar `chatPairOfferReady` para crear brand+creator con conversation activa y campaign ready.
2. Si T2 confirma que STRIPE_TEST_MODE=1 es suficiente: navegar con `brandPage` a `/onboarding/brand/paywall`, seleccionar plan Starter mensual, completar Stripe checkout con tarjeta `4242 4242 4242 4242`.
3. Verificar que `GET /v1/billing` retorna `offers_payment_method` con la tarjeta seteada (o `same_payment_method=true`).
4. Navegar a la conversation para abrir el sidesheet.

Si T2 determinó un approach diferente (endpoint de fixture, etc.), usar ese approach.

### ESC-1: Brand ve resumen económico antes de enviar

```
test_id: offers.paid.send_summary_displays_base_amount_and_bonus
```

Pasos:
1. Abrir sidesheet de send offer como brand admin con plan pago.
2. Completar amount y speed bonus.
3. Asertar que `page.getByTestId('offers.send.summary_block')` es visible.
4. Asertar que el bloque contiene el monto base, el monto del speed bonus, y texto que indica que el cobro se realiza cuando el creator acepta.
5. Verificar que el bloque NO contiene texto "processing fee", "Stripe" ni desglose de comisiones.

Este test requiere una brand con plan pago (setup Stripe), por lo tanto debe incluir `test.skip(!STRIPE_TEST_MODE_ENABLED, ...)`.

### ESC-2: Envío crea hold y offer en `sent`

```
test_id: offers.paid.send_creates_hold_and_sent_offer
```

Pasos:
1. Completar la offer y hacer click en el botón `data-testid="offers.send.submit_button"`.
2. Esperar que el sidesheet se cierre (indicador de éxito).
3. Verificar que la timeline muestra la card de offer enviada (usar `ConversationPage.timeline` POM existente).
4. Verificar que la timeline NO contiene texto "Stripe", "PaymentIntent", "hold" o "capture".

El test debe estar guardado con `test.skip(!STRIPE_TEST_MODE_ENABLED, ...)`.

### ESC-3: Hold rechazado mantiene sidesheet con la info cargada

```
test_id: offers.paid.send_hold_declined_keeps_draft
```

Mecanismo de rechazo: usar el approach definido en T2 (tarjeta específica de Stripe o `createTestFault`). El setup puede cambiar el método de pago a una tarjeta que decline para holds, o inyectar un fault antes del envío.

Pasos:
1. Completar la offer y hacer click en submit.
2. Esperar el error.
3. Asertar que `page.getByTestId('offers.send.error_banner')` es visible.
4. Asertar que el sidesheet sigue abierto con los valores cargados.
5. Asertar que la timeline NO tiene una card de offer enviada.

El test debe estar guardado con `test.skip(!STRIPE_TEST_MODE_ENABLED, ...)`.

### Estructura del archivo

```ts
import { expect, test } from '../../support/fixtures'
// imports adicionales según T2

const STRIPE_TEST_MODE_ENABLED = process.env.STRIPE_TEST_MODE === '1'

test.describe('Offers: paid offer send flow', () => {
  // shared setup usando chatPairOfferReady + billing

  test('offers.paid.send_summary_displays_base_amount_and_bonus', async ({ ... }) => {
    test.skip(!STRIPE_TEST_MODE_ENABLED, 'Requires backend with STRIPE_TEST_MODE=1')
    test.setTimeout(180_000)
    // ESC-1
  })

  test('offers.paid.send_creates_hold_and_sent_offer', async ({ ... }) => {
    test.skip(!STRIPE_TEST_MODE_ENABLED, 'Requires backend with STRIPE_TEST_MODE=1')
    test.setTimeout(180_000)
    // ESC-2
  })

  test('offers.paid.send_hold_declined_keeps_draft', async ({ ... }) => {
    test.skip(!STRIPE_TEST_MODE_ENABLED, 'Requires backend with STRIPE_TEST_MODE=1')
    test.setTimeout(180_000)
    // ESC-3
  })
})
```

### Reglas

- NO mockear respuestas de Stripe ni de la API del backend en el browser.
- El setup de fixture reutiliza `chatPairOfferReady` de `src/test/e2e/support/fixtures.ts` y helpers existentes de `src/test/e2e/support/`.
- Si falta un helper o fixture de support, crearlo en `src/test/e2e/support/` (no en el spec).
- El POM `ConversationPage` (`src/test/e2e/poms/conversation.pom.ts`) puede extenderse si hacen falta métodos de offers (actualmente tiene `timeline`, `messageByText()`, `expectTimelineContains()` pero no métodos específicos de offer cards).
## Acceptance
- [ ] Existe `src/test/e2e/suites/offers/send-paid-offer.spec.ts`.
- [ ] El archivo tiene test `offers.paid.send_summary_displays_base_amount_and_bonus` (ESC-1).
- [ ] ESC-1: aserta `getByTestId('offers.send.summary_block')` visible con monto base y speed bonus.
- [ ] ESC-1: verifica ausencia de "processing fee", "Stripe" y desglose de comisiones en el bloque.
- [ ] El archivo tiene test `offers.paid.send_creates_hold_and_sent_offer` (ESC-2).
- [ ] ESC-2: usa `getByTestId('offers.send.submit_button')` para enviar.
- [ ] ESC-2: verifica card de offer en timeline vía `ConversationPage.timeline`.
- [ ] ESC-2: verifica ausencia de "Stripe", "PaymentIntent", "hold", "capture" en timeline.
- [ ] El archivo tiene test `offers.paid.send_hold_declined_keeps_draft` (ESC-3).
- [ ] ESC-3: aserta `getByTestId('offers.send.error_banner')` visible.
- [ ] ESC-3: aserta sidesheet sigue abierto con valores cargados.
- [ ] Los tres tests (ESC-1, ESC-2 y ESC-3) tienen `test.skip(!STRIPE_TEST_MODE_ENABLED, ...)`.
- [ ] `pnpm typecheck` pasa sin errores.
- [ ] `pnpm quality-gates` verde.
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs: