import { useNavigate, useSearch } from '@tanstack/react-router'

import { useBrandSession } from '#/features/identity/session/BrandSessionContext'
import { getWorkspacePlan } from '#/features/offers/utils/workspacePlan'
import type { DashboardSearch } from '#/routes/_brand/inicio'

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

  function updateSearch(patch: DashboardSearchPatch) {
    void navigate({
      to: '.',
      search: (prev) => ({ ...prev, ...patch }),
      replace: true,
    })
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
        Rango
        <select
          aria-label="Rango"
          className="h-10 min-w-44 rounded-full border border-input bg-background px-4 text-sm font-medium text-foreground"
          value={search.range_preset}
          onChange={(event) => {
            const nextPreset = event.currentTarget
              .value as DashboardSearch['range_preset']
            updateSearch({
              range_preset: nextPreset,
              range_start:
                nextPreset === 'custom' ? search.range_start : undefined,
              range_end: nextPreset === 'custom' ? search.range_end : undefined,
            })
          }}
        >
          {PRESETS.map((preset) => (
            <option
              key={preset.value}
              value={preset.value}
              disabled={isFreePlan && preset.value !== '7d'}
            >
              {preset.label}
            </option>
          ))}
        </select>
      </label>

      {search.range_preset === 'custom' ? (
        <>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Desde
            <input
              aria-label="Desde"
              type="date"
              className="h-10 rounded-full border border-input bg-background px-4 text-sm font-medium text-foreground"
              value={search.range_start ?? ''}
              onChange={(event) =>
                updateSearch({ range_start: event.currentTarget.value })
              }
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Hasta
            <input
              aria-label="Hasta"
              type="date"
              className="h-10 rounded-full border border-input bg-background px-4 text-sm font-medium text-foreground"
              value={search.range_end ?? ''}
              onChange={(event) =>
                updateSearch({ range_end: event.currentTarget.value })
              }
            />
          </label>
        </>
      ) : null}
    </div>
  )
}
