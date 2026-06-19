import { useState } from 'react'
import type { ReactNode } from 'react'
import { Info } from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DotItemDotProps, TooltipContentProps } from 'recharts'

import {
  Tooltip as UiTooltip,
  TooltipContent as UiTooltipContent,
  TooltipTrigger as UiTooltipTrigger,
} from '#/components/ui/tooltip'
import type { ChartSeries } from './ChartSeriesChips'
import type { DashboardChartBucket } from '#/shared/api/generated/model/dashboardChartBucket'
import type { DashboardChartResponse } from '#/shared/api/generated/model/dashboardChartResponse'

import { EmptyBlockState } from './EmptyBlockState'
import { ErrorBlockState } from './ErrorBlockState'

interface PerformanceChartProps {
  data: DashboardChartResponse | undefined
  isLoading: boolean
  isError: boolean
  activeSeries: ChartSeries[]
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

const SERIES_COLORS = ['#3ECF8E', '#94a3b8'] as const

export function PerformanceChart({
  data,
  isLoading,
  isError,
  activeSeries,
  onRetry,
  onClear,
}: PerformanceChartProps) {
  const visibleSeries = activeSeries.slice(0, 2)
  const rows = data?.buckets.map(toChartRow) ?? []
  const [hoveredRow, setHoveredRow] = useState<ChartRow | null>(null)

  if (isLoading) {
    return (
      <section className="h-[304px] rounded-3xl border border-border bg-card p-5 shadow-[0_12px_28px_-18px_rgba(0,0,0,0.35)]">
        <div
          data-testid="chart-skeleton"
          className="h-full animate-pulse rounded-2xl bg-muted"
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
      </div>

      <div className="relative min-h-0 flex-1" data-testid="chart-plot">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={240}
          minHeight={210}
          initialDimension={{ width: 900, height: 210 }}
        >
          <LineChart
            data={rows}
            margin={{ top: 8, right: 10, bottom: 0, left: 0 }}
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
              tickFormatter={formatDate}
              tick={{ fill: '#A1A1AA', fontSize: 11, fontFamily: 'Geist Mono' }}
            />
            <YAxis
              yAxisId="left"
              tickLine={false}
              axisLine={false}
              width={40}
              tick={{ fill: '#71717A', fontSize: 11, fontFamily: 'Geist Mono' }}
            />
            {visibleSeries[1] ? (
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                width={40}
                tick={{
                  fill: '#71717A',
                  fontSize: 11,
                  fontFamily: 'Geist Mono',
                }}
              />
            ) : null}
            <Tooltip
              content={(props) => <ChartTooltip {...props} />}
              cursor={{ stroke: '#A1A1AA', strokeDasharray: '4 4' }}
              isAnimationActive={false}
            />
            {visibleSeries.map((series, index) => (
              <Line
                key={series}
                type="monotone"
                dataKey={series}
                name={SERIES_LABELS[series]}
                yAxisId={index === 0 ? 'left' : 'right'}
                stroke={getSeriesColor(index)}
                strokeWidth={3}
                dot={(props) => (
                  <SeriesDot
                    {...props}
                    series={series}
                    color={getSeriesColor(index)}
                    onHover={setHoveredRow}
                  />
                )}
                activeDot={{
                  r: 5,
                  strokeWidth: 2,
                  stroke: 'var(--card)',
                  fill: getSeriesColor(index),
                }}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        {hoveredRow ? (
          <div className="pointer-events-none absolute right-2 top-2 z-10">
            <ChartTooltipBody row={hoveredRow} series={visibleSeries} />
          </div>
        ) : null}
      </div>

      <div className="flex h-[18px] items-center gap-4">
        {visibleSeries.map((series, index) => (
          <div key={series} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="size-2.5 rounded-full"
              style={{ backgroundColor: getSeriesColor(index) }}
            />
            <span className="text-[11px] text-muted-foreground">
              {SERIES_LABELS[series]}
            </span>
          </div>
        ))}
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

function getSeriesColor(index: number): string {
  return index === 0 ? SERIES_COLORS[0] : SERIES_COLORS[1]
}

function ChartTooltipBody({
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

function SeriesDot({
  cx,
  cy,
  payload,
  series,
  color,
  onHover,
}: DotItemDotProps & {
  payload?: ChartRow
  series: ChartSeries
  color: string
  onHover: (row: ChartRow | null) => void
}) {
  if (typeof cx !== 'number' || typeof cy !== 'number') return null

  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill={color}
      stroke="var(--card)"
      strokeWidth={2}
      data-testid={`chart-point-${series}`}
      onMouseEnter={() => onHover(payload ?? null)}
      onMouseLeave={() => onHover(null)}
    />
  )
}
