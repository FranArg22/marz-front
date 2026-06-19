import { useNavigate, useSearch } from '@tanstack/react-router'
import { CalendarDays, Check, ChevronDown } from 'lucide-react'
import { Popover } from 'radix-ui'

import { useBrandSession } from '#/features/identity/session/BrandSessionContext'
import { getWorkspacePlan } from '#/features/offers/utils/workspacePlan'
import { cn } from '#/lib/utils'
import type { DashboardSearch } from '#/routes/_brand/inicio'

import { PILL_CLASS } from './DashboardFilters'

const PRESETS = [
  { value: '7d', label: 'Últimos 7 días' },
  { value: '14d', label: 'Últimos 14 días' },
  { value: '30d', label: 'Últimos 30 días' },
  { value: 'custom', label: 'Personalizado' },
] as const

type DashboardSearchPatch = Partial<DashboardSearch>

export function DashboardDateRangePicker() {
  const navigate = useNavigate()
  const search = useSearch({ strict: false })
  const { brandWorkspace } = useBrandSession()
  const isFreePlan = getWorkspacePlan(brandWorkspace.plan) === 'free'

  const currentLabel =
    PRESETS.find((preset) => preset.value === search.range_preset)?.label ??
    'Últimos 14 días'

  function updateSearch(patch: DashboardSearchPatch) {
    void navigate({
      to: '.',
      search: (prev) => ({ ...prev, ...patch }),
      replace: true,
    })
  }

  function selectPreset(nextPreset: DashboardSearch['range_preset']) {
    updateSearch({
      range_preset: nextPreset,
      range_start: nextPreset === 'custom' ? search.range_start : undefined,
      range_end: nextPreset === 'custom' ? search.range_end : undefined,
    })
  }

  return (
    <div className="flex items-center gap-2">
      {search.range_preset === 'custom' ? (
        <>
          <input
            aria-label="Desde"
            type="date"
            className="h-8 rounded-full border border-border bg-muted px-3 text-[11px] font-semibold text-foreground"
            value={search.range_start ?? ''}
            onChange={(event) =>
              updateSearch({ range_start: event.currentTarget.value })
            }
          />
          <input
            aria-label="Hasta"
            type="date"
            className="h-8 rounded-full border border-border bg-muted px-3 text-[11px] font-semibold text-foreground"
            value={search.range_end ?? ''}
            onChange={(event) =>
              updateSearch({ range_end: event.currentTarget.value })
            }
          />
        </>
      ) : null}

      <Popover.Root>
        <Popover.Trigger asChild>
          <button type="button" className={cn(PILL_CLASS, 'min-w-[150px]')}>
            <span className="flex items-center gap-1.5">
              <CalendarDays
                className="size-3.5 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="truncate">{currentLabel}</span>
            </span>
            <ChevronDown
              className="size-3.5 text-muted-foreground"
              aria-hidden="true"
            />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="end"
            sideOffset={8}
            className="z-50 w-48 rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-lg"
          >
            {PRESETS.map((preset) => {
              const disabled = isFreePlan && preset.value !== '7d'
              return (
                <button
                  key={preset.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectPreset(preset.value)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent',
                    preset.value === search.range_preset &&
                      'font-semibold text-foreground',
                  )}
                >
                  {preset.label}
                  {preset.value === search.range_preset ? (
                    <Check
                      className="size-3.5 text-primary"
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              )
            })}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  )
}
