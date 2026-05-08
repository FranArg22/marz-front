# FEAT-013 Campaign detail (brand) — Frontend

## Overview

Implementa la pantalla `Campaign detail` desktop para brand users en `marz-front`: shell persistente por campaign con header propio y tabs deep-linkeables `overview | discovery | creators | videos` (`analytics` disabled). El scope es **solo frontend** — el backend (`marz-api`) entrega los endpoints REST + WS topic `campaign:{campaign_id}` definidos en `03-solution.md` §4. Front consume tipos generados con Orval contra el OpenAPI real (`pnpm api:sync`), respeta el shell brand (`_brand` route group), y mantiene el state vía URL search params + TanStack Query. Sin mocks MSW.

Fuente: `marz-docs/features/FEAT-013-campaign-detail/03-solution.md` (§4 contrato, §7 plan frontend).

## Scope

In:

- Ruta `src/routes/_brand/campaigns.$campaignId.tsx` con `validateSearch` (tab/section/q/status/platform/sort).
- Header persistente + tabs (`analytics` disabled con tooltip).
- Tab `overview`: stats (applications/reach/budget), details, creators preview, recent activity.
- Tab `discovery`: sidebar con counts + secciones `matches/applications/active/invited`; Add manually dialog.
- Tab `creators`: tabla reusable scoped por campaign (search/filter), CTAs en empty state.
- Tab `videos`: grid reusable scoped por campaign (search/filter/creator), navegación al reviewer existente.
- Mutaciones Discovery: contact match, accept/reject application, create invite (email + in_platform).
- WS subscription al topic `campaign:{campaign_id}` con dedupe por `event_id`.
- Tracking de eventos producto (view/tab/section/mutation).
- Tipos generados via `pnpm api:sync` (no se committean).

Out:

- Endpoints backend, schemas DB, eventos de dominio (viven en `marz-api`).
- Tab `analytics` (disabled, sin contenido).
- Vistas globales de Creators/Videos (las tablas/grids quedan listas para reuso vía `scope`, pero la ruta global no entra acá).
- Mocks MSW.
- Mobile/responsive (desktop-only, dentro del brand shell).

## Approach

- Route group `_brand`: agregar `campaigns.$campaignId.tsx` con loader auth-only y `validateSearch` Zod (TanStack Router).
- Estructura por feature reflejando bounded contexts:
  - `src/features/campaigns/detail/` — shell, header, tabs, Overview, Creators table reusable, Videos grid reusable.
  - `src/features/discovery/campaign-detail/` — sidebar, Match/Application/Invite cards, Add manually dialog, mutaciones.
- Data layer: server functions delgados sobre el cliente Orval generado en `src/shared/api/generated/` + hooks `useCampaign*Query` con keys `["campaign", id, ...]`. Mutaciones invalidan keys afectadas; WS patcha o invalida según evento.
- WS: hook `useCampaignTopicSubscription(campaignId)` sobre `src/shared/ws/useWebSocket.ts` tipando `DomainEventEnvelope<T>` para los 4 eventos del topic.
- State cliente: solo URL search params (tab/section/filters) + TanStack Query. Sin Zustand nuevo.
- Tokens visuales: usar `src/styles.css` (shadcn naming desde `marzv2.pen`). Validar contra nodos Pencil referenciados (`SFWpj`, `Rd4vP`, `1WW1E`, `CK94g`, `zUZ3j`, `j85X2`, `S5AMj`, `NJt6c`).
- Errores tipados desde `ApiError` (`code/message/details`): manejo específico de `409 plan_does_not_allow_in_platform_invite`, `409 conversation_already_exists` (navegar a Workspace existente con `details.conversation_id`), `409 invite_duplicate`, `409 campaign_not_discoverable`.

## Quick commands

```bash
# Sync contract (requiere backend dev arriba con FEAT-013 publicado)
pnpm api:sync

# Dev server
pnpm dev

# Type check + lint
pnpm typecheck && pnpm lint

# Smoke route (manual): http://localhost:3000/campaigns/<uuid>?tab=overview
```

## Acceptance

