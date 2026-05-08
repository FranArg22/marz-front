# FEAT-015 Creator Invitations Inbox + Detail (Frontend)

## Overview

Pantalla desktop para creators onboarded en `/invitations` donde listan, buscan, filtran tabs y deciden `Invite`s recibidas. Cada card abre un overlay deep-linkeable (`?inviteId=…`) con detalle read-only del Brief de la Campaign (objetivo, KPI, scoring, hard filters, content, pricing, targeting, bonus). Acciones: ver, aceptar, declinar, abrir chat (post-accept). El backend (FEAT-015 marz-api) ya devuelve snapshots completos en list/detail; el front no fan-outea a Campaigns/Identity.

Stack: TanStack Router (`_creator/invitations.tsx` + `validateSearch` Zod), TanStack Query (hooks list/detail/mutations), shadcn/ui, Tailwind v4 con tokens del `.pen`. Cliente API regenerado con Orval (`pnpm api:sync`). Sin Zustand nuevo: estado remoto en TanStack Query, estado UI en search params.

Sin WS realtime para inbox en MVP — refresh manual + invalidate post-mutación. Accept devuelve `conversation_id` y abre `/workspace/conversations/$conversationId`. Diseños fuente: frames Pencil `kfTLk` (grid+card) y `rJPEq` (detail overlay).

## Scope

**In:**

- Ruta `_creator/invitations.tsx` con search params Zod (`status`, `q`, `inviteId`).
- Toolbar (search debounced + refresh), tabs por status con counts (`total` + `filtered`), grid responsive desktop, empty states.
- Overlay detail con secciones de brief y modos `actionable` vs `historical` (derivado de `invite.status`).
- Mutaciones accept/decline con `Idempotency-Key` per click, conflict handling 409 (expired/terminal), navegación a chat.
- Item sidebar `Invitaciones` en `CreatorShell`.
- Analytics events de spec.

**Out:**

- Brand-side create invite UI (vive en FEAT-013 / fn-12).
- Mobile layout (desktop-only en MVP).
- Push WS realtime para inbox.
- Email-mode invites (vive en flujo backend de email; el front sólo lista `mode='in_platform'`).

## Approach

1. Regenerar tipos via `pnpm api:sync` cuando backend FEAT-015 (marz-api) publique OpenAPI en dev. Wrappers de hooks en `src/features/discovery/creator-invitations/` (sigue patrón `src/features/<bc>/<feature>/`).
2. Ruta + sidebar antes que data: shell visible aunque no haya invites.
3. Grid + tabs + search: una sola query parametrizada con counts del server.
4. Overlay detail: misma feature folder, search param `inviteId` deep-linkeable.
5. Mutations: idempotency por click, invalidate `['creator-invitations']`, manejo 409 expired/terminal con toast + refetch.
6. Polish: tracking, responsive, validación visual Pencil ≥95% en frames spec.

## Quick commands

```bash
pnpm api:sync              # regenerar cliente Orval contra dev backend
pnpm dev                   # SSR Node, http://localhost:3000
pnpm typecheck
pnpm test
pnpm test:e2e -- creator-invitations
```

## Acceptance

