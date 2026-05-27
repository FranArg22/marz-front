# fn-25-feat-027-paid-offer-charge-capture.1 Commit tipos OpenAPI generados + verificar typecheck

## Description

El `pnpm api:sync` ya fue ejecutado contra el backend dev (http://localhost:45985). Hay archivos nuevos y modificados en `src/shared/api/generated/` que reflejan el contrato FEAT-027. Esta task los verifica y los commitea.

## Archivos generados/modificados (no tocar a mano)

**Nuevos (untracked):**
- `src/shared/api/generated/model/acceptOffer402.ts` — tipo de error para POST accept 402
- `src/shared/api/generated/model/offerAcceptError.ts` — `{ code: OfferAcceptErrorCode, stripe_code?: string | null }`
- `src/shared/api/generated/model/offerAcceptErrorCode.ts` — enum: `hold_expired | card_declined | capture_failed_generic`
- `src/shared/api/generated/model/offerDraftStatus.ts` — response de GET draft-status
- `src/shared/api/generated/model/offerDraftStatusStatus.ts` — enum: `pending | requires_capture | requires_action | sent | failed | canceled`
- `src/shared/api/generated/model/offerSendError.ts` — `{ code: OfferSendErrorCode, stripe_code?: string | null }`
- `src/shared/api/generated/model/offerSendErrorCode.ts` — enum: `card_declined | insufficient_funds | expired_card | incorrect_cvc | hold_failed_generic`
- `src/shared/api/generated/model/offerSendRejected.ts` — `{ status: 'rejected', error: OfferSendError }`
- `src/shared/api/generated/model/offerSendRejectedStatus.ts`
- `src/shared/api/generated/model/offerSendRequiresAction.ts` — `{ status: 'requires_action', offer_draft_id: string, checkout_url: string }`
- `src/shared/api/generated/model/offerSendRequiresActionStatus.ts`
- `src/shared/api/generated/model/offerSendReturnTo.ts` — `{ kind: OfferSendReturnToKind, id?: string }`
- `src/shared/api/generated/model/offerSendReturnToKind.ts` — enum: `conversation | inbox`
- `src/shared/api/generated/model/offerSendSent.ts` — `{ status: 'sent', offer: OfferDTO }`
- `src/shared/api/generated/model/offerSendSentStatus.ts`
- `src/shared/api/generated/model/receivePaymentsStripeWebhookBody.ts` — server-only, no se consume en front

**Modificados:**
- `src/shared/api/generated/model/createOfferRequest.ts` — agrega `offer_draft_id?: string`, `return_to?: OfferSendReturnTo`
- `src/shared/api/generated/model/index.ts` — re-exporta los nuevos tipos
- `src/shared/api/generated/offers/offers.ts` — `createOffer` response 201 es ahora `OfferSendSent | OfferSendRequiresAction | OfferSendRejected`; agrega `useGetOfferDraftStatus`; `useAcceptOffer` tiene `TError = Error | AcceptOffer402`
- `src/shared/api/generated/payments/payments.ts` — agrega `receivePaymentsStripeWebhook` (server-only)
- `src/shared/api/generated/zod/offers/offers.ts` — schemas Zod actualizados
- `src/shared/api/generated/zod/payments/payments.ts` — schemas Zod actualizados
- `openapi/spec.json` — spec actualizado

## Pasos

1. Correr `pnpm typecheck`. Si hay errores en código existente fuera de `src/shared/api/generated/` causados por el cambio de tipo de `createOffer` response (pasa de `OfferDetailDTO` a `OfferSendSent | OfferSendRequiresAction | OfferSendRejected`), documentar el archivo y línea en la sección "Breaks pendientes de F.4" de este task spec y **no arreglarlos aquí** — F.4 los resuelve.
2. No modificar ningún archivo en `src/shared/api/generated/**` a mano.
3. Stage y commit de todos los archivos generados: `openapi/spec.json`, todo el diff de `src/shared/api/generated/`. Mensaje: `feat(api): regenerar cliente Orval FEAT-027 — discriminated response createOffer, draft-status, accept 402`.

## Breaks pendientes de F.4

_(completar si `pnpm typecheck` falla en archivos de features)_

## Acceptance

- `pnpm typecheck` corre. Si falla, solo falla en archivos de features que usan `createOffer` (documentados arriba), no en archivos de `generated/`.
- Los archivos generados están trackeados por git (sin untracked en `src/shared/api/generated/` ni en `openapi/spec.json`).
- Cero ediciones manuales a `src/shared/api/generated/**` (verificable por diff — ningún archivo tiene autor distinto al bot de orval).
- Verify: `git status --short src/shared/api/generated/ openapi/spec.json && pnpm typecheck 2>&1 | grep -E "error TS|Found [0-9]+ error" | head -10`

## Done summary

## Evidence
- Commits:
- Tests:
- PRs:
