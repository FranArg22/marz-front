---
satisfies: [R6, R9, R11]
---

## Description

Suscribir el wizard a los eventos WS `campaign.configuration.updated` y `campaign.configuration.activated` para reconciliar query cache cuando otra sesión avanza, y emitir analytics events: `campaign_configuration_started` (mount del wizard), `campaign_configuration_step_completed` (post-PATCH éxito), `campaign_configuration_activated` (post-activate éxito), `campaign_configuration_abandoned` (route leave sin completar). No duplicar events en replays/refetches.

**Size:** M
**Files:**

- `src/features/campaigns/configuration/analytics.ts` (nuevo)
- `src/features/campaigns/configuration/useConfigurationWebSocket.ts` (nuevo)
- `src/shared/ws/handlers.ts` (extender si registry centralizado)
- `src/shared/ws/events.ts` (extender con nuevos event types)
- `src/features/campaigns/configuration/CampaignConfigurationWizard.tsx` (modificar: integrar hooks)

## Approach

- Extender `events.ts` con `CampaignConfigurationUpdatedEvent` y `CampaignConfigurationActivatedEvent` matcheando shapes de §4.2 del solution.
- `useConfigurationWebSocket(campaignId)`: registra listener en el hub para topic `campaign:${campaignId}`.
  - On `updated`: comparar `configuration_version` con local; si remote > local, `setQueryData` con la diff o invalidate; si remote === local, no-op (es nuestro propio update).
  - On `activated`: invalidate campaigns list query, redirect a `/campaigns/$id`.
- `analytics.ts`: 4 funciones helper que llaman al tracker existente (verificar si hay `analytics.track()` global).
- Para evitar duplicados:
  - `started`: emitir en `useEffect` del wizard mount (deps `[campaignId]`); guard con `useRef` para no re-emitir en re-mounts del mismo campaignId dentro de 5 minutos (si es problema en práctica, sino skip).
  - `step_completed`: emitir en mutation onSuccess solo cuando el step pasó de no-completado a completado (chequear `previousData.completed_steps` vs `response.completed_steps`).
  - `activated`: emitir en activate mutation onSuccess una sola vez (si replay backend devuelve 200 cacheado, no hay forma de distinguir local — aceptar duplicado raro como costo).
  - `abandoned`: en `useBeforeUnload` o `router` `onLeave` cuando el wizard estaba abierto y `configuration_complete=false`. Solo emitir una vez por sesión.

## Investigation targets

**Required:**

- `src/shared/ws/handlers.ts` — patrón actual de registro de handlers
- `src/shared/ws/events.ts` — definición de event types existentes
- `src/shared/ws/useWebSocket.ts` — hook hub
- Buscar uso de analytics existente: `grep` por `analytics.track` o similar en `src/`

**Optional:**

- TanStack Router `onLeave`/`beforeLeave` docs

## Acceptance

- [ ] `events.ts` tipa los 2 nuevos eventos matching §4.2.
- [ ] `useConfigurationWebSocket` se subscribe al mount y desuscribe al unmount.
- [ ] WS `updated` con version mayor a local invalida query y muestra reconcile (banner o toast).
- [ ] WS `updated` con version igual o menor es no-op (nuestro propio update).
- [ ] WS `activated` invalida campaigns list y redirige.
- [ ] Analytics emite `started` una vez por mount del wizard.
- [ ] Analytics emite `step_completed` solo cuando el step pasa de incompleto a completo (no en re-saves del mismo step ya completado).
- [ ] Analytics emite `activated` en éxito de activate mutation.
- [ ] Analytics emite `abandoned` al salir del wizard con `configuration_complete=false`.
- [ ] Unit tests: handler updated/activated; analytics no duplica `step_completed` en re-save.
- [ ] E2E: dos pestañas, completar step en una, verificar reconcile en la otra.

## Done summary

_Pending implementation._

## Evidence

_Pending implementation._