- **R1:** Ruta `/campaigns/$campaignId` accesible solo para brand users; creator session recibe denegación sin filtrar existencia. Search params validan `tab` (default `overview`) y `section` (default `matches`).
- **R2:** Header persistente y tabs deep-linkeables; `analytics` disabled con tooltip y sin navegación; cambio de tab actualiza URL sin remount del header.
- **R3:** Tab Overview renderiza stats (applications/reach/budget), details, creators preview y recent activity desde `GET /v1/campaigns/{id}/overview`. Empty states para datos no críticos faltantes.
- **R4:** Tab Discovery muestra sidebar con counts y sección por defecto `matches`; lista matches/applications/active/invited con sorting (`match_score|followers|fee|engagement`) y filtros por status; counts vienen de `/discovery/summary`.
- **R5:** Mutaciones Discovery wired a endpoints reales con `Idempotency-Key`: contact match, accept/reject application, create invite (email + in_platform). Errores tipados surfacean al usuario; `conversation_already_exists` navega al Workspace; plan free bloquea `in_platform`.
- **R6:** Tab Creators usa tabla reusable (`CampaignCreatorsTable` con prop `scope`) consumiendo `/participants` con search/status/platform; empty state con CTA hacia Discovery.
- **R7:** Tab Videos usa grid reusable (`CampaignVideosGrid` con prop `scope`) consumiendo `/videos` con filtros; click navega al reviewer existente; empty state CTA hacia `tab=creators`.
- **R8:** Suscripción WS al topic `campaign:{id}` patcha/invalida queries en `discovery.updated`, `participants.updated`, `videos.updated`, `activity.created`; dedupe por `event_id`.
- **R9:** Tipos generados via `pnpm api:sync` (no committeados); ningún tipo del contrato escrito a mano. `pnpm typecheck` pasa.
- **R10:** Eventos de tracking emitidos: `campaign_detail_viewed`, `campaign_detail_tab_changed`, `discovery_section_viewed`, mutation events (contact/accept/reject/invite).
- **R11:** Visual fidelity ≥95% contra nodos Pencil referenciados en light + dark (Overview `SFWpj`/`Rd4vP`, Discovery `1WW1E`/`CK94g`, Creators `zUZ3j`/`j85X2`, Videos `S5AMj`/`NJt6c`).

## Early proof point

Task `fn-12-feat-013-campaign-detail-brand.2` (route shell + header/tabs sobre `GET /detail`) valida la ruta `_brand/campaigns.$campaignId`, search params, guard creator/brand y consumo del cliente Orval. Si falla, re-evaluar contrato OpenAPI publicado, configuración de Orval o el guard del shell `_brand` antes de continuar con tabs.

## Requirement coverage

| Req | Description                               | Task(s)                                                                                                                                                        | Gap justification |
| --- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| R1  | Ruta + auth + search params               | fn-12-feat-013-campaign-detail-brand.1, fn-12-feat-013-campaign-detail-brand.2                                                                                 | —                 |
| R2  | Header persistente + tabs deep-linkeables | fn-12-feat-013-campaign-detail-brand.2                                                                                                                         | —                 |
| R3  | Tab Overview                              | fn-12-feat-013-campaign-detail-brand.3                                                                                                                         | —                 |
| R4  | Tab Discovery (read)                      | fn-12-feat-013-campaign-detail-brand.4                                                                                                                         | —                 |
| R5  | Mutaciones Discovery                      | fn-12-feat-013-campaign-detail-brand.5                                                                                                                         | —                 |
| R6  | Tab Creators reusable                     | fn-12-feat-013-campaign-detail-brand.6                                                                                                                         | —                 |
| R7  | Tab Videos reusable                       | fn-12-feat-013-campaign-detail-brand.7                                                                                                                         | —                 |
| R8  | WS subscription + dedupe                  | fn-12-feat-013-campaign-detail-brand.8                                                                                                                         | —                 |
| R9  | Tipos generados Orval                     | fn-12-feat-013-campaign-detail-brand.1                                                                                                                         | —                 |
| R10 | Tracking                                  | fn-12-feat-013-campaign-detail-brand.8                                                                                                                         | —                 |
| R11 | Visual fidelity Pencil                    | fn-12-feat-013-campaign-detail-brand.3, fn-12-feat-013-campaign-detail-brand.4, fn-12-feat-013-campaign-detail-brand.6, fn-12-feat-013-campaign-detail-brand.7 | —                 |

## References

- Spec: `marz-docs/features/FEAT-013-campaign-detail/03-solution.md`
- Glosario / lenguaje ubicuo: `marz-docs/glossary.md`
- Brand shell + route conventions: `marz-front/CLAUDE.md`, rutas existentes en `src/routes/_brand/`
- Cliente API generado: `src/shared/api/generated/` (regenerable con `pnpm api:sync`); mutator en `src/shared/api/mutator.ts`
- WebSocket tipado: `src/shared/ws/useWebSocket.ts`
- Tokens visuales: `src/styles.css` (mapeo desde `marz-design/marzv2.pen`)
- Diseño Pencil (nodos): Overview `SFWpj`/`Rd4vP`, Discovery `1WW1E`/`CK94g`, Creators `zUZ3j`/`j85X2`, Videos `S5AMj`/`NJt6c`, header/tabs `vmHz8`
