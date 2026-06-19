import { useNavigate, useSearch } from '@tanstack/react-router'
import type { ChangeEvent } from 'react'

import type { DashboardSearch } from '#/routes/_brand/inicio'
import { useListCampaigns } from '#/shared/api/generated/campaigns/campaigns'

import { DashboardDateRangePicker } from './DashboardDateRangePicker'

const PLATFORM_OPTIONS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
] as const

const COUNTRY_OPTIONS = [
  { value: 'AR', label: 'Argentina' },
  { value: 'BO', label: 'Bolivia' },
  { value: 'BR', label: 'Brasil' },
  { value: 'CL', label: 'Chile' },
  { value: 'CO', label: 'Colombia' },
  { value: 'CR', label: 'Costa Rica' },
  { value: 'EC', label: 'Ecuador' },
  { value: 'ES', label: 'España' },
  { value: 'GT', label: 'Guatemala' },
  { value: 'MX', label: 'México' },
  { value: 'PE', label: 'Perú' },
  { value: 'UY', label: 'Uruguay' },
  { value: 'VE', label: 'Venezuela' },
] as const

const STATUS_OPTIONS = [
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
  { value: 'all', label: 'Todos' },
] as const

type DashboardSearchPatch = Partial<DashboardSearch>

export function DashboardFilters() {
  const navigate = useNavigate()
  const search = useSearch({ strict: false })
  const campaignsQuery = useListCampaigns(
    { limit: 50 },
    { query: { staleTime: 300_000 } },
  )

  const campaigns =
    campaignsQuery.data?.status === 200 ? campaignsQuery.data.data.data : []

  function updateSearch(patch: DashboardSearchPatch) {
    void navigate({
      to: '.',
      search: (prev) => ({ ...prev, ...patch }),
      replace: true,
    })
  }

  function handleMultiChange<TKey extends keyof DashboardSearch>(
    key: TKey,
    event: ChangeEvent<HTMLSelectElement>,
  ) {
    const values = Array.from(event.currentTarget.selectedOptions).map(
      (option) => option.value,
    )
    updateSearch({ [key]: values } as DashboardSearchPatch)
  }

  function clearFilters() {
    updateSearch({
      campaign_ids: [],
      creator_ids: [],
      platforms: [],
      countries: [],
      status: 'active',
    })
  }

  return (
    <section className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-end gap-3">
        <MultiSelect
          label="Campañas"
          value={search.campaign_ids}
          onChange={(event) => handleMultiChange('campaign_ids', event)}
          options={campaigns.map((campaign) => ({
            value: campaign.campaign_id,
            label: campaign.name,
          }))}
          placeholder="Sin campañas"
        />

        <MultiSelect
          label="Creadores"
          value={search.creator_ids}
          onChange={(event) => handleMultiChange('creator_ids', event)}
          options={(search.creator_ids ?? []).map((creatorId) => ({
            value: creatorId,
            label: creatorId,
          }))}
          placeholder="Buscar por UUID"
        />

        <MultiSelect
          label="Plataforma"
          value={search.platforms}
          onChange={(event) => handleMultiChange('platforms', event)}
          options={PLATFORM_OPTIONS}
        />

        <MultiSelect
          label="País"
          value={search.countries}
          onChange={(event) => handleMultiChange('countries', event)}
          options={COUNTRY_OPTIONS}
        />

        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          Estado
          <select
            aria-label="Estado"
            className="h-10 min-w-32 rounded-full border border-input bg-background px-4 text-sm font-medium text-foreground"
            value={search.status}
            onChange={(event) =>
              updateSearch({
                status: event.currentTarget.value as DashboardSearch['status'],
              })
            }
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="h-10 rounded-full border border-input px-4 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          onClick={clearFilters}
        >
          Limpiar filtros
        </button>

        <div className="ml-auto">
          <DashboardDateRangePicker />
        </div>
      </div>
    </section>
  )
}

interface MultiSelectProps {
  label: string
  value: readonly string[] | undefined
  options: ReadonlyArray<{ value: string; label: string }>
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void
  placeholder?: string
}

function MultiSelect({
  label,
  value = [],
  options,
  onChange,
  placeholder,
}: MultiSelectProps) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
      {label}
      <select
        multiple
        role="combobox"
        aria-label={label}
        className="h-10 min-w-36 rounded-full border border-input bg-background px-4 text-sm font-medium text-foreground"
        value={[...value]}
        onChange={onChange}
      >
        {options.length === 0 && placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
