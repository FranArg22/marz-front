# FEAT-027: Paid offer charge & capture — Frontend

## Goal

Implementar en el frontend el ciclo completo de charge & capture para offers paid contra Stripe.

El brand envía una offer paid desde el sidesheet: el backend crea un PaymentIntent hold y devuelve una respuesta discriminada (`sent` / `requires_action` / `rejected`). Si es `sent`, el sidesheet cierra y muestra toast. Si es `requires_action` (SCA), el browser redirige a Stripe Checkout hosted; al volver, `/checkout-return` polea `GET /v1/offers/draft-status/:id` y navega al destino original con un query param `?send_offer_result`. Si es `rejected`, el sidesheet muestra un banner de error tipado.

El creator acepta la offer con el botón existente; en offer paid, el backend captura el hold síncronamente. Si el capture falla (402), se muestra un toast tipado según `error.code`.

## Scope (in)

- Commit del diff de `pnpm api:sync` ya ejecutado (nuevos tipos: `OfferSendSent`, `OfferSendRequiresAction`, `OfferSendRejected`, `OfferDraftStatus`, `OfferAcceptError`, `AcceptOffer402`, `OfferSendErrorCode`, `OfferAcceptErrorCode`, `OfferSendReturnTo`, etc.).
- Componente `OfferSummaryBlock` en `src/features/offers/components/`: monto base + bonuses + max + leyenda cobro.
- Componente `OfferSendErrorBanner` en `src/features/offers/components/`: mapea `error.code` → copy Lingui + CTA portal Stripe.
- Extensión de `SendOfferSidesheet`: genera `offer_draft_id` al montar, construye `return_to`, ramifica por `response.status`.
- Hook `useDraftStatus` en `src/features/payments/hooks/` (polling 2s, timeout 30s, para en terminal).
- Ruta nueva `/_brand/checkout-return` con `CheckoutReturnPage` que usa `useDraftStatus` y navega al destino.
- Extensión de `useOfferActions` en `src/features/offers/hooks/`: maneja 402 `AcceptOffer402` con toast tipado según `error.code`.
- Extensión de rutas `/inbox` y `/workspace/conversations/$conversationId`: leen `?send_offer_result`, muestran toast y limpian el param.
- i18n strings Lingui (es-AR + en-US) para todas las strings nuevas.

## Scope (out)

- Implementación backend (ya completa en `marz-api`).
- Stripe.js / Payment Element embebido (RD1 del solution: se usa Checkout hosted para SCA).
- Persistencia del draft del sidesheet en Zustand entre redirects (RD4: se acepta perder el form).
- Cambios en `_creator/` más allá del manejo de errores 402 en accept.

## Acceptance criteria

- [ ] `pnpm typecheck` pasa con todos los nuevos tipos generados integrados (sin `@ts-ignore`).
- [ ] `SendOfferSidesheet` genera un `offer_draft_id` (UUIDv4) al montar, lo incluye en el request, y construye `return_to` según contexto (conversation → `{kind:'conversation', id}` / inbox → `{kind:'inbox'}`).
- [ ] Response `status='sent'` cierra el sidesheet y muestra toast "Offer enviada".
- [ ] Response `status='requires_action'` hace `window.location.href = checkout_url` (redirect a Stripe Checkout).
- [ ] Response `status='rejected'` mantiene el sidesheet abierto y renderiza `OfferSendErrorBanner` con `error`.
- [ ] `OfferSendErrorBanner` muestra copy Lingui distinto para `card_declined`, `insufficient_funds`, `expired_card`, `incorrect_cvc`; fallback genérico para `hold_failed_generic`.
- [ ] `OfferSendErrorBanner` tiene CTA "Gestionar tarjeta en Stripe" que invoca `useCreatePortalSession`.
- [ ] `OfferSummaryBlock` muestra monto base + bonus + max; leyenda "El cobro se realiza cuando el creator acepta" solo si `plan != free`.
- [ ] Ruta `/_brand/checkout-return` polea `useDraftStatus` cada 2s hasta 30s; navega a `return_to` con `?send_offer_result=success|cancelled|failed`.
- [ ] Timeout 30s en `CheckoutReturnPage` muestra mensaje de error + CTA reintentar.
- [ ] `useOfferActions` maneja 402 `AcceptOffer402`: `hold_expired` → toast "Los fondos reservados expiraron"; `card_declined` → toast "El brand necesita actualizar tarjeta"; `capture_failed_generic` → toast "No se pudo procesar el pago".
- [ ] Rutas inbox y conversation leen `?send_offer_result`, muestran toast correspondiente y limpian el param via `navigate(..., { replace: true })`.
- [ ] Cero strings hardcoded user-facing (todo por Lingui).
- [ ] `pnpm work:post` pasa (lint + typecheck + react-doctor + vitest + e2e + knip + check:api-direct + check:i18n-standards).

## Risks

- **Tipos generados con cambios breaking en `createOffer` response**: el nuevo response 201 es `OfferSendSent | OfferSendRequiresAction | OfferSendRejected` (discriminated union por `status`). El código existente en `useCreateOfferMutation` que asume `OfferDetailDTO` directamente va a fallar en typecheck. La tarea F.1 debe detectar estos breaks y F.4 los arregla.
- **`window.location.href` para redirect a Stripe**: intencional para salir del SPA, pero en tests debe mockearse `window.location` o la asignación tira. Patrón: wrappear en util testeable.
- **Polling con refetchInterval en `useDraftStatus`**: hay que limpiar el interval cuando el status es terminal o cuando el componente desmonta. Si no, React Query puede hacer fetches innecesarios.
- **`return_to` en query params de la URL de checkout**: el `success_url`/`cancel_url` de Stripe los construye el backend, pero `return_to` tiene que viajar en ellos para que `CheckoutReturnPage` sepa a dónde navegar. Verificar que los params vienen en la URL de retorno.

## Quick commands

- `pnpm typecheck` — verifica tipado global
- `pnpm vitest run src/features/offers` — tests unitarios de offers
- `pnpm vitest run src/features/payments` — tests unitarios de payments
- `pnpm work:post` — quality gates completos

## References

- Spec backend: `.flow/specs/fn-25-feat-027-paid-offer-charge-capture.md` (este archivo)
- Tipos generados: `src/shared/api/generated/model/offerSend*.ts`, `offerAccept*.ts`, `offerDraftStatus*.ts`
- Hook generado draft-status: `src/shared/api/generated/offers/offers.ts` → `useGetOfferDraftStatus`
- Hook accept con 402: `src/shared/api/generated/offers/offers.ts` → `useAcceptOffer` (TError incluye `AcceptOffer402`)
- Patrón BillingCallbackPage (polling): `src/routes/onboarding/brand.billing-callback.tsx`
- Patrón useCreatePortalSession: `src/features/billing/hooks/useCreatePortalSession.ts`