- **R1:** Creator onboarded navega a `/invitations` desde sidebar; brand y creator no-onboarded no acceden (route guard `_creator` existente).
- **R2:** Lista in-platform del creator activo con tabs por status, counts `total` (global) y `filtered` (con search), keyset pagination/load more, search debounced por brand/campaign, empty states diferenciados (all/status/search).
- **R3:** Card por invite (frame `kfTLk`): brand + campaign + commercial + status + acciones disponibles según `actions.*`; textos no se desbordan con nombres largos.
- **R4:** Overlay detail (frame `rJPEq`) deep-linkeable via `?inviteId`, modo `actionable` cuando `status='sent'` y `historical` para terminal; secciones brief completas (objetivo, KPI, scoring, hard filters, disqualifiers, content, pricing, targeting, bonus); focus trap + ESC + headings accesibles.
- **R5:** Accept dispara mutación con `Idempotency-Key` único por click, optimistic disabling, en éxito actualiza card/detail/counts via invalidate y permite navegar a `/workspace/conversations/$conversationId`. 409 expired/terminal refleja estado final sin permitir reintento.
- **R6:** Decline mutación con idempotency, cambia card a `Rechazada`, no abre chat ni navega; conflict 409 maneja igual que accept.
- **R7:** Double-click en accept/decline no produce dos decisiones visibles ni dos requests con keys distintas.
- **R8:** Analytics events emitidos: `creator_invitation_viewed`, `creator_invitation_detail_opened`, `creator_invitation_accepted`, `creator_invitation_declined`, `creator_invitation_chat_opened`, con atributos `invite_id, campaign_id, brand_workspace_id, status`.
- **R9:** Validación visual Pencil ≥95% contra frames `kfTLk` (grid+card) y `rJPEq` (detail) en dark; light theme via tokens del `.pen` mapeados en `styles.css`.
- **R10:** `pnpm typecheck`, `pnpm test`, `pnpm test:e2e` (scoped a creator-invitations) pasan; no se commitea código generado de Orval.

## Early proof point

Task fn-14-feat-015-creator-invitations-inbox.3 (inbox grid + tabs + search) valida que el contrato backend, la generación Orval y el patrón de query/counts/empty states cierran end-to-end con datos reales del backend FEAT-015 en dev. Si falla (ej. shape de counts no coincide o keyset cursor inestable), re-evaluar con backend antes de continuar con detail/mutations (.4-.5), porque toda la feature comparte el mismo data layer.

## Requirement coverage

| Req | Description                                               | Task(s)                                      | Gap justification |
| --- | --------------------------------------------------------- | -------------------------------------------- | ----------------- |
| R1  | Ruta creator + guards + sidebar                           | .2                                           | —                 |
| R2  | List + tabs + counts + search + pagination + empty states | .3                                           | —                 |
| R3  | Card frame kfTLk                                          | .3                                           | —                 |
| R4  | Overlay detail deep-link + secciones brief + a11y         | .4                                           | —                 |
| R5  | Accept + idempotency + conflict + nav chat                | .5                                           | —                 |
| R6  | Decline + idempotency + conflict                          | .5                                           | —                 |
| R7  | Double-click prevention                                   | .1 (idempotency wiring) + .5 (UX optimistic) | —                 |
| R8  | Analytics events                                          | .6                                           | —                 |
| R9  | Validación visual Pencil dark/light                       | .3 (grid), .4 (detail)                       | —                 |
| R10 | Typecheck/test/e2e green, no generated commits            | .6                                           | —                 |

## Dependencies

- **fn-11-feat-012-app-shell-sidebar-topbar**: `CreatorShell` (sidebar pattern) — el item `Invitaciones` extiende lo que esta epic establece.
- **fn-12-feat-013-campaign-detail-brand**: comparte `discovery` BC; brand-side create invite vive ahí.
- **Backend FEAT-015 (marz-api)**: endpoints + OpenAPI publicados en dev antes de F.1 (ver §7.5 de 03-solution.md).

## References

- `marz-docs/features/FEAT-015-creator-invitations-and-offer-detail/03-solution.md` — solution doc completa (DDL, contrato, eventos, plan).
- `marz-docs/features/FEAT-015-creator-invitations-and-offer-detail/02-spec.md` — spec de negocio.
- `marz-design/marzv2.pen` — frames `kfTLk` (grid+card), `rJPEq` (detail overlay).
- `marz-front/CLAUDE.md` — convenciones repo.
- `marzv2/CLAUDE.md` — bounded contexts + stack.
- Patrón existente: `src/features/discovery/` (si materializado por fn-12) o `src/features/offers/` para route+query+mutation pattern.
