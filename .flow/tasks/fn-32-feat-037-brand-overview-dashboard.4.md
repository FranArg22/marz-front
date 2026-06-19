# fn-32-feat-037-brand-overview-dashboard.4 MetricsGrid + MetricCard

## Description

> ESTA TAREA REQUIERE MIRAR EL DISEÑO — node_ids: `x8HBBg` (MetricsGrid light), `zpdxq` (MetricsGrid dark), `k0HQZ` (MetricCard instancia "Videos publicados" light), `j5AEgB` (MetricCard dark)

Grilla 4×2 de métricas con delta híbrido. Orden fijo del diseño; sin drag-and-drop.

Antes de implementar, leer el diseño:
```
pencil interactive --in marz-docs/features/FEAT-037-brand-overview-dashboard/feat37.pen --out /tmp/marz-feat037-read.pen
pencil > batch_get({ nodeIds: ["x8HBBg", "k0HQZ"], readDepth: 3, resolveVariables: true })
pencil > export_nodes({ nodeIds: ["x8HBBg", "k0HQZ"], outputDir: "/tmp", format: "png" })
pencil > exit()
```

## Tipos del API (ya generados)

```ts
// src/shared/api/generated/model/dashboardCard.ts
interface DashboardCard {
  key: DashboardCardKey  // 'videos_published'|'creators_activated'|'views'|'spend'|'likes'|'comments'|'engagement'|'cpm'
  type: DashboardCardType  // 'cumulative'|'flow'|'derived_cumulative'|'derived_flow'
  current_value: number
  current_display: string  // "1.2M", "$45.300", "3,4%"
  delta: DashboardCardDelta
}

interface DashboardCardDelta {
  kind: DashboardCardDeltaKind  // 'intra_window'|'vs_previous_period'
  value: number
  display: string   // "+44k", "+1,5%"
  tooltip: string   // texto completo, pre-formateado por el backend
  direction: DashboardCardDeltaDirection  // 'positive'|'negative'|'neutral'
  has_comparison: boolean
}
```

## Archivos a crear

### `src/features/analytics/dashboard/MetricsGrid.tsx`

Recibe `data: DashboardCardsResponse | undefined` + `isLoading: boolean` + `isError: boolean`.

Renderiza grilla 4×2 con 8 `MetricCard`. Orden fijo según el diseño:
1. Videos publicados (`videos_published`)
2. Creadores activados (`creators_activated`)
3. Vistas (`views`)
4. Gasto Total (`spend`)
5. Likes (`likes`)
6. Comentarios (`comments`)
7. Engagement (`engagement`)
8. CPM (`cpm`)

Si `isLoading=true`: skeleton por card (8 skeletons con las mismas dimensiones que una MetricCard).  
Si `isError=true`: placeholder `<div data-testid="metrics-grid-error" />` — el `ErrorBlockState` real se pone en la task 8.  
Si `data` undefined y no loading/error: mismos skeletons.

Conectar con `DashboardPage`: en `DashboardPage.tsx`, reemplazar el `<div data-testid="metrics-grid">` por `<MetricsGrid data={cardsQuery.data?.status === 200 ? cardsQuery.data.data : undefined} isLoading={cardsQuery.isPending} isError={cardsQuery.isError} />`.

### `src/features/analytics/dashboard/MetricCard.tsx`

```tsx
interface MetricCardProps {
  card: DashboardCard
}
```

Renderiza:
- Título: label de la métrica (ver mapping abajo). Usar lingui `t` para i18n.
- Valor principal: `card.current_display` — número grande.
- Badge de delta: `card.delta.display` con color según `card.delta.direction`:
  - `positive` → color success (token semántico, e.g. `text-green-600` o el token del DS).
  - `negative` → color danger (e.g. `text-red-600`).
  - `neutral` → sin color (muted).
  - Si `card.delta.has_comparison === false` → badge muestra `—` (guión largo).
- Tooltip on-hover sobre el badge: muestra `card.delta.tooltip`. Si `has_comparison=false` → mostrar "Sin datos del período anterior para comparar".
- Ícono de info (i): presente en las 8 cards (corrección de diseño — no está en el `.pen`). Tooltip on-hover muestra la definición de la métrica. Copys del ícono info por key (usar lingui `t` para cada string).

Mapping `DashboardCardKey` → label. Usar `t` de `@lingui/core/macro` (patrón del proyecto, ver `navigation.ts`):
```ts
import { t } from '@lingui/core/macro'

function getCardLabel(key: DashboardCardKey): string {
  const labels: Record<DashboardCardKey, () => string> = {
    videos_published: () => t`Videos publicados`,
    creators_activated: () => t`Creadores activados`,
    views: () => t`Vistas`,
    spend: () => t`Gasto Total`,
    likes: () => t`Likes`,
    comments: () => t`Comentarios`,
    engagement: () => t`Engagement`,
    cpm: () => t`CPM`,
  }
  return labels[key]()
}
```

Mapping `DashboardCardKey` → info tooltip (también con `t`):
```ts
function getCardInfoTooltip(key: DashboardCardKey): string {
  const tooltips: Record<DashboardCardKey, () => string> = {
    videos_published: () => t`Cantidad de videos publicados por los creators en el período.`,
    creators_activated: () => t`Creators con al menos una oferta aceptada en el período.`,
    views: () => t`Suma de vistas acumuladas de todos los videos al fin del período.`,
    spend: () => t`Suma de pagos efectuados a creators en el período.`,
    likes: () => t`Suma de likes acumulados de todos los videos al fin del período.`,
    comments: () => t`Suma de comentarios acumulados de todos los videos al fin del período.`,
    engagement: () => t`Ratio (likes + comentarios) / vistas, al fin del período.`,
    cpm: () => t`Costo por mil vistas: gasto del período / vistas del período × 1000.`,
  }
  return tooltips[key]()
}
```

Reglas:
- Headings con `font-semibold` (regla del repo).
- Los copys del tooltip de delta vienen del backend (`card.delta.tooltip`). No hardcodear el texto.
- Los copys del ícono info se definen en el front con `t` (son del glosario, necesitan i18n).
- No usar `Date.now()` ni `new Date()` en render.
- No usar index como React key si se renderizan listas internas.

## Tests

`src/features/analytics/dashboard/MetricCard.test.tsx`:
- `direction=positive` → badge con clase/color correcto.
- `direction=negative` → badge con clase/color correcto.
- `has_comparison=false` → badge muestra `—`, tooltip dice "Sin datos del período anterior para comparar".
- `has_comparison=true` → tooltip muestra `card.delta.tooltip` del mock.
- Hover sobre ícono info → tooltip con la definición correcta para `key=views`.

`src/features/analytics/dashboard/MetricsGrid.test.tsx`:
- `isLoading=true` → 8 skeletons visibles.
- `data` presente → 8 cards renderizadas con las labels correctas.

## Acceptance

- [ ] 8 cards en grilla 4×2 con orden fijo del diseño.
- [ ] Badge de delta con color correcto según `direction` (positive/negative/neutral).
- [ ] `has_comparison=false` → badge `—`, tooltip fijo.
- [ ] Tooltip on-hover badge → muestra `card.delta.tooltip` del backend.
- [ ] Ícono info presente → tooltip con definición de la métrica.
- [ ] Loading → 8 skeletons.
- [ ] Labels y tooltips info usan lingui `t` (verificar con `pnpm i18n:extract` que extrae las keys).
- [ ] Visual ≥95% vs nodos `x8HBBg` y `k0HQZ`.
- [ ] `pnpm typecheck && pnpm vitest run src/features/analytics/dashboard/MetricCard src/features/analytics/dashboard/MetricsGrid` pasan.
- Verify: `pnpm typecheck && pnpm vitest run src/features/analytics/dashboard/MetricCard`

## Done summary
Implemented fn-32-feat-037-brand-overview-dashboard.4; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: