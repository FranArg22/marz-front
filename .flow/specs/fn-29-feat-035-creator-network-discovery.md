# fn-29-feat-035-creator-network-discovery FEAT-035 Creator Network Discovery — Frontend

## Overview

Creator Network Discovery materializa la pantalla `/discovery` del brand product: un grid de creators de la network filtrable + invitación in-platform (single y bulk) que crea `ConnectionRequest`. Consolida `EmailInvite` como entidad propia. Esta feature también elimina la pantalla "Discovery dentro de campaña" (5 endpoints eliminados del backend) y la reemplaza con un tab "Postulaciones" en campaign detail, refactoriza el inbox del creator para renderizar `ConnectionRequest`, y cambia el gating por plan agregando capability `allows_discovery`.

El backend ya está desarrollado y el cliente API regenerado contra el backend dev. El diff de `pnpm api:sync` está en el working tree (unstaged).

## Scope

**In:**
- Ruta `/_brand/discovery` con filtros en URL y store Zustand para pending vs applied
- Grid infinito de `DiscoveryCreatorCard` con `DiscoveryCreatorPlatformStats` por plataforma
- Panel de filtros lateral (`DiscoveryFilterPanel`) y chips (`DiscoveryFilterChips`)
- `CreatorCard` con mini-tabla 4 cols (Alcance/ER/CPM/Precio) + indicador `pair_state.kind`
- Modal de invite single (`InviteSingleModal`) + modo bulk (`InviteBulkModal`)
- Upsell para plan free + item "Discovery" en sidebar (con candado para free)
- Refactor inbox del creator: render de items `connection_request_received`
- Botón "Invitar por email" en `/creators` + modal `EmailInviteModal`
- Botón "Find creator" en `/creators` → navega a `/discovery`
- Eliminar Discovery tab de campaign detail + crear tab Postulaciones (usa `listCampaignApplications`)

**Out:**
- Pantalla pública `/invite/{token}` (manejo de email invite onboarding — es flujo de identity/onboarding)
- WS realtime para inbox
- UGC creator type (habilitado en backend pero botón deshabilitado con label "Próximamente" en UI)

## Approach

1. **Primero: fix build-breaking** (task .1) — el api:sync eliminó 5 funciones de campaigns que el código existente importa; fijar antes de cualquier cosa nueva.
2. Ruta + store (task .2) — shell visible antes de que el grid tenga datos.
3. Grid + query (task .3) — `useInfiniteQuery` wrapeando `getDiscoveryCreators`.
4. Filtros (tasks .4 y .5) — panel lateral primero, chips después.
5. Card (task .6) — requiere el grid para ver datos reales.
6. Modales de invite (tasks .7 y .8) — single antes que bulk.
7. Upsell + sidebar (task .9) — leer `allows_discovery` de `/me`.
8. Inbox creator (task .10) — independiente, puede ir en paralelo con .4+.
9. Botones en `/creators` (tasks .11 y .12) — pueden ir en cualquier orden.

## Quick commands

```bash
pnpm dev                   # inicia el servidor, http://localhost:3000
pnpm typecheck             # verificar tipos
pnpm test                  # tests unitarios (vitest)
pnpm test:e2e              # playwright
pnpm work:post             # format + i18n:extract + i18n:compile + quality-gates
```

## Acceptance

- [ ] `/discovery` renderiza grid de creators con filtros funcionales para plan pago.
- [ ] Plan free ve upsell en `/discovery`; sidebar muestra "Discovery" con candado.
- [ ] Invite single envía `CreateConnectionRequestRequest`, toast de éxito, card refrescada.
- [ ] Invite bulk envía `CreateConnectionRequestsBulkRequest`, mensaje con N enviados / M omitidos.
- [ ] Inbox del creator muestra `connection_request_received` con Aceptar/Rechazar funcionales.
- [ ] Campaign detail: tab "Discovery" eliminado, tab "Postulaciones" funcional con `listCampaignApplications`.
- [ ] Botón "Invitar por email" en `/creators` funcional.
- [ ] Botón "Find creator" en `/creators` navega a `/discovery`.
- [ ] `pnpm typecheck` verde. `pnpm test` verde (excepto failures pre-existentes conocidos).
- [ ] `pnpm react-doctor` ≥ 95/100.

## Qué cambió en el contrato API (api:sync ya aplicado)

**Eliminados** (ya no existen en el cliente generado):
- `getCampaignDiscoverySummary`, `listCampaignDiscoveryMatches`, `listCampaignDiscoveryInvites`, `listCampaignDiscoveryActive`, `listCampaignDiscoveryApplications` — junto con sus tipos
- Modelos borrados: `CampaignMatchListResponse`, `CampaignInviteListResponse`, `CampaignActiveListResponse`, `CampaignDiscoverySummaryResponse`, `CampaignMatchCard`, `CampaignInviteListItem`, etc.

**Nuevos en `brand.ts`**:
- `getDiscoveryCreators(params?: GetDiscoveryCreatorsParams)` → `DiscoveryCreatorsResponse`
- `useCreateDiscoveryConnectionRequest` / `useCreateDiscoveryConnectionRequestsBulk` / `useCreateDiscoveryEmailInvite`

**Nuevos en `discovery.ts`**:
- `useGetDiscoveryConnectionRequest(id)` → `ConnectionRequestDetailResponse`
- `useGetEmailInviteByToken(token)` → `EmailInviteByTokenResponse`

**Nuevos en `creator.ts`**:
- `useAcceptDiscoveryConnectionRequest({ id })` → `AcceptConnectionRequestResponse` (con `conversation_id`)
- `useRejectDiscoveryConnectionRequest({ id })` → `RejectConnectionRequestResponse`

**Nuevos en `campaigns.ts`**:
- `listCampaignApplications(campaignId, params?)` → `CampaignApplicationListResponse`

**Nuevo en `CampaignPlanCapabilities`**:
- `allows_discovery: boolean`

## Tasks

- .1 — Commit api:sync + eliminar Discovery tab de campaña + crear tab Postulaciones
- .2 — Ruta `/discovery` + estructura de feature + `discoveryFiltersStore`
- .3 — `DiscoveryGrid` + `useDiscoveryCreatorsInfiniteQuery`
- .4 — `DiscoveryFilterPanel`
- .5 — `DiscoveryFilterChips`
- .6 — `CreatorCard` con mini-tabla por plataforma
- .7 — `InviteSingleModal` + mutation `useCreateConnectionRequest`
- .8 — Modo Seleccionar + `InviteBulkModal`
- .9 — `DiscoveryUpsell` (plan free) + item Discovery en sidebar
- .10 — Inbox del creator: render `connection_request_received`
- .11 — Botón "Invitar por email" en `/creators` + `EmailInviteModal`
- .12 — Botón "Find creator" en `/creators` → `/discovery`
