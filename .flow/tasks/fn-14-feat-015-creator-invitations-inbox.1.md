---
satisfies: [R7]
---

## Description

Regenerar el cliente API con Orval contra backend FEAT-015 dev y armar la capa de data (queries, mutations, query keys, idempotency-key generation por click) que consumirá toda la feature. No toca UI ni rutas.

**Size:** M
**Files:**

- `src/features/discovery/creator-invitations/queries.ts` — query keys + hooks `useCreatorInvitationsQuery`, `useCreatorInvitationDetailQuery`
- `src/features/discovery/creator-invitations/mutations.ts` — `useAcceptInvitationMutation`, `useDeclineInvitationMutation`
- `src/features/discovery/creator-invitations/idempotency.ts` — generador de `Idempotency-Key` per click (uuid v4 cacheado)
- `src/features/discovery/creator-invitations/__tests__/queries.test.ts`
- `src/features/discovery/creator-invitations/__tests__/mutations.test.ts`
- `src/shared/api/generated/**` (regenerado, gitignored)

## Approach

- Correr `pnpm api:sync` (script ya existente; ver `marz-front/CLAUDE.md` y `package.json`). Verificar que aparezcan los schemas `CreatorInvitationListResponse`, `CreatorInvitationCard`, `CreatorInvitationDetailResponse`, `AcceptCreatorInvitationResponse`, `DeclineCreatorInvitationResponse`, `InviteBriefSnapshot`, etc.
- Seguir el patrón de hooks de features ya hechas (ej. `src/features/offers/` o `src/features/chat/`): wrapper sobre hooks generados de Orval, sin re-tipar.
- Query keys estables y serializables (ver §7.3 de 03-solution.md):
  - `['creator-invitations', { status, search, cursor, limit }]`
  - `['creator-invitations', 'detail', inviteId]`
- Mutations invalidan `['creator-invitations']` (prefix), no `setQueryData` para counts (counts vienen del refetch).
- Idempotency key: uno generado por intento de click — el componente lo cachea hasta que la mutation termina (success o error), para que reintentos automáticos del cliente HTTP no creen keys nuevas. Doble-click del usuario reusa la key cacheada (evita 2 decisiones distintas).
- Mutator de Orval (`src/shared/api/mutator.ts`) ya maneja auth bearer; verificar que pasa headers custom (`Idempotency-Key`, `X-Brand-Workspace-Id` si aplica).

## Investigation targets

**Required:**

- `src/shared/api/mutator.ts` — confirmar pase de headers custom y manejo de errores tipados
- `package.json` — script `api:sync` y orval config
- `src/features/offers/queries.ts` (o similar feature ya implementada) — patrón de hooks + query keys
- `marz-docs/features/FEAT-015-creator-invitations-and-offer-detail/03-solution.md` §4 — contrato endpoints
- `marz-docs/features/FEAT-015-creator-invitations-and-offer-detail/03-solution.md` §7.3 — hooks signatures

**Optional:**

- `src/features/chat/mutations.ts` — patrón de mutation con invalidate

## Key context

- `pnpm api:sync` requiere backend FEAT-015 corriendo en dev con OpenAPI publicado. **Bloqueante**: si el backend aún no expuso los nuevos endpoints, esta task espera.
- Generated code está gitignored — no committear `src/shared/api/generated/**`.
- TanStack Query v5 (ver `package.json`): `useMutation` retorna `mutate`/`mutateAsync`; el manejo de errores tipados pasa por `onError` con `ApiError` del mutator.

## Acceptance

- [ ] `pnpm api:sync` corre sin errores y genera tipos de las 4 nuevas operaciones (`listCreatorInvitations`, `getCreatorInvitation`, `acceptCreatorInvitation`, `declineCreatorInvitation`).
- [ ] Hooks `useCreatorInvitationsQuery` y `useCreatorInvitationDetailQuery` exportados con tipos correctos del response.
- [ ] Hooks de mutation envían header `Idempotency-Key` no-empty en cada request (verificable en test con mock del cliente generado).
- [ ] Re-mutate con la misma key cacheada produce un único request observable cuando el cliente es estable; clicks rápidos reutilizan key.
- [ ] Test: query key estable (mismo input → misma key serializada).
- [ ] Test: mutation success invalida queries con prefix `['creator-invitations']`.
- [ ] Test: mutation error 409 (mock) propaga `ApiError` con `code` accesible al consumidor.
- [ ] `pnpm typecheck` y `pnpm test` pasan.

## Done summary

_(filled on completion)_

## Evidence

_(filled on completion)_
