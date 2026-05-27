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
P1: Si. En el backend de este ambiente, el webhook de billing sincroniza el default PM de Stripe en ambas columnas. `internal/billing/app/project_subscription.go` llama `syncDefaultPaymentMethod(...)` con `sub.DefaultPaymentMethod`; esa funcion llama `UpdateDefaultPaymentMethodsByStripeCustomer(...)`. En `internal/billing/adapters/db/webhook_uow.go`, el update escribe en una sola sentencia:

- `default_subscription_payment_method = $2`
- `default_offers_payment_method = $2`

Por lo tanto, despues del checkout de suscripcion en `STRIPE_TEST_MODE=1`, si Stripe devuelve `default_payment_method`, `GET /v1/billing/subscription` queda con `subscription_payment_method` y `offers_payment_method` apuntando al mismo PM, y `same_payment_method=true`. Para T3/T5, el setup puede reusar el flujo de `billing-page.spec.ts`: brand onboarding/paywall -> checkout Stripe con `4242 4242 4242 4242` -> `visa •••• 4242` queda disponible como metodo de offers.

P2: No existe endpoint de test para crear directamente una offer `sent` con PaymentIntent en `requires_capture`. El contrato `openapi/test-spec.json` solo expone `/v1/test/accounts`, `/v1/test/conversations`, campaign/participant/video fixtures, inbox fixtures, event emit y `/v1/test/faults`. `seed_offer_ready` en `CreateTestConversationRequest` solo deja el par `(campaign_id, conversation_id)` listo para un `POST /v1/offers`; no crea la offer ni el hold. Para T5 ESC-6/ESC-7, el setup debe hacer que la brand envie la offer por el flujo real/API real y luego cambiar al contexto creator para aceptarla.

P3: `CreateTestFaultRequest` esta generado con `{ method: string, path: string, status: number 100-599, body: object, count: 1 }`. El backend implementa esto como middleware one-shot por metodo/path (`internal/shared/httpx/test_faults.go`), antes del handler real. Se puede registrar un fault para `POST /v1/offers` y devolver un body que simule la respuesta esperada, por ejemplo `status=201` con `{ "status": "rejected", "error": { "code": "card_declined", "stripe_code": "card_declined" } }` o `insufficient_funds`. Eso sirve para testear el manejo FE de ESC-3 sin tocar Stripe. No inyecta un fallo interno en `CreatePaymentIntentHold`: al matchear `POST /v1/offers`, el handler real no corre y no se crea PaymentIntent. Si se quiere validar integracion Stripe end-to-end del hold rechazado, usar tarjeta Stripe de decline como default offers PM.

P4: `chatPairOfferReady` es el fixture base correcto para FEAT-027. Crea brand+creator onboardeados, conversation, campaign activa y application aceptada usando `seedOfferReady`, y devuelve `brandPage`, `creatorPage`, `conversationId`, `brandWorkspaceId` y `campaignId`. Encima de ese fixture falta completar billing para la brand: navegar con `brandPage` a `/onboarding/brand/paywall`, elegir plan pago, completar Stripe checkout en `STRIPE_TEST_MODE=1`, y verificar `/billing` o `GET /v1/billing/subscription` con `same_payment_method=true`/`offers_payment_method` presente antes de enviar paid offers.

Approach elegido para T3: usar `chatPairOfferReady` + checkout real Stripe 4242 + envio de offer por sidesheet/API real, con `test.skip(!STRIPE_TEST_MODE_ENABLED, ...)`.

Approach elegido para T5: usar el mismo setup; para ESC-6/ESC-7 no hay seed directo de offer sent con hold activo, asi que primero la brand debe enviar la offer y despues el test cambia al creator para aceptar. Para fallos simulados de FE se puede usar `/v1/test/faults`; para cobertura Stripe real usar tarjetas Stripe especificas.
## Evidence
- Commits:
- Tests: Intentado: STRIPE_TEST_MODE=1 pnpm test:e2e -- src/test/e2e/suites/billing/billing-page.spec.ts --workers=1; no llego a Stripe por timeout en selector Mensual/Monthly antes del checkout
- PRs: