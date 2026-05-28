# fn-26-feat-027-e2e-paid-offer-charge-capture FEAT-027 E2E: paid offer charge & capture

## Overview

Agrega cobertura E2E Playwright para los flujos de FEAT-027: resumen económico antes de enviar una offer paid, autorización del hold al enviar, fallback SCA vía Stripe Checkout, captura sincrónica al aceptar, y ausencia de eventos técnicos de pagos en la timeline.

Los tests viven en `src/test/e2e/suites/offers/` (nuevo directorio). Los que requieren Stripe test mode se guardan con `test.skip(!STRIPE_TEST_MODE_ENABLED, ...)` igual que `billing-page.spec.ts`.

El test API (`/v1/test/*`) no expone endpoints para seedear brand con plan pago ni offers en estado `sent` con hold activo. La task T2 investiga si el flujo STRIPE_TEST_MODE de suscripción también configura `offers_payment_method`, o si el backend necesita exponer endpoints de fixtures adicionales.

## Scope

**Incluye**:
- `data-testid` en `OfferSummaryBlock`, `OfferSendErrorBanner`, botón de envío en `SendOfferSidesheet`, estados de `CheckoutReturnPage`
- Spec `src/test/e2e/suites/offers/send-paid-offer.spec.ts` (ESC-1, ESC-2, ESC-3)
- Extensión con ESC-4 + ESC-5 (SCA flow) en el mismo spec
- Spec `src/test/e2e/suites/offers/accept-paid-offer.spec.ts` (ESC-6, ESC-7)

**Fuera de scope**:
- Mocks de respuestas Stripe en el browser
- Cambios al contrato de la API

## Escenarios cubiertos

| ESC | Flow | Prioridad |
|-----|------|-----------|
| ESC-1 | Brand ve resumen económico antes de enviar | alta |
| ESC-2 | Envío crea hold y offer en `sent` | alta |
| ESC-3 | Rechazo de hold mantiene sidesheet abierto | alta |
| ESC-4 | SCA redirige a Checkout y completa el envío | alta |
| ESC-5 | Cancelación de Checkout no crea offer | media |
| ESC-6 | Creator acepta offer paid, capture exitoso | alta |
| ESC-7 | Fallo de capture mantiene offer en `sent` | alta |

## Quick commands

- `pnpm typecheck`
- `STRIPE_TEST_MODE=1 pnpm test:e2e -- --grep "paid offer"`
- `pnpm test:e2e -- --grep "offers.paid" --project=chromium`

## Acceptance

- [ ] `data-testid="offers.send.summary_block"` existe en `OfferSummaryBlock`
- [ ] `data-testid="offers.send.error_banner"` existe en `OfferSendErrorBanner`
- [ ] `data-testid="offers.send.submit_button"` existe en el botón de envío de `SendOfferSidesheet`
- [ ] `data-testid="checkout-return.waiting"` en estado de espera de `CheckoutReturnPage`
- [ ] `data-testid="checkout-return.timeout_error"` en estado de timeout de `CheckoutReturnPage`
- [ ] `src/test/e2e/suites/offers/send-paid-offer.spec.ts` cubre ESC-1, ESC-2, ESC-3, ESC-4, ESC-5
- [ ] `src/test/e2e/suites/offers/accept-paid-offer.spec.ts` cubre ESC-6, ESC-7
- [ ] Todos los tests con Stripe usan `test.skip(!STRIPE_TEST_MODE_ENABLED, ...)`
- [ ] La timeline no contiene texto técnico `Stripe`, `PaymentIntent`, `hold`, `capture`
- [ ] `pnpm typecheck` pasa
- [ ] `pnpm quality-gates` verde

## References

- Componente: `src/features/offers/components/SendOfferSidesheet.tsx`
- Componente: `src/features/offers/components/OfferSummaryBlock.tsx`
- Componente: `src/features/offers/components/OfferSendErrorBanner.tsx`
- Ruta: `src/routes/_brand/checkout-return.tsx`
- POM: `src/test/e2e/poms/conversation.pom.ts`
- Support: `src/test/e2e/support/fixtures.ts`, `src/test/e2e/support/chat-pair.ts`
- Spec de referencia: `src/test/e2e/suites/billing/billing-page.spec.ts`
