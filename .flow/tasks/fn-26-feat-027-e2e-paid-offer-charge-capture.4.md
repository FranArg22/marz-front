# fn-26-feat-027-e2e-paid-offer-charge-capture.4 Extender send-paid-offer.spec.ts con ESC-4 y ESC-5 (SCA fallback: checkout redirect y cancel)

## Description
Extender `src/test/e2e/suites/offers/send-paid-offer.spec.ts` (creado en T3) con los tests de ESC-4 y ESC-5: flujo SCA con fallback a Stripe Checkout y cancelación del mismo.

**Prerequisito**: Task .3 completada.

### Contexto

Cuando el hold del lado off_session requiere autenticación adicional (SCA), el backend retorna `OfferSendRequiresAction` (status discriminado en la respuesta de `POST /v1/offers`). El frontend navega a la ruta `/checkout-return` con parámetros `offer_draft_id`, `return_to_kind`, `return_to_id` y redirige a un Stripe Checkout hosted.

La pantalla `/checkout-return` con `checkout=success` hace polling a `GET /v1/offers/draft-status/{offer_draft_id}` hasta que el draft queda en estado terminal (`sent`, `failed`, `expired`).

Para forzar este flujo en Stripe test mode, se usa la tarjeta `4000002500003155` (requires_action → 3D Secure).

### ESC-4: SCA redirect y retorno exitoso

```
test_id: offers.paid.sca_checkout_return_creates_sent_offer
```

Pasos:
1. Usar tarjeta `4000002500003155` como `default_offers_payment_method`.
2. Completar la offer y hacer click en submit.
3. Asertar que la UI muestra el estado de espera/redirect (puede ser el `checkout-return.waiting` testid o la URL cambia).
4. En el tab/popup de Stripe Checkout test, completar la autenticación 3DS (click en "Complete" o equivalente en Stripe test mode).
5. Verificar que la app navega de vuelta a la conversation con `send_offer_result=success`.
6. Verificar que la offer queda en estado `sent` en la timeline.
7. Verificar que no hay texto técnico ("Stripe", "PaymentIntent", etc.) en la timeline.

**Nota**: Si el flujo usa `page.waitForURL(/checkout\.stripe\.com/)` seguido de autenticación en el iframe Stripe, anotar el approach completo en el spec como comentario para el próximo desarrollador.

El test debe estar guardado con `test.skip(!STRIPE_TEST_MODE_ENABLED, ...)` y `test.setTimeout(180_000)`.

### ESC-5: Cancelación de Checkout no crea offer

```
test_id: offers.paid.sca_checkout_cancel_keeps_draft
```

Pasos:
1. Usar tarjeta `4000002500003155` como `default_offers_payment_method`.
2. Completar la offer y hacer click en submit.
3. En Stripe Checkout, hacer click en "Cancel" o "Back" (o navegar con page.goBack()).
4. Verificar que la app navega de vuelta con `send_offer_result=cancelled`.
5. Verificar que la timeline NO muestra una card de offer enviada.
6. Verificar que el sidesheet puede reabrirse para reintentar.

El test debe estar guardado con `test.skip(!STRIPE_TEST_MODE_ENABLED, ...)` y `test.setTimeout(180_000)`.

### Reglas

- NO agregar tests nuevos al describe block raíz; agregarlos al bloque existente en `send-paid-offer.spec.ts`.
- NO mockear Stripe en el browser.
- Si el Stripe Checkout 3DS test UI difiere del esperado, documentar el selector real usado como comentario en el spec.
## Acceptance
- [ ] `send-paid-offer.spec.ts` tiene test `offers.paid.sca_checkout_return_creates_sent_offer` (ESC-4).
- [ ] ESC-4: verifica navegación a Stripe Checkout y retorno con `send_offer_result=success`.
- [ ] ESC-4: verifica offer en `sent` en la timeline sin texto técnico.
- [ ] `send-paid-offer.spec.ts` tiene test `offers.paid.sca_checkout_cancel_keeps_draft` (ESC-5).
- [ ] ESC-5: verifica retorno con `send_offer_result=cancelled` sin offer en timeline.
- [ ] ESC-4 y ESC-5 tienen `test.skip(!STRIPE_TEST_MODE_ENABLED, ...)` y timeout 180_000.
- [ ] `pnpm typecheck` pasa sin errores.
- [ ] `pnpm quality-gates` verde.
## Done summary
Implemented fn-26-feat-027-e2e-paid-offer-charge-capture.4; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: