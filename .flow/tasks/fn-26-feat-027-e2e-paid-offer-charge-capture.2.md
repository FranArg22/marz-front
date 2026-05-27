# fn-26-feat-027-e2e-paid-offer-charge-capture.2 Investigar setup STRIPE_TEST_MODE para brand con offers_payment_method y aclarar si se necesitan endpoints de test adicionales

## Description
Antes de escribir los specs E2E de FEAT-027, es necesario entender cómo hacer el setup de una brand con plan pago y `offers_payment_method` configurado. El test API (`/v1/test/*`) no expone ningún endpoint para seedear este estado directamente.

### Preguntas a responder

**P1**: Cuando una brand completa el checkout de suscripción en `STRIPE_TEST_MODE=1` (flujo idéntico a `billing-page.spec.ts`), ¿el backend setea automáticamente `offers_payment_method` igual al `subscription_payment_method`? Es decir, ¿`same_payment_method` queda `true` después del checkout?

- Si SÍ: las tasks T3 y T5 pueden reusar el mismo setup de `billing-page.spec.ts` (onboarding brand → Stripe checkout → `visa •••• 4242` como método de offers).
- Si NO: hay que pedir al backend que exponga un endpoint de fixture o explicar qué pasos adicionales hace la brand para configurar el método de offers.

**P2**: ¿Existe algún endpoint o flujo de test para crear una offer en estado `sent` con PaymentIntent `requires_capture` sin pasar por el sidesheet completo? (Necesario para ESC-6 y ESC-7, donde el creator acepta una offer ya enviada.)

- Si NO existe: las tasks T5 (ESC-6/7) deben primero hacer que el brand envíe la offer como parte del setup del test, y luego cambiar al contexto del creator para aceptarla.

**P3**: Para simular un hold rechazado (ESC-3), ¿el endpoint `POST /v1/test/faults` puede inyectar un fallo en la creación de PaymentIntent? ¿O se debe usar una tarjeta Stripe específica que decline?

- Verificar el schema de `CreateTestFaultRequest` en `src/shared/api/test-generated/model/createTestFaultRequest.ts`. La interfaz tiene campos `method` (string), `path` (string), `status` (number 100-599), `body` (object) y `count`. Documentar si se puede usar para inyectar un fallo en `POST /v1/offers` que simule `card_declined` o `insufficient_funds`.

**P4**: El repo ya tiene un fixture `chatPairOfferReady` en `src/test/e2e/support/fixtures.ts` (línea ~118) que crea un par brand+creator con campaign y application aceptada vía la opción `seedOfferReady` de `createChatPair()`. Verificar si este fixture es el punto de partida correcto para los tests de FEAT-027, y documentar qué pasos adicionales (billing checkout, Stripe payment method) se necesitan encima de `chatPairOfferReady` para tener una brand con plan pago lista para enviar paid offers.

### Artefactos a producir

Al terminar la investigación, actualizar el Done summary con las respuestas concretas. Las tasks T3 y T5 dependen de estas respuestas para saber el setup exacto a usar.

Si alguna pregunta requiere input del backend team, setear la task como bloqueada con `flowctl block` y describir qué información falta.
## Acceptance
- [ ] Se documenta si `same_payment_method=true` queda seteado automáticamente tras el checkout de suscripción (STRIPE_TEST_MODE=1).
- [ ] Se documenta si existe un endpoint o flujo para crear una offer `sent` con hold activo sin pasar por el sidesheet.
- [ ] Se verifica y documenta el schema de `CreateTestFaultRequest` y si soporta faults para hold/PaymentIntent.
- [ ] Se evalúa `chatPairOfferReady` como fixture base y se documenta el setup adicional necesario para paid offers.
- [ ] El Done summary contiene las respuestas a P1, P2, P3 y P4 con el approach elegido para T3 y T5.
- [ ] Si se necesita un nuevo endpoint de backend, la task queda bloqueada con razón y desbloqueo claros.
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs: