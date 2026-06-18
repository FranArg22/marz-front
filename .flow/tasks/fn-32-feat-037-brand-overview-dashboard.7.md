# fn-32-feat-037-brand-overview-dashboard.7 TopVideosTable + TopCreatorsTable

## Description

> ESTA TAREA REQUIERE MIRAR EL DISEÑO — node_ids: `kgQTT` (TopVideosTable light), `K70kP` (TopVideosTable dark), `H6aldM` (TopCreatorsTable light), `gvzTo` (TopCreatorsTable dark)

Dos tablas con top 5 videos y top 5 creators. Sort por dropdown que escribe en search params.

Antes de implementar, leer el diseño:
```
pencil interactive --in marz-docs/features/FEAT-037-brand-overview-dashboard/feat37.pen --out /tmp/marz-feat037-read.pen
pencil > batch_get({ nodeIds: ["kgQTT", "H6aldM"], readDepth: 3, resolveVariables: true })
pencil > export_nodes({ nodeIds: ["kgQTT", "H6aldM"], outputDir: "/tmp", format: "png" })
pencil > exit()
```

## Tipos del API (ya generados)

```ts
// TopVideos
interface DashboardTopVideosResponse {
  range: DashboardRangeMeta
  sort_by: string
  videos: DashboardTopVideo[]
}

interface DashboardTopVideo {
  video_link_id: string
  platform: DashboardTopVideoPlatform  // 'instagram'|'tiktok'|'youtube'
  thumbnail_url: string | null
  title: string | null
  video_url: string
  creator: DashboardTopVideoCreatorRef  // { account_id, handle, avatar_url }
  metrics: {
    views: number
    likes: number
    comments: number
    engagement_rate: number
    cpm: number
  }
  published_at: string  // date ISO
}

// TopCreators
interface DashboardTopCreatorsResponse {
  range: DashboardRangeMeta
  sort_by: string
  creators: DashboardTopCreator[]
}

interface DashboardTopCreator {
  account_id: string
  handle: string
  avatar_url: string | null
  country: string | null
  metrics: {
    videos: number
    views: number
    spend: number
    spend_display: string
    cpm: number
    engagement_rate: number
  }
}
```

## Archivos a crear

### `src/features/analytics/dashboard/TopVideosTable.tsx`

```tsx
interface TopVideosTableProps {
  data: DashboardTopVideosResponse | undefined
  isLoading: boolean
  isError: boolean
  currentSort: 'views' | 'cpm' | 'engagement'
  onSortChange: (sort: 'views' | 'cpm' | 'engagement') => void
}
```

Columnas de la tabla (fijas, la columna de métrica se destaca según el sort):
- Thumbnail (imagen o ícono de plataforma si `thumbnail_url=null`)
- Creator (avatar + handle)
- Plataforma (ícono)
- Vistas (`metrics.views`)
- CPM (`metrics.cpm` formateado)
- Engagement (`metrics.engagement_rate` como `3,4%`)
- Fecha publicación (`published_at`)

Sort dropdown arriba de la tabla. Opciones: `Vistas`, `CPM`, `Engagement`. NO incluye `Gasto` (divergencia con spec original — no implementar).

Filas no clickeables. Enlace "Ver todos" abajo navega a `/analytics/videos`. Si esta ruta no existe aún, usar `<span>` con estado deshabilitado.

Si `data.videos.length === 0` → placeholder `<div data-testid="top-videos-empty" />` (EmptyBlockState en task 8).
Si `isLoading=true` → 5 filas skeleton.
Si `isError=true` → placeholder `<div data-testid="top-videos-error" />`.

Conectar en `DashboardPage`:
```tsx
<TopVideosTable
  data={topVideosQuery.data?.status === 200 ? topVideosQuery.data.data : undefined}
  isLoading={topVideosQuery.isPending}
  isError={topVideosQuery.isError}
  currentSort={search.top_videos_sort}
  onSortChange={(sort) => navigate({ search: prev => ({ ...prev, top_videos_sort: sort }) })}
/>
```

Formateo de números: hoist `Intl.NumberFormat` a módulo scope:
```ts
const NUMBER_FMT = new Intl.NumberFormat('es-AR')
const PERCENT_FMT = new Intl.NumberFormat('es-AR', { style: 'percent', maximumFractionDigits: 1 })
```

### `src/features/analytics/dashboard/TopCreatorsTable.tsx`

```tsx
interface TopCreatorsTableProps {
  data: DashboardTopCreatorsResponse | undefined
  isLoading: boolean
  isError: boolean
  currentSort: 'views' | 'videos' | 'cpm' | 'engagement'
  onSortChange: (sort: 'views' | 'videos' | 'cpm' | 'engagement') => void
}
```

Columnas:
- Avatar + handle
- País (`country` o "—")
- Videos (`metrics.videos`)
- Vistas (`metrics.views`)
- Gasto (`metrics.spend_display`)
- CPM (`metrics.cpm`)
- Engagement (`metrics.engagement_rate`)

La columna de métrica activa según `currentSort` se puede resaltar (ver diseño).

Sort dropdown: `Vistas`, `Videos`, `CPM`, `Engagement`.

Enlace "Ver todos" → `/analytics/creators` (mismo criterio que TopVideosTable).

Conectar en `DashboardPage`:
```tsx
<TopCreatorsTable
  data={topCreatorsQuery.data?.status === 200 ? topCreatorsQuery.data.data : undefined}
  isLoading={topCreatorsQuery.isPending}
  isError={topCreatorsQuery.isError}
  currentSort={search.top_creators_sort}
  onSortChange={(sort) => navigate({ search: prev => ({ ...prev, top_creators_sort: sort }) })}
/>
```

## Tests

`src/features/analytics/dashboard/TopVideosTable.test.tsx`:
- `isLoading=true` → 5 skeletons.
- `data` con 3 videos → 3 filas renderizadas con handles correctos.
- Sort por CPM → `onSortChange('cpm')` llamado al hacer click.
- `videos=[]` → placeholder empty.
- A11y: header de tabla comunica ordenamiento activo.

`src/features/analytics/dashboard/TopCreatorsTable.test.tsx`:
- `isLoading=true` → 5 skeletons.
- `data` con 2 creators → 2 filas.
- Sort por Engagement → `onSortChange('engagement')` llamado.

## Acceptance

- [ ] `TopVideosTable`: sort dropdown con opciones `Vistas/CPM/Engagement` (sin Gasto).
- [ ] Cambiar sort → URL actualiza `top_videos_sort`, query refetch.
- [ ] `TopCreatorsTable`: sort dropdown con `Vistas/Videos/CPM/Engagement`.
- [ ] Ambas tablas: loading → 5 skeletons; vacío → placeholder; error → placeholder.
- [ ] Filas no son clickeables (solo "Ver todos" navega).
- [ ] Visual ≥95% vs nodos `kgQTT`, `K70kP`, `H6aldM`, `gvzTo`.
- [ ] `pnpm typecheck && pnpm vitest run src/features/analytics/dashboard/TopVideos src/features/analytics/dashboard/TopCreators` pasan.
- Verify: `pnpm typecheck && pnpm vitest run src/features/analytics/dashboard/TopVideos`

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
