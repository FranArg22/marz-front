---
satisfies: [R5, R6, R7]
---

## Description

Wirear los CTAs accept/decline en el overlay (.4) y en cards cuando aplique. Manejo de idempotency, optimistic disabling, conflict 409 (expired/terminal), invalidate, navegación a chat post-accept.

**Size:** M
**Files:**

- (extender) `InvitationDetailDialog.tsx` — botones accept/decline con loading + disabled states
- (extender) `InvitationCard.tsx` — botones accept/decline inline cuando `actions.accept|decline=true`
- `src/features/discovery/creator-invitations/useInvitationActions.ts` — hook helper que combina mutations + idempotency cache + toast + navegación
- `src/features/discovery/creator-invitations/__tests__/useInvitationActions.test.tsx`
- `src/features/discovery/creator-invitations/__tests__/accept-flow.e2e.spec.ts` (o donde corra E2E)

## Approach

- Hook `useInvitationActions(invite)` retorna `{ accept, decline, isAccepting, isDeclining, openChat }`.
- Click en accept/decline:
  1. Generar `Idempotency-Key` (uuid v4) y cachearlo asociado al `invite_id` + acción hasta que la mutation termine. Re-click usa la key cacheada.
  2. Disable ambos botones mientras `isPending`.
  3. En éxito: invalidate `['creator-invitations']`, toast success. Para accept: ofrecer "Abrir chat" → navega `/workspace/conversations/$conversationId` usando el `conversation_id` del response. La navegación NO es automática — el creator decide (per UX de la spec).
  4. En 409 expired/terminal: toast con copy adecuado, refetch detail (server tiene la verdad), modo del overlay pasa a `historical`. NO permitir reintento.
  5. En 409 idempotency_key_mismatch (replay con body distinto): caso defensivo, toast genérico + refetch.
  6. En error de red / 500: toast retry-able, key cacheada se mantiene 30s para permitir reintento manual seguro.
- Open chat CTA: aparece en card y detail cuando `actions.open_chat=true` (status accepted con `conversation_id`); navega vía TanStack Router.

## Investigation targets

**Required:**

- `src/features/discovery/creator-invitations/mutations.ts` — hooks de .1
- `src/features/discovery/creator-invitations/idempotency.ts` — key cache de .1
- `marz-docs/features/FEAT-015-creator-invitations-and-offer-detail/03-solution.md` §4.1 — error codes accept/decline
- `src/routes/_creator/workspace/` (o equivalente) — confirmar route existente `/workspace/conversations/$conversationId` antes de navegar
- `src/components/ui/toast.tsx` o sonner config — patrón de toasts existente

**Optional:**

- Cualquier feature que ya use mutation + invalidate + nav (ej. `offers/`)

## Design context

Botón accept primary (token `--primary`, redondeado), decline secondary/outline. Loading state usa spinner pequeño dentro del botón con texto. Toasts usan los tokens de feedback existentes (success/error/warning).

Full design system: `marz-design/marzv2.pen`.

## Key context

- **Crítico**: una conversation se garantiza con unique constraint `(brand_workspace_id, creator_account_id)` en backend. El front no debe asumir que `reused=false` significa "nueva siempre" — sólo refleja lo que pasó server-side.
- Idempotency key per click cacheada — sin esto, reintentos automáticos del cliente HTTP pueden crear keys distintas y disparar 2 decisiones aceptadas en server (rompe spec R7).
- 409 expired puede ocurrir en cualquier momento — el cron de 1 min corre constantemente. UI debe ser robusta a "el botón estaba habilitado pero al click ya expiró".

## Acceptance

- [ ] Accept exitoso: card pasa a `Aceptada`, detail muestra modo `historical`, toast con CTA "Abrir chat". Click en CTA navega a `/workspace/conversations/$conversationId`.
- [ ] Decline exitoso: card pasa a `Rechazada`, detail modo `historical`, no se ofrece chat ni navegación.
- [ ] Double-click rapidísimo en accept: un único request observable con la misma `Idempotency-Key` (test con mock que cuenta llamadas a network layer).
- [ ] Click en accept y al instante en decline: el segundo se ignora mientras el primero está pending (botones disabled).
- [ ] 409 `invitation_expired` muestra toast "Esta invitación expiró" y actualiza UI a `historical`. Botones no permiten reintento.
- [ ] 409 `invitation_not_actionable` con `current_status` muestra el estado real y sincroniza UI.
- [ ] Open chat CTA aparece en card y detail solo cuando `actions.open_chat=true`.
- [ ] E2E: aceptar invite → estado Aceptada + nav opcional a chat; declinar invite → estado Rechazada sin chat.
- [ ] Test unit: hook `useInvitationActions` cubre branches (success accept, success decline, 409 expired, 409 not_actionable, network error).
- [ ] `pnpm typecheck`, `pnpm test`, `pnpm test:e2e -- creator-invitations` pasan.

## Done summary

_(filled on completion)_

## Evidence

_(filled on completion)_
