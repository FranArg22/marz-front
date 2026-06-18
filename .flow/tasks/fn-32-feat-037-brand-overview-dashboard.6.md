# fn-32-feat-037-brand-overview-dashboard.6 PerformanceChart + ChartSeriesChips + ChartConfigPopover

## Description

> ESTA TAREA REQUIERE MIRAR EL DISEÑO — node_ids: `XbKMV` (PerformanceChart light), `SxHHl` (PerformanceChart dark), `jXJIo` (ChartSeriesChips light), `PFqXX` (ChartSeriesChips dark), `pPBH7` (ChartConfigPopover light), `KrBMm` (ChartConfigPopover dark)

Gráfico de performance temporal con hasta 2 series y 2 ejes Y. Instalar `recharts` (no está en el proyecto).

Antes de implementar, leer el diseño:
```
pencil interactive --in marz-docs/features/FEAT-037-brand-overview-dashboard/feat37.pen --out /tmp/marz-feat037-read.pen
pencil > batch_get({ nodeIds: ["XbKMV", "jXJIo", "pPBH7"], readDepth: 3, resolveVariables: true })
pencil > export_nodes({ nodeIds: ["XbKMV", "jXJIo", "pPBH7"], outputDir: "/tmp", format: "png" })
pencil > exit()
```

## Instalación

```bash
pnpm add recharts
pnpm approve-builds  # si recharts tiene build scripts (generalmente no los tiene)
```

Verificar que `pnpm-workspace.yaml` no necesita cambios de `allowBuilds` para recharts.

## Tipos del API (ya generados)

```ts
interface DashboardChartResponse {
  range: DashboardRangeMeta
  grouping: DashboardChartResponseGrouping  // 'day'|'week'|'month'
  buckets: DashboardChartBucket[]
}

interface DashboardChartBucket {
  bucket_start: string  // date ISO
  bucket_end: string    // date ISO
  series: {
    oferta?: DashboardChartSeriesOferta   // { value: number, offers: DashboardChartOfferRef[] }
    vistas?: DashboardChartSeriesVistas   // { value: number }
    gasto?: DashboardChartSeriesGasto     // { value: number, display: string }
  }
}
```

## Archivos a crear

### `src/features/analytics/dashboard/ChartSeriesChips.tsx`

Chips de toggle para las series. Lee y escribe `chart_series[]` en search params.

```tsx
interface ChartSeriesChipsProps {
  activeSeries: ('oferta' | 'vistas' | 'gasto')[]
  onChange: (series: ('oferta' | 'vistas' | 'gasto')[]) => void
}
```

Reglas:
- Tres chips: `Oferta`, `Vistas`, `Gasto`. Set canónico de implementación (el `.pen` muestra chips legacy — no seguir el `.pen` en esto, ver divergencias del design-handoff).
- Máx. 2 simultáneas. Si hay 2 activas → el tercero está `disabled` y no responde a clicks.
- Si hay 1 activa → no se puede deseleccionar (al menos 1 siempre activa).
- A11y: cada chip es un `<button>` con `aria-pressed={isActive}` y `disabled={isDisabled}`.
- Conectar en `DashboardPage` via `navigate({ search: prev => ({ ...prev, chart_series: newSeries }) })`.

### `src/features/analytics/dashboard/ChartConfigPopover.tsx`

Selector de agrupación temporal. Lee y escribe `chart_grouping` en search params.

```tsx
interface ChartConfigPopoverProps {
  currentGrouping: 'day' | 'week' | 'month'
  currentPreset: '7d' | '14d' | '30d' | 'custom'
  onChange: (grouping: 'day' | 'week' | 'month') => void
}
```

Incompatibilidades a deshabilitar:
- `range_preset='7d'` → deshabilitar `month` (incompatible).
- `range_preset='14d'` → deshabilitar `month` (incompatible).
- `range_preset='30d'` → todas habilitadas.
- `range_preset='custom'` → todas habilitadas (el backend valida y devuelve 422 si incompatible).

Renderizar como popover/dropdown con las 3 opciones: `Día`, `Semana`, `Mes`.

