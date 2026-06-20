import type { ReactNode } from 'react'
import { Info } from 'lucide-react'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TooltipContentProps } from 'recharts'

import {
  Tooltip as UiTooltip,
  TooltipContent as UiTooltipContent,
  TooltipTrigger as UiTooltipTrigger,
} from '#/components/ui/tooltip'
import { ChartConfigPopover } from './ChartConfigPopover'
import type { ChartGrouping } from './ChartConfigPopover'
import { ChartSeriesChips } from './ChartSeriesChips'
import type { ChartSeries } from './ChartSeriesChips'
import type { DashboardSearch } from '#/routes/_brand/inicio'
import type { DashboardChartBucket } from '#/shared/api/generated/model/dashboardChartBucket'
import type { DashboardChartResponse } from '#/shared/api/generated/model/dashboardChartResponse'

import { EmptyBlockState } from './EmptyBlockState'
import { ErrorBlockState } from './ErrorBlockState'

interface PerformanceChartProps {
  data: DashboardChartResponse | undefined
  isLoading: boolean
  isError: boolean
  activeSeries: ChartSeries[]
  onSeriesChange: (series: ChartSeries[]) => void
  grouping: ChartGrouping
  rangePreset: DashboardSearch['range_preset']
  onGroupingChange: (grouping: ChartGrouping) => void
  onRetry: () => void
  onClear: () => void
}

type ChartRow = {
  bucket_start: string
  bucket: DashboardChartBucket
  oferta?: number
  vistas?: number
  gasto?: number
}

const DATE_FORMATTER = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: 'short',
})

const SERIES_LABELS: Record<ChartSeries, string> = {
  oferta: 'Oferta',
  vistas: 'Vistas',
  gasto: 'Gasto',
}

// Canonical order for bars, badges and legend.
const SERIES_ORDER: ChartSeries[] = ['oferta', 'vistas', 'gasto']

// Vistas renders as the line crossing the bars; oferta and gasto are bars.
const LINE_SERIES: ChartSeries = 'vistas'

// Vistas is the amber line; Oferta + Gasto are translucent bars (green + grey).
const SERIES_COLORS: Record<ChartSeries, string> = {
  oferta: '#3ECF8E',
  vistas: '#F59E0B',
  gasto: '#A1A1AA',
}

// Two labeled axes like the design: Vistas (quantities) on the left, Gasto
// (money) on the right. Oferta keeps its own hidden axis so its small bars stay
// visible without cluttering the scale.
const AXIS_ORIENTATION: Record<ChartSeries, 'left' | 'right'> = {
  oferta: 'right',
  vistas: 'left',
  gasto: 'right',
}
const AXIS_HIDDEN: Record<ChartSeries, boolean> = {
  oferta: true,
  vistas: false,
  gasto: false,
}

