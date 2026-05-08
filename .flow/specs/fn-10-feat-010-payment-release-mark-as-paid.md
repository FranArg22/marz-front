# FEAT-010: Payment Release (mark as paid) — Frontend

## Overview

Cierre declarativo del ciclo de un `Deliverable`: el brand owner marca un deliverable `completed` como `paid` desde la conversación. La feature es 100% UI sobre contratos ya definidos en el backend (FEAT-010 backend, repo `marz-api`).

Alcance frontend (este epic):

- Regenerar cliente Orval con los 2 nuevos endpoints (`GET /payment-suggestion`, `POST /mark-as-paid`) + nuevos enums (`status='paid'`, `MessageEventType='PaymentMarked'`, analytics events).
- Renderer del system_event `PaymentMarked` en la timeline del chat (variantes saliente brand y entrante creator) reusando los organismos `Component/PaymentCard` y `Component/PaymentCard/Sent`.
- Sidesheet `Mark as paid` con pre-cálculo del sugerido server-side, override manual del monto, segunda confirmación, y mutation.
- Integración con `LinkApprovedCard` (FEAT-009) y `ContextPanel/DeliverableItem` para exponer la acción y el badge `Paid`.
- Update del label de `CurrentOfferBlock` a `Fully paid` / `Partially paid (N/M)`.
- Analytics UI-only (`payment_mark_opened`, `payment_mark_amount_overridden`, `payment_mark_cancelled`, `payment_card_seen`).
- Live-update vía WS: invalidar queries del context panel + messages al recibir `MessageSent` con `event_type='PaymentMarked'`.

Fuera de scope: backend (otra repo), Stripe, edición/cancelación de un payment marcado, email/push notifications.

Spec fuente: `marz-docs/features/FEAT-010-payment-release/03-solution.md` (secciones 4.1, 4.4, 7).

## Scope

**Modifica**:

- `src/features/deliverables/components/DeliverableStatusBadge.tsx` (FEAT-009) — branch `paid`.
- `src/features/chat/components/ContextPanel/DeliverableItem.tsx` (FEAT-009) — acción `Mark as paid` + badge.
- `src/features/chat/components/systemEvents/LinkApprovedCard.tsx` (FEAT-009) — botón secundario `Mark as paid`.
- `src/features/chat/components/CurrentOfferBlock.tsx` (FEAT-006) — label dinámico.
- `src/features/chat/components/systemEvents/index.ts` (factory) — registrar `PaymentMarkedCard`.
- `src/shared/ws/useWebSocket.ts` o handler equivalente — branch `event_type='PaymentMarked'` → invalidations.

**Crea**:

- `src/features/payments/markAsPaid/MarkAsPaidSidesheet.tsx`
- `src/features/payments/markAsPaid/MarkAsPaidConfirmDialog.tsx`
- `src/features/payments/markAsPaid/usePaymentAnalytics.ts`
- `src/features/chat/components/systemEvents/PaymentMarkedCard.tsx`
- Tests unitarios y E2E (Playwright) acompañando cada componente.

**Regenera** (no se commitea: `src/shared/api/generated/` está gitignored):

- Hooks `useGetDeliverablePaymentSuggestion`, `useMarkDeliverableAsPaid`.
- Schemas Zod y tipos: `PaymentSuggestionResponse`, `MarkAsPaidRequest/Response`, `DeclaredPayment`, enum `paid` y `PaymentMarked`.

## Approach

1. **Contrato primero**: `pnpm api:sync` contra el backend en dev. Si los endpoints no están aún expuestos, bloquear el resto (consistente con la regla de no committear `generated/`).
2. **Bottom-up por composición**: badge → renderer del system_event → sidesheet → integración en cards/panels. Cada paso entrega valor visible aislado.
3. **Reuso del language existente**:
   - System event renderer sigue el patrón de `LinkApprovedCard`/`DraftApprovedCard` ya en `src/features/chat/components/systemEvents/`.
   - Sidesheet sigue el patrón de `Sidesheet/SendOffer` (FEAT-005/006).
   - Mutator + auth/error handling ya viven en `src/shared/api/mutator.ts`.
4. **Sin estado global nuevo**: el sidesheet es estado local (`useState`); las invalidations TanStack Query bastan para sincronizar.
5. **Optimistic updates: NO** — la transición `completed → paid` es eventual (handler backend ~<100ms vía bus in-process). Mostrar spinner en `Confirm` hasta recibir el frame `MessageSent` y refetch.

## Quick commands

```bash
# Regenerar cliente API contra backend en dev
pnpm api:sync

# Type-check
pnpm typecheck

# Tests unitarios (Vitest)
pnpm test src/features/payments

# Tests E2E (Playwright) — requiere stack local
pnpm test:e2e tests/e2e/payments

# Smoke manual: brand owner abre conversación con deliverable completed
# → LinkApprovedCard muestra "Mark as paid" → sidesheet → confirm → ver PaymentCard saliente
```

## Acceptance