### `src/features/analytics/dashboard/PerformanceChart.tsx`

```tsx
interface PerformanceChartProps {
  data: DashboardChartResponse | undefined
  isLoading: boolean
  isError: boolean
  activeSeries: ('oferta' | 'vistas' | 'gasto')[]
}
```

Implementación con Recharts `<ResponsiveContainer>` + `<LineChart>`:
- Eje X: `<XAxis dataKey="bucket_start" />` con fechas. Formatear como `"DD MMM"` (sin librería de fechas extra — usar `Intl.DateTimeFormat` hoistado a módulo scope).
- Dos ejes Y: `<YAxis yAxisId="left">` para serie 1 (la primera activa), `<YAxis yAxisId="right" orientation="right">` para serie 2.
- Una `<Line>` por cada serie activa. Primera serie: color `#3ECF8E`. Segunda serie: color `#94a3b8` (gris).
- `<Tooltip>` customizado que muestra:
  - Para `oferta`: valor + lista de offers del bucket (`bucket.series.oferta?.offers` → `creator_handle + campaign_name`).
  - Para `vistas` y `gasto`: valor + display (gasto: `bucket.series.gasto?.display`).
- Loading → skeleton rectangular con mismas dimensiones.
- Error → placeholder `<div data-testid="chart-error" />` (ErrorBlockState en task 8).
- Sin datos (buckets vacíos) → placeholder `<div data-testid="chart-empty" />` (EmptyBlockState en task 8).

Hoist al scope de módulo (regla del repo):
```ts
const DATE_FORMATTER = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' })
```

Conectar con `DashboardPage`: reemplazar `<div data-testid="chart">` por:
```tsx
<div>
  <div className="...">
    <ChartSeriesChips activeSeries={search.chart_series} onChange={...} />
    <ChartConfigPopover currentGrouping={search.chart_grouping} currentPreset={search.range_preset} onChange={...} />
  </div>
  <PerformanceChart
    data={chartQuery.data?.status === 200 ? chartQuery.data.data : undefined}
    isLoading={chartQuery.isPending}
    isError={chartQuery.isError}
    activeSeries={search.chart_series}
  />
</div>
```

## Tests

`src/features/analytics/dashboard/ChartSeriesChips.test.tsx`:
- Con 2 chips activos → 3er chip disabled.
- No se puede deseleccionar el único chip activo.
- `aria-pressed` correcto en cada chip.

`src/features/analytics/dashboard/ChartConfigPopover.test.tsx`:
- `range_preset='7d'` → opción `Mes` deshabilitada.
- `range_preset='30d'` → todas habilitadas.

`src/features/analytics/dashboard/PerformanceChart.test.tsx`:
- `isLoading=true` → skeleton visible.
- `activeSeries=['oferta']` + data con 5 buckets → 5 puntos en el gráfico (render básico).
- Tooltip de `oferta` muestra los offers del bucket.

## Acceptance

- [ ] Chips `Oferta`, `Vistas`, `Gasto` (no "Videos publicados" del `.pen` antiguo).
- [ ] Máx. 2 series simultáneas: 3er chip se deshabilita.
- [ ] Al menos 1 chip siempre activo.
- [ ] Cambio de serie → URL actualiza `chart_series[]`.
- [ ] Cambio de grouping → URL actualiza `chart_grouping`.
- [ ] `month` deshabilitado con `range_preset=7d` y `range_preset=14d`.
- [ ] Gráfico renderiza con recharts (2 ejes Y, colores correctos).
- [ ] Tooltip on-hover sobre punto de `oferta` lista los offers del bucket.
- [ ] Loading → skeleton; error → placeholder para tarea 8.
- [ ] Visual ≥95% vs nodos `XbKMV`, `jXJIo`, `pPBH7`.
- [ ] `pnpm typecheck && pnpm vitest run src/features/analytics/dashboard/Chart src/features/analytics/dashboard/Performance` pasan.
- Verify: `pnpm typecheck && pnpm vitest run src/features/analytics/dashboard`

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
