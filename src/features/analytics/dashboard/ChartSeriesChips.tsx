import { cn } from '#/lib/utils'

export type ChartSeries = 'oferta' | 'vistas' | 'gasto'

interface ChartSeriesChipsProps {
  activeSeries: ChartSeries[]
  onChange: (series: ChartSeries[]) => void
}

const SERIES_OPTIONS: Array<{
  value: ChartSeries
  label: string
}> = [
  { value: 'oferta', label: 'Oferta' },
  { value: 'vistas', label: 'Vistas' },
  { value: 'gasto', label: 'Gasto' },
]

export function ChartSeriesChips({
  activeSeries,
  onChange,
}: ChartSeriesChipsProps) {
  function toggleSeries(series: ChartSeries) {
    const isActive = activeSeries.includes(series)

    if (isActive) {
      if (activeSeries.length === 1) return
      onChange(activeSeries.filter((item) => item !== series))
      return
    }

    if (activeSeries.length >= 2) return
    onChange([...activeSeries, series])
  }

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Series">
      {SERIES_OPTIONS.map((option) => {
        const isActive = activeSeries.includes(option.value)
        const isDisabled = !isActive && activeSeries.length >= 2

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            disabled={isDisabled}
            onClick={() => toggleSeries(option.value)}
            className={cn(
              'flex h-6 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold leading-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isActive
                ? 'border-[#3ECF8E] bg-muted text-foreground'
                : 'border-border bg-card text-foreground',
              isDisabled && 'cursor-not-allowed opacity-45',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'size-[7px] rounded-full',
                isActive ? 'bg-[#3ECF8E]' : 'bg-muted-foreground',
              )}
            />
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
