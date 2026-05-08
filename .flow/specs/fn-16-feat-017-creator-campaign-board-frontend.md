# FEAT-017 Creator campaign board (frontend)

## Overview

Pantalla `Campañas` desktop del shell creator: board read-only con search, filtros (`niches` + `interests` como ejes separados), ordenamiento, brief en sheet y postulación con `Application message`. Consume `/v1/creator/campaign-board*` de `marz-api`. No hay WS para el board en MVP — la respuesta inline del POST confirma submit; multi-tab reconcilia con refresh manual. Regenerar tipos con `pnpm api:sync` antes de empezar (la solution define los schemas en §4.4).

Spec fuente: `marz-docs/features/FEAT-017-creator-campaigns-board/03-solution.md` (secciones 4, 7, 8–11). Diseño Pencil node `g941zm` (RESERVED/05-CreatorCampaignsBoard) desktop dark; implementar light con tokens del proyecto.

## Scope

In:

- Ruta `_creator/campaigns` con `validateSearch` Zod y guards heredados de `_creator`.
- Item sidebar `Campañas` activo en `CreatorShell`.
- Componentes board: page, header, filters, sort, grid, card, match badge, brief sheet, application dialog, empty states.
- Server functions + hooks TanStack Query para list/detail y mutation de submit con idempotency-key cliente.
- Empty states + analytics events spec'd en §7.4 F.7.
- E2E desktop del flujo completo.

Out:

- Backend (otro repo `marz-api`, tasks B.1–B.9).
- WebSocket / push realtime (MVP no lo tiene).
- MSW runtime (sólo mocks en tests).
- Mobile layout específico (desktop-first según spec).
- Aceptar/declinar invitaciones desde el brief (no aplica a board, eso es FEAT-015).

## Approach

- Feature ubicada en `src/features/discovery/campaign-board/` siguiendo la convención de bounded contexts del front (CLAUDE.md: un contexto no importa de otro).
- Tipos generados por Orval (`pnpm api:sync` contra dev) — los generados están gitignored, regenerar siempre antes de tocar UI.
- Search params → URL como source of truth; debounce sólo en `q`.
- Mutation usa `card_patch` de la respuesta para optimistic update + invalidación de queries del board.
- Idempotency-key client-side: UUID v4 por intento de submit; al recibir `409 idempotency_conflict` regenerar key y reintentar.
- Tokens: usar utilities Tailwind v4 derivadas de `src/styles.css` (mapeo del `.pen`). UI redondeada (CLAUDE.md marz-design).
- Tests: Vitest para hooks/utils, Playwright para E2E. Axe en card/page para accesibilidad.

## Quick commands

```bash
pnpm api:sync                                  # regenerar cliente API
pnpm dev                                       # dev server
pnpm test src/features/discovery/campaign-board
pnpm typecheck
pnpm lint
pnpm test:e2e --grep "creator campaign board"
```

## Acceptance

- **R1:** Creator onboarded entra a `/_creator/campaigns` y ve grid 3-col desktop con cards (brand, score band, fee, deliverables, deadline, acción primaria) consumiendo `/v1/creator/campaign-board`. Brand recibe redirect del shell `_creator`.
- **R2:** Search (q), filtros independientes `niches` e `interests`, plataformas, deliverables, fee range, min match score (slider 0..100), `recommended_only` y sort funcionan, sincronizan con URL search params y disparan refetch sin recargar la página.
- **R3:** `Ver brief` abre `CampaignBriefSheet` con detail read-only (description, key messages, do/don't, ICP, deliverables, commercial); no muestra acciones invite/offer; lazy-loaded por `campaign_id` y cacheado.
- **R4:** `Postularme` valida message 1..2000 chars, envía POST con header `Idempotency-Key` UUID v4; en éxito aplica `card_patch` y deja card en estado `Postulación enviada` sin esperar WS. `409 application_already_exists` muestra estado enviado con link `Ver postulación`. `409 idempotency_conflict` regenera key y reintenta.
- **R5:** Empty states correctos por variante (`no_campaigns`, `no_filters`, `no_recommendations`, `error`) con textos exactos del spec, y se emiten los analytics events listados en §7.4 F.7 (`campaign_board_viewed`, `searched`, `filtered`, `sorted`, `brief_opened`, `application_started`, `application_submitted`, `empty_state_seen`).
- **R6:** Tipos del cliente API consumidos desde `src/shared/api/generated/` y NO hay tipos backend duplicados a mano en feature. `pnpm typecheck` y `pnpm lint` limpios.
- **R7:** E2E desktop cubre: entrada → filtros (incluyendo `niches` + `interests`) → ver brief → postular → estado enviado en card; multi-tab muestra estado correcto al refresh manual.
- **R8:** Axe sin violations críticas en `CampaignBoardPage`, `CampaignBriefSheet`, `ApplicationDialog`.

## Early proof point

Task `fn-16-feat-017-creator-campaign-board-frontend.1` (route + types + search schema) valida que el contrato OpenAPI generado por `pnpm api:sync` incluye los schemas de §4.4 y que el guard `_creator` redirige brand. Si falla, frenar y volver a coordinar con backend (B.7 incompleto) antes de continuar con F.2+.

## Requirement coverage

| Req | Description                                        | Task(s)                                                                                                                                              | Gap justification |
| --- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| R1  | Ruta creator + grid del board consumiendo endpoint | fn-16-feat-017-creator-campaign-board-frontend.1, fn-16-feat-017-creator-campaign-board-frontend.2, fn-16-feat-017-creator-campaign-board-frontend.3 | —                 |
| R2  | Search/filtros/sort + URL sync                     | fn-16-feat-017-creator-campaign-board-frontend.4                                                                                                     | —                 |
| R3  | Brief sheet read-only lazy                         | fn-16-feat-017-creator-campaign-board-frontend.5                                                                                                     | —                 |
| R4  | Application dialog + mutation + idempotency        | fn-16-feat-017-creator-campaign-board-frontend.6                                                                                                     | —                 |
| R5  | Empty states + analytics events                    | fn-16-feat-017-creator-campaign-board-frontend.7                                                                                                     | —                 |
| R6  | Tipos generados, sin duplicación                   | fn-16-feat-017-creator-campaign-board-frontend.1, fn-16-feat-017-creator-campaign-board-frontend.2                                                   | —                 |
| R7  | E2E desktop + multi-tab refresh                    | fn-16-feat-017-creator-campaign-board-frontend.8                                                                                                     | —                 |
| R8  | Accesibilidad axe                                  | fn-16-feat-017-creator-campaign-board-frontend.3, fn-16-feat-017-creator-campaign-board-frontend.5, fn-16-feat-017-creator-campaign-board-frontend.6 | —                 |

## References

- `marz-docs/features/FEAT-017-creator-campaigns-board/03-solution.md` (secciones 4, 7, 8, 9, 10)
- `marz-docs/features/FEAT-017-creator-campaigns-board/02-spec.md` (US-2, empty states, analytics)
- `marz-front/CLAUDE.md` (workspace/CLAUDE.md raíz: stack, rutas por kind, convención feature por BC)
- Pencil node `g941zm` (RESERVED/05-CreatorCampaignsBoard) — diseño desktop dark, implementar light con tokens
- Backend epics correlativos en `marz-api`: tasks B.1–B.9 de la solution