- **R1:** Brand owner ve la acción `Mark as paid` en `LinkApprovedCard` y en `ContextPanel/DeliverableItem` solo cuando `viewer.kind='brand'`, `viewer.role='owner'` y `deliverable.status='completed'`. Brand member, admin y creator no la ven.
- **R2:** Al abrir el sidesheet, el campo `amount` viene pre-completado con `suggested_amount` del endpoint, mostrando una nota textual derivada de `speed_bonus_reason` (los 5 valores del enum cubren copy distinto).
- **R3:** El botón `Confirm` está deshabilitado si `amount ≤ 0` o tiene > 2 decimales. Confirmar abre un dialog secundario "¿Confirmás que ya pagaste $X…?" antes de disparar la mutation.
- **R4:** Tras confirmar, la timeline muestra `PaymentCard` saliente para brand y entrante para el creator, con datos del snapshot del system_event. El badge `Paid` aparece en el `ContextPanel/DeliverableItem` y la acción `Mark as paid` desaparece.
- **R5:** `CurrentOfferBlock` muestra `Fully paid` cuando todos los deliverables del offer están en `paid`, `Partially paid (N/M)` cuando algunos, y el label habitual cuando ninguno.
- **R6:** Errores tipados del backend se surface en toast con copy del spec: `409 deliverable_not_completed` → "This deliverable is not ready to be marked as paid"; `409 deliverable_already_paid` → "This deliverable was already marked as paid"; `403 not_brand_owner` → "Only the workspace owner can mark payments". `422 invalid_amount` → mensaje inline en el campo.
- **R7:** Analytics UI dispara `payment_mark_opened` al abrir el sidesheet, `payment_mark_amount_overridden` cuando el user edita el amount, `payment_mark_cancelled` al cerrar sin confirmar (con step actual), y `payment_card_seen` la primera vez que un creator ve la card en viewport.
- **R8:** Al recibir un frame WS `MessageSent` con `event_type='PaymentMarked'` para la conversation actual, el cliente invalida `['deliverables', deliverableId]`, `['conversations', conversationId, 'messages']` y `['conversations', conversationId, 'context-panel']` sin refrescar la página.
- **R9:** Validación visual con Pencil MCP ≥95% match contra los nodos: `q3PPP`/`M5XU3` (PaymentCard saliente brand, light/dark), `8gs3F`/`N5HOp` (PaymentCard entrante creator, light/dark), `wpat3`/`7pW7u` (paneles de contexto con badge `Paid`). El sidesheet `Mark as paid` queda marcado como pendiente de revisión visual de diseño (spec lo flagea como `[PENDIENTE: pencil]`).

## Early proof point

La task `fn-10-feat-010-payment-release-mark-as-paid.1` (regen Orval + tipos) valida que el contrato del backend matchee lo que asume este plan: hooks, Zod schemas y enums regenerados sin errores TS y con shape consistente. Si falla — endpoints aún no expuestos en dev o shape divergente — pausar el frontend y volver a alinear con backend antes de seguir con `.2+`.

## Requirement coverage

| Req | Description                                           | Task(s)                                                                                                                                     | Gap justification                                         |
| --- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| R1  | Visibilidad de la acción según rol y status           | fn-10-feat-010-payment-release-mark-as-paid.5                                                                                               | —                                                         |
| R2  | Sidesheet con suggested + nota de bonus reason        | fn-10-feat-010-payment-release-mark-as-paid.4                                                                                               | —                                                         |
| R3  | Validación de amount + segunda confirmación           | fn-10-feat-010-payment-release-mark-as-paid.4                                                                                               | —                                                         |
| R4  | PaymentCard renderea + badge Paid + acción desaparece | fn-10-feat-010-payment-release-mark-as-paid.2, fn-10-feat-010-payment-release-mark-as-paid.3, fn-10-feat-010-payment-release-mark-as-paid.5 | —                                                         |
| R5  | CurrentOfferBlock label dinámico                      | fn-10-feat-010-payment-release-mark-as-paid.5                                                                                               | —                                                         |
| R6  | Surface de errores tipados                            | fn-10-feat-010-payment-release-mark-as-paid.4                                                                                               | —                                                         |
| R7  | Analytics UI eventos                                  | fn-10-feat-010-payment-release-mark-as-paid.4, fn-10-feat-010-payment-release-mark-as-paid.6                                                | —                                                         |
| R8  | WS-driven invalidations                               | fn-10-feat-010-payment-release-mark-as-paid.3, fn-10-feat-010-payment-release-mark-as-paid.5                                                | —                                                         |
| R9  | Validación visual Pencil ≥95%                         | fn-10-feat-010-payment-release-mark-as-paid.2, fn-10-feat-010-payment-release-mark-as-paid.3, fn-10-feat-010-payment-release-mark-as-paid.5 | Sidesheet pendiente de diseño Pencil — registrado en spec |

## References

- Spec: `marz-docs/features/FEAT-010-payment-release/03-solution.md` §§4, 5, 7.
- Diseño: `marz-design/marzv2.pen` nodos `q3PPP`, `M5XU3`, `8gs3F`, `N5HOp`, `RoLTd`, `74e7n`, `wpat3`, `7pW7u`.
- Predecesores: epic `fn-9-feat-009-link-submit-approve-frontend` (LinkApprovedCard, ContextPanel, DeliverableStatusBadge), `fn-6-feat-006-offer-bundle-multistage` (CurrentOfferBlock), `fn-5-feat-005-send-offer-single-offer` (Sidesheet/SendOffer pattern).
- API client: `src/shared/api/mutator.ts`, `src/shared/api/generated/`.
- WS handler: `src/shared/ws/useWebSocket.ts` (FEAT-004).
