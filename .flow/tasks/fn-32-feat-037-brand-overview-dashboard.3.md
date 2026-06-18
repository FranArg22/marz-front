# fn-32-feat-037-brand-overview-dashboard.3 DashboardPage shell + DashboardFilters + DateRangePicker

## Description

> ESTA TAREA REQUIERE MIRAR EL DISEÑO — node_ids: `H5Yuuv` (DashboardPage light), `G3Z5R1` (DashboardPage dark), `QNRor` (DashboardFilters light), `jE0OQ` (DashboardFilters dark), `QEyQD` (DateRangePicker light), `doRjU` (DateRangePicker dark)

Implementar el orquestador `DashboardPage` y la barra de filtros superior. Los filtros escriben en search params (URL), no en Zustand.

Antes de implementar, leer el diseño:
```
pencil interactive --in marz-docs/features/FEAT-037-brand-overview-dashboard/feat37.pen --out /tmp/marz-feat037-read.pen
pencil > batch_get({ nodeIds: ["H5Yuuv", "QNRor", "QEyQD"], readDepth: 3, resolveVariables: true })
pencil > export_nodes({ nodeIds: ["H5Yuuv", "QNRor", "QEyQD"], outputDir: "/tmp", format: "png" })
pencil > exit()
```

## Archivos a crear

### `src/features/analytics/dashboard/DashboardPage.tsx`

Reemplaza el `DashboardPagePlaceholder` creado en la task anterior. Actualizar `src/routes/_brand/inicio.tsx` para importar y usar `DashboardPage` en lugar del placeholder.

Responsabilidades:
- Leer todos los search params via `Route.useSearch()` (importando el tipo `DashboardSearch` de `src/routes/_brand/inicio.tsx`).
- Construir params para cada query y dispararlas en paralelo.
- Por ahora renderiza `<DashboardFilters />` y placeholders `<div data-testid="...">` para cada bloque (metrics-grid, chart, checklist, top-videos, top-creators). Las tasks siguientes reemplazan esos divs.

Mapping search params → query params comunes (los keys con `[]` matchean los tipos generados por Orval):
```ts
const commonParams = {
  'campaign_ids[]': search.campaign_ids?.length ? search.campaign_ids : undefined,
  'creator_ids[]': search.creator_ids?.length ? search.creator_ids : undefined,
  'platforms[]': search.platforms?.length ? search.platforms : undefined,
  'countries[]': search.countries?.length ? search.countries : undefined,
  status: search.status !== 'all' ? search.status : undefined,
  range_preset: search.range_preset,
  range_start: search.range_start,
  range_end: search.range_end,
}
```

Params específicos por query:
```ts
// Cards: solo filtros comunes
const cardsParams = commonParams

// Chart: filtros comunes + series y agrupación
const chartParams = {
  ...commonParams,
  'series[]': search.chart_series,
  grouping: search.chart_grouping,
}

// Top Videos: filtros comunes + sort
const topVideosParams = {
  ...commonParams,
  sort_by: search.top_videos_sort,
}

// Top Creators: filtros comunes + sort
const topCreatorsParams = {
  ...commonParams,
  sort_by: search.top_creators_sort,
}
```

Hooks (en `src/shared/api/generated/analytics/analytics.ts`):
```tsx
const cardsQuery = useGetAnalyticsDashboardCards(cardsParams, { query: { staleTime: 60_000 } })
const chartQuery = useGetAnalyticsDashboardChart(chartParams, { query: { staleTime: 300_000 } })
const topVideosQuery = useGetAnalyticsDashboardTopVideos(topVideosParams, { query: { staleTime: 300_000 } })
const topCreatorsQuery = useGetAnalyticsDashboardTopCreators(topCreatorsParams, { query: { staleTime: 300_000 } })
const checklistQuery = useGetAnalyticsDashboardOnboardingChecklist({ query: { staleTime: 600_000 } })
```

### `src/features/analytics/dashboard/DashboardFilters.tsx`

