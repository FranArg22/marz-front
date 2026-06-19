import { SlidersHorizontal } from 'lucide-react'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { cn } from '#/lib/utils'

export type ChartGrouping = 'day' | 'week' | 'month'
export type ChartRangePreset = '7d' | '14d' | '30d' | 'custom'

interface ChartConfigPopoverProps {
  currentGrouping: ChartGrouping
  currentPreset: ChartRangePreset
  onChange: (grouping: ChartGrouping) => void
}

const GROUPING_OPTIONS: Array<{
  value: ChartGrouping
  label: string
}> = [
  { value: 'day', label: 'Día' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
]

export function ChartConfigPopover({
  currentGrouping,
  currentPreset,
  onChange,
}: ChartConfigPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-[30px] items-center gap-1.5 rounded-full border border-border bg-card px-3 text-[11px] font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <SlidersHorizontal className="size-3.5" aria-hidden="true" />
          Configuración
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-40 rounded-2xl p-1.5">
        <div
          className="flex flex-col gap-1"
          role="menu"
          aria-label="Agrupar por"
        >
          {GROUPING_OPTIONS.map((option) => {
            const isSelected = option.value === currentGrouping
            const isDisabled = isGroupingDisabled(option.value, currentPreset)

            return (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={isSelected}
                disabled={isDisabled}
                onClick={() => onChange(option.value)}
                className={cn(
                  'flex h-8 items-center justify-between rounded-xl px-3 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isSelected
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  isDisabled &&
                    'cursor-not-allowed opacity-45 hover:bg-transparent',
                )}
              >
                {option.label}
                {isSelected ? (
                  <span
                    aria-hidden="true"
                    className="size-1.5 rounded-full bg-[#3ECF8E]"
                  />
                ) : null}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function isGroupingDisabled(
  grouping: ChartGrouping,
  preset: ChartRangePreset,
): boolean {
  return grouping === 'month' && (preset === '7d' || preset === '14d')
}
