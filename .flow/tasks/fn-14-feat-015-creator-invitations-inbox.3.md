---
satisfies: [R2, R3, R9]
---

## Description

Implementar la inbox: page shell, tabs por status con counts, search debounced + refresh, grid responsive desktop con `InvitationCard`, paginación load-more (keyset cursor), empty states diferenciados. Es el **early proof point** del epic — valida que el contrato del backend, Orval y el patrón de query/counts/empty cierran end-to-end.

**Size:** M (target del epic)
**Files:**

- `src/features/discovery/creator-invitations/CreatorInvitationsPage.tsx` — composición real (reemplaza placeholder de .2)
- `src/features/discovery/creator-invitations/InvitationStatusTabs.tsx`
- `src/features/discovery/creator-invitations/InvitationSearchToolbar.tsx`
- `src/features/discovery/creator-invitations/InvitationGrid.tsx`
- `src/features/discovery/creator-invitations/InvitationCard.tsx`
- `src/features/discovery/creator-invitations/InvitationEmptyState.tsx`
- `src/features/discovery/creator-invitations/formatters.ts` — formato de fee/deadline/expires
- `src/features/discovery/creator-invitations/__tests__/InvitationCard.test.tsx`
- `src/features/discovery/creator-invitations/__tests__/CreatorInvitationsPage.test.tsx`

## Approach

- `CreatorInvitationsPage` consume `useCreatorInvitationsQuery` con input derivado de search params (`status`, `q`, `cursor`, `limit=20`). El cursor se mantiene local (state o `useInfiniteQuery` si conviene; el contrato es keyset opaco).
- Tabs muestran `counts.total[status]` siempre, y `counts.filtered[status]` cuando hay search activo (badge secundario).
- Search debounced ~250ms, escribe a `?q=` (search param). Trim a 1..80 chars; vacío limpia el param.
- Refresh manual: botón que hace `queryClient.invalidateQueries(['creator-invitations'])`.
- Card: data shape `CreatorInvitationCard` del backend. Mostrar brand (logo/initials), campaign (name + objective + platforms + deadline), commercial (fee_label || derivar de fee_model+fee_amount, USD-only — sin currency display), status badge, expires_at humanizado. Acciones renderizan según `actions.*` (view_detail, accept, decline, open_chat, more_info). Click en card abre overlay (setea `?inviteId=`).
- Empty states: 3 variantes — sin invites en absoluto (default `all`+sin search), tab vacío con search vacío, tab vacío con búsqueda.
- Truncation: nombres largos (brand, campaign) usan ellipsis; tooltip en hover.

## Investigation targets

**Required:**

- `src/features/discovery/creator-invitations/queries.ts` — hook de .1
- `marz-docs/features/FEAT-015-creator-invitations-and-offer-detail/03-solution.md` §4.1 — `CreatorInvitationListResponse`, `CreatorInvitationCard`
- `marz-docs/features/FEAT-015-creator-invitations-and-offer-detail/02-spec.md` — empty state copy + flujos UX
- `src/features/chat/components/` o feature equivalente — patrón de tabs/grid existente

**Optional:**

- `marz-design/marzv2.pen` frame `kfTLk` — usar Pencil MCP para abrir y leer guidelines visuales

## Design context

Frame Pencil: `kfTLk` (grid + card). Lenguaje visual: redondeado, radios generosos (`--radius-lg` o token equivalente). Tokens shadcn ya mapeados en `src/styles.css` — usar utilities Tailwind v4 (`bg-background`, `text-foreground`, `text-primary`, etc.), nunca hex. Tipografía: Geist self-hosted (`@fontsource/geist-sans`).

Validación visual: tomar screenshot del frame con `mcp__pencil__get_screenshot`, comparar con la implementación. Target ≥95% match en dark; light derivado de tokens.

Full design system: `marz-design/marzv2.pen` (acceso vía pencil MCP únicamente — nunca Read/Grep en `.pen`).

## Key context

- Counts del server son la verdad — el frontend nunca recalcula counts a mano.
- Search no afecta `counts.total` (global), sólo `counts.filtered`. La spec lo aclara explícito.
- No lazy expiration en GET — un invite puede aparecer como `'sent'` y luego el cron lo pasa a `'expired'`. Manejarlo como flujo normal en mutations (.5).

## Acceptance

- [ ] Render con datos: cards visibles, counts en tabs correctos según mock.
- [ ] Cambiar tab actualiza search param `?status=` y refetchea con el filtro.
- [ ] Search escribe `?q=`, debounce ~250ms, vacío limpia el param.
- [ ] Refresh button invalida y refetchea sin perder posición visual.
- [ ] Load more agrega resultados sin duplicar (cursor estable); cuando `next_cursor=null` el botón desaparece.
- [ ] Empty states: 3 variantes con copy diferenciado (test).
- [ ] Card muestra brand, campaign, fee, status, expires; acciones honran `actions.*` flags.
- [ ] Truncation en nombres largos no rompe layout (test con string >80 chars).
- [ ] Tabs muestran badge `total` siempre y `filtered` cuando hay search (test).
- [ ] E2E: creator con varias invites filtra `Pendientes` y busca por nombre brand → resultados correctos.
- [ ] Validación visual Pencil ≥95% contra frame `kfTLk` en dark.
- [ ] `pnpm typecheck`, `pnpm test`, `pnpm test:e2e -- creator-invitations` pasan para esta porción.

## Done summary

_(filled on completion)_

## Evidence

_(filled on completion)_
