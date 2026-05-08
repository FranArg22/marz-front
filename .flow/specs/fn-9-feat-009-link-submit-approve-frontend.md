# FEAT-009: Link Submit & Approve — Frontend

## Overview

Implementa el lado frontend del flujo `Link Submit & Approve` para `Deliverable`s en el shell de Workspace existente. El creator envía un `published link` (YouTube/Instagram/TikTok) sobre un deliverable en `draft_approved`; el brand owner lo aprueba (cierra deliverable → `completed`) o pide cambios (vuelve a `draft_approved`). Soporta re-submit antes de aprobación. La feature reusa el shell de Workspace (sin rutas nuevas), reusa `Modal/RequestChanges` y la convención de `system_event` cards. La fuente técnica es `marz-docs/features/FEAT-009-link-submit-approve/03-solution.md` §7 (frontend).

Backend (`marz-api`) corre en epic separado y se asume disponible en `dev` antes de F.3+. F.1 (api:sync) bloquea hasta que el backend tenga `POST/GET /api/v1/deliverables/{id}/links*` y schemas `PublishedLink`, `ChangeRequest` extendido en el openapi en dev.

## Scope

**Incluye**:

- Sync de OpenAPI + tipos generados (Orval) para los 4 endpoints nuevos.
- 3 cards de `system_event`: `LinkSubmittedCard`, `LinkApprovedCard`, `LinkChangesRequestedCard`.
- Sidesheet `Submit Link` (creator) con preview server-side mostrado al responder.
- Wiring de mutations `useSubmitLink`, `useApproveLink`, `useRequestLinkChanges` y query `useDeliverableLinks`.
- Modificación de `BrandContextPanel/V2*`, `CreatorContextPanel`, `Card/Deliverable` para mostrar estado y URL del link, y la acción "Submit link" condicional.
- Extensión de `Modal/RequestChanges` con prop `target: 'draft' | 'link'`.
- Suscripción WS extendida a `deliverable.updated.current_link` y router `SystemEventCard` con 3 ramas nuevas.
- Eventos analytics frontend (`link_submit_opened`, `link_preview_resolved`, `link_card_seen`, `link_url_clicked`) vía endpoint genérico FEAT-002.

**Fuera de scope**:

- Endpoint admin para mutar `platform_config` (backend, fuera de MVP).
- Organismo final `LinkApprovedCard` en `.pen` (queda fallback inline; sesión de diseño aparte).
- Endpoint separado de preview (no existe; se resuelve server-side al submit).

## Approach

- Reusar shell de Workspace existente: rutas `_brand/workspace/$conversationId.tsx` y `_creator/workspace/$conversationId.tsx` no cambian.
- Tipos compartidos exclusivamente desde `src/shared/api/generated/` (Orval). NO duplicar interfaces a mano.
- Componentes nuevos viven en `src/features/deliverables/components/`. Hooks de data en `src/features/deliverables/hooks/`.
- `LinkPreviewBlock` es componente puro reusado en sidesheet, card y panel lateral (3 outcomes: `title_and_thumbnail`, `url_only`, `failed`).
- Todas las mutations invalidan `['deliverable', deliverableId]` y `['deliverable', deliverableId, 'links']`. WS `deliverable.updated` hace `setQueryData` directo (sin refetch) y upsert de `current_link` en la lista.
- `useApproveLinkMutation` es optimistic en `['deliverable', id]` → status `completed`. `useSubmitLinkMutation` NO es optimistic (espera preview del servidor).
- Validación de URL en cliente con Zod (`https?://...`) sólo como UX; la verdad es la whitelist del servidor.
- Router de `SystemEventCard` (`src/features/chat/components/SystemEventCard.tsx`) gana 3 ramas nuevas con type-narrowing por `event_type`.
- Visibilidad de acciones por rol: brand owner ve `Approve` y `Request changes` cuando `link.status='submitted'`; brand admin/member NO; creator NO.
- Multistage: la acción `Submit link` solo aparece cuando `deliverable.status='draft_approved'`, caller=creator del deliverable, y la stage del deliverable no está `locked`.

## Quick commands

```bash
# Sync types from backend dev
pnpm api:sync

# Run dev (TanStack Start SSR)
pnpm dev

# Type check + tests
pnpm typecheck
pnpm test
pnpm test:e2e -- --grep "link submit|link approve|link changes"
```

## Acceptance

- **R1:** El creator puede enviar un link válido (YouTube/Instagram/TikTok) desde el sidesheet sobre un deliverable `draft_approved`; al responder el server, aparece `LinkSubmittedCard` al final del chat con preview (title+thumbnail si oEmbed/og resolvió, sólo URL si `url_only`, fallback URL si `failed`).
- **R2:** El brand owner ve botones `Approve link` y `Request changes on link` en `LinkSubmittedCard` cuando `link.status='submitted'`; brand admin/member y creator no los ven (snapshot test + RBAC enforced en UI).
- **R3:** Al aprobar el link, la card pasa a `LinkApprovedCard` (o fallback `EventBubble/Success` documentado), el panel lateral del deliverable se actualiza a estado `completed` con badge "Link approved" y URL clickable, sin refresh, vía WS `deliverable.updated`.
- **R4:** Al pedir cambios, se reusa `Modal/RequestChanges` con `target='link'`; al confirmar, el deliverable vuelve a `draft_approved`, el link queda en `changes_requested`, el creator puede re-submit (sidesheet vuelve a abrirse desde panel).
- **R5:** Re-submit antes de aprobación deja la card vieja inmutable en su posición cronológica; la nueva card aparece al final; el panel lateral muestra la URL del último link (`current_link_id` del response de `GET /links`).
- **R6:** Errores tipados del backend muestran mensajes específicos en el sidesheet: `422 DOMAIN_NOT_ALLOWED` → "Domain not allowed", `409 INVALID_DELIVERABLE_STATUS` → mensaje contextual, `403 FORBIDDEN` → mensaje de permisos.
- **R7:** En multistage: aprobar el último link de la stage activa cierra la stage y abre la siguiente (front escucha `StageOpened` y refresca panel); deliverables de stages `locked` no muestran "Submit link".
- **R8:** Eventos analytics emitidos al endpoint genérico `POST /api/v1/analytics/events`: `link_submit_opened` al abrir sidesheet, `link_preview_resolved` cuando el response trae preview, `link_card_seen` por IntersectionObserver >50% una vez por sesión por card, `link_url_clicked` al click en URL. Payload sin URLs concretas, nombres ni montos.
- **R9:** Validación visual ≥95% contra frames Pencil: `Lh0UU`/`F5oKK` (Brand 09), `iqvJx`/`olo8n` (Brand 10), `Vhl85`/`Gzfb7` (Creator 10), `XXkhA`/`yJHY6` (Creator sidesheet) en light + dark.
- **R10:** A11y: input de URL con label asociado, `aria-live` para errores; modal y sidesheet con focus trap y cierre con `Esc`; links con `rel="noopener noreferrer" target="_blank"`.

## Early proof point

Task `fn-9-feat-009-link-submit-approve-frontend.3` (SubmitLinkSidesheet) valida el flujo end-to-end fundamental: tipos Orval correctos, validación cliente, manejo de errores tipados del backend, y render del preview server-side en `LinkSubmittedCard`. Si falla, re-evaluar el contrato del openapi y la estrategia de optimistic vs loading antes de continuar con `.4`+.

## Requirement coverage

| Req | Description                              | Task(s)        | Gap justification |
| --- | ---------------------------------------- | -------------- | ----------------- |
| R1  | Creator submit + render card con preview | .1, .2, .3, .4 | —                 |
| R2  | RBAC visibility de acciones brand owner  | .4             | —                 |
| R3  | Approve → completed + panel WS-refresh   | .4, .5, .7     | —                 |
| R4  | Request changes link reusa modal         | .4, .5         | —                 |
| R5  | Re-submit antes de aprobación            | .6             | —                 |
| R6  | Errores tipados con mensajes UX          | .3             | —                 |
| R7  | Multistage habilitación condicional      | .8             | —                 |
| R8  | Analytics frontend events                | .9             | —                 |
| R9  | Validación visual ≥95% Pencil frames     | .2, .3, .4, .7 | —                 |
| R10 | A11y sidesheet + modal + links           | .3, .4         | —                 |

## References

- Spec técnica: `../marz-docs/features/FEAT-009-link-submit-approve/03-solution.md` §7 (frontend), §4 (contratos), §5 (eventos), §10 (analytics).
- Spec producto: `../marz-docs/features/FEAT-009-link-submit-approve/02-spec.md`.
- Convención de feature module y rutas: `marz-front/CLAUDE.md` + epics `fn-3..fn-8`.
- Tipos generados Orval: `src/shared/api/generated/` (regenerados con `pnpm api:sync`).
- Hook WS: `src/shared/ws/useWebSocket.ts` con `DomainEventEnvelope<T>`.
- Modal a extender: `Modal/RequestChanges` (`ZEKzd`).
- Frames Pencil: `Lh0UU`, `F5oKK`, `iqvJx`, `olo8n`, `Vhl85`, `Gzfb7`, `XXkhA`, `yJHY6`, `CrEZH`, `M8nUn`.
