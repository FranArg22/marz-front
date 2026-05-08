# FEAT-014 Inbox (frontend)

## Overview

Construir la pantalla **Inbox** en `marz-front` para brand y creator: dos secciones independientes (`action_items` y `waiting_items`, max 20 cada una) alimentadas por `GET /v1/inbox`, filtrables por `campaign_id`, con mark-as-read individual/bulk y acciones inline (reply, accept/reject de offer y application) que invocan los endpoints dueños existentes. Sin WebSocket — refresh manual + invalidación de query tras mutaciones. Diseño de Pencil: `Screens / Inbox` (`f1xap`), `ckleU/IXg9m` (brand light/dark), `B7K8C/YVt6t` (creator), `g5SCF/PCAAk` (empty).

Spec fuente de verdad: `marz-docs/features/FEAT-014-inbox/03-solution.md` §7 (Plan ejecución — Frontend).

## Scope

In scope (frontend, marz-front únicamente):

- Ruta `/inbox` con guard de sesión + onboarding y `validateSearch` para `{ campaign_id?: string }`.
- Item Sidebar `Inbox` en `BrandShell` y `CreatorShell` (icon `Inbox` lucide).
- Pantalla `InboxPage`: toolbar (filtro campaign + refresh + mark-all), dos `InboxSection` (action / waiting), `InboxItemRow`, `InboxInlineActionPopover`, `InboxEmptyState`.
- Hooks de data: `useInboxQuery`, `useMarkInboxItemReadMutation`, `useMarkInboxVisibleReadMutation`. Server functions TanStack Start que envuelven los endpoints.
- Inline actions reutilizan mutations existentes (`useSendMessageMutation`, generated offer accept/reject, generated application accept/reject).
- Navegación a flujos completos vía `navigation_action.href` del response.
- Analytics: `inbox_viewed`, filter, refresh, opened, inline started/completed, mark-read, empty-state.

Out of scope:

- Backend (`marz-api`) — vive en otro repo.
- WebSocket de Inbox.
- Componente reusable global de item; `InboxItemRow` queda local a `features/inbox`.
- Persistencia del filtro entre sesiones (vive solo en search params).

## Approach

- `src/features/inbox/` espeja convención de bounded context (ver `src/features/{chat,offers,deliverables,...}/` actuales).
- Cliente API generado por Orval tras `pnpm api:sync` contra dev backend (requiere B.6 deployado). Generated code no se committea.
- Server functions TanStack Start (`createServerFn`) con validators Zod — patrón ya usado en otras features.
- TanStack Query: query key `['inbox', campaignId ?? null]`. Mutations invalidan `['inbox']` sin optimistic updates que oculten errores.
- Tokens de diseño desde `src/styles.css` (mapeo shadcn light/dark). UI redondeada según `marz-design`.
- Sin Zustand — filtro vive en search params.

## Quick commands

```bash
# Regenerar cliente API tras backend deployado
pnpm api:sync

# Type check
pnpm typecheck

# Tests
pnpm test

# Dev server (verificar UI manualmente)
pnpm dev
```

## Acceptance

- **R1:** Existe ruta `/inbox` accesible desde brand y creator shells, con guard de sesión + onboarding y entry visible en Sidebar marcando estado activo.
- **R2:** `InboxPage` renderiza dos secciones (`action_items`, `waiting_items`) con counts, items ordenados `occurred_at DESC` y empty state unificado cuando no hay pendientes.
- **R3:** Filtro de campaign vive en search params (`?campaign_id=...`); cambiar/limpiar invalida query y refetcha; refresh manual disponible en toolbar.
- **R4:** `Mark all as read` envía `campaign_id` actual (si existe) y `sections` por defecto; mutación individual de read disponible por item; ambas invalidan `['inbox']`.
- **R5:** Inline actions (reply, offer accept/reject, application accept/reject) se renderizan según `inline_actions[]` del response y delegan al endpoint dueño con `Idempotency-Key`; success cierra popover y refresca Inbox; 409 muestra estado vigente sin romper UI.
- **R6:** `navigation_action` abre flujo completo correcto (Workspace, Video reviewer, Discovery, Campaign, Profile, Conversation) usando `href` canónico del backend.
- **R7:** Analytics emite los eventos definidos sin PII en payloads (truncar/omitir previews).
- **R8:** Validación visual Pencil ≥95% contra `ckleU`, `B7K8C`, `g5SCF` en light + dark; accesibilidad cumple (headings por sección, botones icon-only con aria-label).
- **R9:** Cliente API regenerado con `pnpm api:sync`; no se commitean los archivos generados.

## Early proof point

Task fn-13-feat-014-inbox-frontend.1 valida el contrato real contra el backend dev: regenera Orval, expone tipos `InboxResponse/InboxItem/...` y monta los hooks/server functions. Si los tipos no aparecen o el dev backend no devuelve el shape esperado, hay que pausar y resincronizar contrato con backend antes de continuar con .2+ (no tiene sentido construir UI sobre tipos faltantes).

## Requirement coverage

| Req | Description                        | Task(s)                         | Gap justification |
| --- | ---------------------------------- | ------------------------------- | ----------------- |
| R1  | Ruta `/inbox` + Sidebar entries    | fn-13-feat-014-inbox-frontend.2 | —                 |
| R2  | Dos secciones, counts, empty state | fn-13-feat-014-inbox-frontend.3 | —                 |
| R3  | Filtro campaign + refresh          | fn-13-feat-014-inbox-frontend.4 | —                 |
| R4  | Mark-as-read individual + bulk     | fn-13-feat-014-inbox-frontend.4 | —                 |
| R5  | Inline actions popover             | fn-13-feat-014-inbox-frontend.5 | —                 |
| R6  | Navegación a flujos completos      | fn-13-feat-014-inbox-frontend.6 | —                 |
| R7  | Analytics sin PII                  | fn-13-feat-014-inbox-frontend.6 | —                 |
| R8  | Validación visual + a11y           | fn-13-feat-014-inbox-frontend.3 | —                 |
| R9  | API sync Orval                     | fn-13-feat-014-inbox-frontend.1 | —                 |

## References

- Spec técnica: `marz-docs/features/FEAT-014-inbox/03-solution.md` §7
- Diseño Pencil: `marz-design/marzv2.pen` → `Screens / Inbox` (`f1xap`)
  - Brand: `ckleU` (light), `IXg9m` (dark)
  - Creator: `B7K8C` (light), `YVt6t` (dark)
  - Empty: `g5SCF` (light), `PCAAk` (dark)
- Guías arquitectura frontend: `marz-front/CLAUDE.md`, `marzv2/CLAUDE.md` (sección marz-front)
- Convención features: `src/features/chat/`, `src/features/offers/`, `src/features/deliverables/`