export function formatCountAxis(value: number): string {
  if (value >= 1_000_000) return `${formatCompact(value / 1_000_000)}M`
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`
  return String(Math.round(value))
}

export function formatMoneyAxis(value: number): string {
  if (value >= 1_000) return `$${formatCompact(value / 1_000)}k`
  return `$${Math.round(value)}`
}

function formatCompact(value: number): string {
  const rounded = Number(value.toFixed(1))
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

function getSeriesMax(rows: ChartRow[]): Record<ChartSeries, number> {
  return SERIES_ORDER.reduce(
    (acc, series) => {
      acc[series] = Math.max(0, ...rows.map((row) => row[series] ?? 0))
      return acc
    },
    { oferta: 0, vistas: 0, gasto: 0 } as Record<ChartSeries, number>,
  )
}

export function getSeriesDomain(
  series: ChartSeries,
  maxValue: number,
): [number, number] {
  if (series === 'oferta') return [0, Math.max(1, Math.ceil(maxValue))]
  return [0, getPaddedDomainMax(maxValue)]
}

function getPaddedDomainMax(maxValue: number): number {
  if (maxValue <= 0) return 1
  const padded = maxValue * 1.12
  const magnitude = 10 ** Math.max(0, Math.floor(Math.log10(padded)) - 1)
  return Math.ceil(padded / magnitude) * magnitude
}

export function getDateTickInterval(
  rangePreset: DashboardSearch['range_preset'],
) {
  return rangePreset === '30d' ? 1 : 0
}

export function PerformanceChart({
  data,
  isLoading,
  isError,
  activeSeries,
  onSeriesChange,
  grouping,
  rangePreset,
  onGroupingChange,
  onRetry,
  onClear,
}: PerformanceChartProps) {
  // Always render in canonical order (oferta, vistas, gasto), filtered by active.
  const visibleSeries = SERIES_ORDER.filter((series) =>
    activeSeries.includes(series),
  )
  const rows = data?.buckets.map(toChartRow) ?? []
  const seriesMax = getSeriesMax(rows)

  if (isLoading) {
    return (
      <section className="flex h-[304px] flex-col gap-3 rounded-3xl border border-border bg-card px-5 py-[18px] shadow-[0_12px_28px_-18px_rgba(0,0,0,0.35)]">
        <div className="flex h-[34px] items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-[15px] w-14 animate-pulse rounded-full bg-muted" />
            <div className="size-[13px] animate-pulse rounded-full bg-muted" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-36 animate-pulse rounded-full bg-muted" />
            <div className="size-8 animate-pulse rounded-full bg-muted" />
          </div>
        </div>
        <div
          data-testid="chart-skeleton"
          className="min-h-0 flex-1 animate-pulse rounded-2xl bg-muted"
        />
      </section>
    )
  }

  if (isError) {
    return (
      <section className="h-[304px] rounded-3xl border border-border bg-card p-5 shadow-[0_12px_28px_-18px_rgba(0,0,0,0.35)]">
        <ErrorBlockState onRetry={onRetry} />
      </section>
    )
  }

  if (!data || rows.length === 0) {
    return (
      <section className="h-[304px] rounded-3xl border border-border bg-card p-5 shadow-[0_12px_28px_-18px_rgba(0,0,0,0.35)]">
        <EmptyBlockState onClear={onClear} />
      </section>
    )
  }

  return (
    <section
      data-testid="performance-chart"
      className="flex h-[304px] flex-col gap-3 rounded-3xl border border-border bg-card px-5 py-[18px] text-card-foreground shadow-[0_12px_28px_-18px_rgba(0,0,0,0.35)]"
    >
      <div className="flex h-[34px] items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-semibold leading-none text-foreground">
            Metrics
          </h2>
          <UiTooltip>
            <UiTooltipTrigger asChild>
              <button
                type="button"
                className="text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Información del gráfico"
              >
                <Info className="size-[13px]" aria-hidden="true" />
              </button>
            </UiTooltipTrigger>
            <UiTooltipContent>
              Performance temporal del período.
            </UiTooltipContent>
          </UiTooltip>
        </div>
        <div className="flex items-center gap-2">
          <ChartSeriesChips
            activeSeries={activeSeries}
            onChange={onSeriesChange}
          />
          <ChartConfigPopover
            currentGrouping={grouping}
            currentPreset={rangePreset}
            onChange={onGroupingChange}
          />
        </div>
      </div>

      <div className="relative min-h-0 flex-1" data-testid="chart-plot">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={240}
          minHeight={210}
          initialDimension={{ width: 900, height: 210 }}
        >
          <ComposedChart
            data={rows}
            margin={{ top: 8, right: 4, bottom: 0, left: 4 }}
            barGap={4}
            barCategoryGap="24%"
            accessibilityLayer
          >
            <CartesianGrid
              vertical={false}
              stroke="currentColor"
              className="text-border"
            />
            <XAxis
              dataKey="bucket_start"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              interval={getDateTickInterval(rangePreset)}
              minTickGap={0}
              tickFormatter={formatDate}
              tick={{ fill: '#A1A1AA', fontSize: 11, fontFamily: 'Geist Mono' }}
            />
            {visibleSeries.map((series) => (
              <YAxis
                key={series}
                yAxisId={series}
                orientation={AXIS_ORIENTATION[series]}
                hide={AXIS_HIDDEN[series]}
                domain={getSeriesDomain(series, seriesMax[series])}
                tickCount={5}
                width={46}
                tickLine={false}
                axisLine={false}
                tickFormatter={
                  series === 'gasto' ? formatMoneyAxis : formatCountAxis
                }
                tick={{
                  fill: '#71717A',
                  fontSize: 11,
                  fontFamily: 'Geist Mono',
                }}
              />
            ))}
            <Tooltip
              content={(props) => <ChartTooltip {...props} />}
              cursor={{ fill: '#A1A1AA1A' }}
              isAnimationActive={false}
            />
            {visibleSeries
              .filter((series) => series !== LINE_SERIES)
              .map((series) => (
                <Bar
                  key={series}
                  dataKey={series}
                  name={SERIES_LABELS[series]}
                  yAxisId={series}
                  fill={SERIES_COLORS[series]}
                  fillOpacity={0.45}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                  isAnimationActive
                  animationDuration={260}
                  animationEasing="ease-out"
                />
              ))}
            {visibleSeries.includes(LINE_SERIES) ? (
              <Line
                type="monotone"
                dataKey={LINE_SERIES}
                name={SERIES_LABELS[LINE_SERIES]}
                yAxisId={LINE_SERIES}
                stroke={SERIES_COLORS[LINE_SERIES]}
                strokeWidth={3}
                dot={{ r: 3, fill: SERIES_COLORS[LINE_SERIES], strokeWidth: 0 }}
                activeDot={{
                  r: 5,
                  strokeWidth: 2,
                  stroke: 'var(--card)',
                  fill: SERIES_COLORS[LINE_SERIES],
                }}
                connectNulls
                isAnimationActive
                animationDuration={320}
                animationEasing="ease-out"
              />
            ) : null}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

function toChartRow(bucket: DashboardChartBucket): ChartRow {
  return {
    bucket_start: bucket.bucket_start,
    bucket,
    oferta: bucket.oferta?.value,
    vistas: bucket.vistas?.value,
    gasto: bucket.gasto?.value,
  }
}

function formatDate(value: string): string {
  return DATE_FORMATTER.format(new Date(value)).replace('.', '')
}

function ChartTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload.length) return null

  const row = payload[0]?.payload as ChartRow | undefined
  if (!row) return null

  return (
    <ChartTooltipBody
      row={row}
      label={typeof label === 'string' ? formatDate(label) : label}
      series={payload.map((item) => item.dataKey as ChartSeries)}
    />
  )
}

export function ChartTooltipBody({
  row,
  label = formatDate(row.bucket_start),
  series,
}: {
  row: ChartRow
  label?: ReactNode
  series: ChartSeries[]
}) {
  return (
    <div className="min-w-48 rounded-2xl border border-border bg-popover p-3 text-popover-foreground shadow-lg">
      <p className="mb-2 font-mono text-xs font-semibold text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-col gap-2">
        {series.map((item) => (
          <div key={item} className="text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="font-medium">{SERIES_LABELS[item]}</span>
              <span className="font-mono font-semibold">
                {formatSeriesValue(item, row)}
              </span>
            </div>
            {item === 'oferta' && row.bucket.oferta?.offers.length ? (
              <ul className="mt-1 flex flex-col gap-1 text-xs text-muted-foreground">
                {row.bucket.oferta.offers.map((offer) => (
                  <li key={offer.id}>
                    {offer.creator_handle} - {offer.campaign_name}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

function formatSeriesValue(series: ChartSeries, row: ChartRow): string {
  if (series === 'gasto') {
    return row.bucket.gasto?.display ?? String(row.gasto ?? 0)
  }

  return String(row[series] ?? 0)
}