Barra de filtros. Escribe en search params via `useNavigate()` con `{ search: (prev) => ({ ...prev, campaign_ids: [...] }) }`.

Filtros a implementar:
- **Campañas** — multi-select combobox. Opciones: cargar con `useListCampaigns` del hook generado en `src/shared/api/generated/campaigns/campaigns.ts`. Mostrar `campaign.name` como label, usar `campaign.id` como valor.
- **Creadores** — multi-select combobox. Opciones: cargar dinámicamente si hay endpoint de listado, o dejar vacío con búsqueda manual (el filtro acepta UUIDs via URL).
- **Plataforma** — multi-select chips o combobox. Opciones fijas: `Instagram`, `TikTok`, `YouTube`. Label en UI: "Plataforma" (no "Tipo de contenido" como dice el `.pen` — corrección de diseño confirmada).
- **País** — multi-select combobox. Opciones: lista fija de los países más comunes de LATAM + ES.
- **Estado** — select único. Opciones: `Activos` (`active`), `Inactivos` (`inactive`), `Todos` (`all`). Default `active`.
- **Botón "Limpiar filtros"** — resetea todos los filtros a sus defaults: `campaign_ids: [], creator_ids: [], platforms: [], countries: [], status: 'active'`.

Cada cambio llama `navigate({ search: (prev) => ({ ...prev, <campo>: nuevoValor }) })` sin recargar la página.

### `src/features/analytics/dashboard/DashboardDateRangePicker.tsx`

Chip/selector de rango temporal. Escribe `range_preset`, `range_start`, `range_end` en search params.

Presets: `7d` ("Últimos 7 días"), `14d` ("Últimos 14 días"), `30d` ("Últimos 30 días"), `custom` ("Personalizado").

Plan free: deshabilita `14d`, `30d`, `custom`. Detectar plan con:
```ts
import { useBrandSession } from '#/features/identity/session/BrandSessionContext'
import { getWorkspacePlan } from '#/features/offers/utils/workspacePlan'
// ...
const { brandWorkspace } = useBrandSession()
const isFreePlan = getWorkspacePlan(brandWorkspace.plan) === 'free'
```

Custom: mostrar dos date inputs (`range_start`, `range_end` en formato `YYYY-MM-DD`).

## Tests

`src/features/analytics/dashboard/DashboardFilters.test.tsx`:
- Cambiar plataforma → URL actualiza `platforms`.
- Botón "Limpiar filtros" → URL vuelve a defaults (campaign_ids vacío, status='active', etc.).
- A11y: filtros son combobox con role correcto.

`src/features/analytics/dashboard/DashboardDateRangePicker.test.tsx`:
- `plan=free` → opciones 14d/30d/custom deshabilitadas, 7d habilitada.
- Seleccionar preset `30d` → URL actualiza `range_preset=30d`.
- Seleccionar `custom` + ingresar fechas → URL actualiza `range_start` + `range_end`.

## Acceptance

- [ ] Cambiar filtro → URL se actualiza sin full-page reload.
- [ ] Botón "Limpiar filtros" → URL vuelve a defaults.
- [ ] Plan free → solo preset `7d` habilitado.
- [ ] Preset `custom` → inputs de fecha se muestran y escriben en URL.
- [ ] `DashboardPage` dispara las 5 queries en paralelo (verificar en DevTools Network que salen simultáneamente).
- [ ] Params de chart incluyen `series[]` y `grouping` del URL.
- [ ] Params de top-videos/top-creators incluyen `sort_by` del URL.
- [ ] A11y: filtros tienen roles semánticos correctos.
- [ ] Visual ≥95% vs nodos `H5Yuuv`, `QNRor`, `QEyQD`.
- [ ] `pnpm typecheck && pnpm vitest run src/features/analytics/dashboard` pasan.
- Verify: `pnpm typecheck && pnpm vitest run src/features/analytics/dashboard`

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs: