import { useNavigate, useSearch } from '@tanstack/react-router'
import {
  ChevronDown,
  CircleDot,
  Clapperboard,
  MapPin,
  Megaphone,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Checkbox, Popover } from 'radix-ui'

import { FilterSheet } from '#/components/ui/filter-sheet'
import { cn } from '#/lib/utils'
import type { DashboardSearch } from '#/routes/_brand/inicio'
import { useListCampaigns } from '#/shared/api/generated/campaigns/campaigns'
import { useListCountries } from '#/shared/api/generated/lookups/lookups'
import { useIsMobile } from '#/shared/hooks'

import { DashboardDateRangePicker } from './DashboardDateRangePicker'

const PLATFORM_OPTIONS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
] as const

const STATUS_OPTIONS = [
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
  { value: 'all', label: 'Todos' },
] as const

type DashboardSearchPatch = Partial<DashboardSearch>
type Option = { value: string; label: string }

export function DashboardFilters() {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const search = useSearch({ strict: false })
  const campaignsQuery = useListCampaigns(
    { limit: 50 },
    { query: { staleTime: 300_000 } },
  )
  const countriesQuery = useListCountries({ active: true })

  const countryOptions: Option[] =
    countriesQuery.data?.status === 200
      ? countriesQuery.data.data.items.map((country) => ({
          value: country.code,
          label: country.label_es,
        }))
      : []

  const campaignOptions: Option[] =
    campaignsQuery.data?.status === 200
      ? campaignsQuery.data.data.data.map((campaign) => ({
          value: campaign.campaign_id,
          label: campaign.name,
        }))
      : []

  const creatorOptions: Option[] = (search.creator_ids ?? []).map((id) => ({
    value: id,
    label: id,
  }))

  function updateSearch(patch: DashboardSearchPatch) {
    void navigate({
      to: '.',
      search: (prev) => ({ ...prev, ...patch }),
      replace: true,
    })
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

  const statusLabel =
    STATUS_OPTIONS.find((option) => option.value === search.status)?.label ??
    'Activos'

  const campaignsPill = (stack: boolean) => (
    <MultiSelectPill
      stack={stack}
      icon={Megaphone}
      emptyLabel="Todas las campañas"
      countLabel="Campañas"
      options={campaignOptions}
      selected={search.campaign_ids ?? []}
      onChange={(value) => updateSearch({ campaign_ids: value })}
    />
  )
  const creatorsPill = (stack: boolean) => (
    <MultiSelectPill
      stack={stack}
      icon={Users}
      emptyLabel="Todos los creadores"
      countLabel="Creadores"
      options={creatorOptions}
      selected={search.creator_ids ?? []}
      onChange={(value) => updateSearch({ creator_ids: value })}
      emptyHint="Filtrá creadores desde el listado de creadores."
    />
  )
  const platformsPill = (stack: boolean) => (
    <MultiSelectPill
      stack={stack}
      icon={Clapperboard}
      emptyLabel="Plataforma"
      countLabel="Plataforma"
      options={[...PLATFORM_OPTIONS]}
      selected={search.platforms ?? []}
      onChange={(value) =>
        updateSearch({
          platforms: value as DashboardSearch['platforms'],
        })
      }
    />
  )
  const statusPill = (stack: boolean) => (
    <SingleSelectPill
      stack={stack}
      icon={CircleDot}
      label={`Estado: ${statusLabel}`}
      options={[...STATUS_OPTIONS]}
      selected={search.status ?? 'active'}
      onChange={(value) =>
        updateSearch({ status: value as DashboardSearch['status'] })
      }
    />
  )
  const countriesPill = (stack: boolean) => (
    <MultiSelectPill
      stack={stack}
      icon={MapPin}
      emptyLabel="País"
      countLabel="País"
      options={countryOptions}
      selected={search.countries ?? []}
      onChange={(value) => updateSearch({ countries: value })}
    />
  )

  const sheetActiveCount =
    (search.campaign_ids?.length ? 1 : 0) +
    (search.creator_ids?.length ? 1 : 0) +
    (search.platforms?.length ? 1 : 0) +
    (search.countries?.length ? 1 : 0) +
    ((search.status ?? 'active') !== 'active' ? 1 : 0)

  return (
    <section className="rounded-2xl border border-border bg-card px-3 py-2.5 text-card-foreground shadow-[0_10px_30px_-12px_rgba(0,0,0,0.12)]">
      <div className="flex flex-wrap items-center gap-2">
        {isMobile ? (
          <>
            <FilterSheet
              activeCount={sheetActiveCount}
              clearDisabled={sheetActiveCount === 0}
              onClear={clearFilters}
            >
              {campaignsPill(true)}
              {creatorsPill(true)}
              {platformsPill(true)}
              {statusPill(true)}
              {countriesPill(true)}
            </FilterSheet>
            <div className="ml-auto">
              <DashboardDateRangePicker />
            </div>
          </>
        ) : (
          <>
            {campaignsPill(false)}
            {creatorsPill(false)}
            {platformsPill(false)}
            {statusPill(false)}
            {countriesPill(false)}

            <button
              type="button"
              onClick={clearFilters}
              className="shrink-0 px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Limpiar
            </button>

            <div className="ml-auto">
              <DashboardDateRangePicker />
            </div>
          </>
        )}
      </div>
    </section>
  )
}

export const PILL_CLASS =
  'inline-flex h-9 items-center justify-between gap-2 rounded-full border border-border bg-transparent px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground'

// Variante a ancho completo para los pills dentro del bottom sheet mobile.
const PILL_STACK_CLASS =
  'inline-flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-border bg-transparent px-4 text-sm font-medium text-foreground transition-colors'

function MultiSelectPill({
  icon: Icon,
  emptyLabel,
  countLabel,
  options,
  selected,
  onChange,
  emptyHint,
  stack = false,
}: {
  icon: LucideIcon
  emptyLabel: string
  countLabel: string
  options: Option[]
  selected: string[]
  onChange: (value: string[]) => void
  emptyHint?: string
  stack?: boolean
}) {
  const selectedSet = new Set(selected)
  const triggerLabel =
    selected.length === 0 ? emptyLabel : `${countLabel} · ${selected.length}`

  function toggle(value: string) {
    onChange(
      selectedSet.has(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    )
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={stack ? PILL_STACK_CLASS : PILL_CLASS}
          aria-label={countLabel}
        >
          <span className="flex items-center gap-1.5">
            <Icon
              className="size-3.5 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="truncate">{triggerLabel}</span>
          </span>
          <ChevronDown
            className="size-3.5 text-muted-foreground"
            aria-hidden="true"
          />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          className="z-50 w-60 rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-lg"
        >
          <div className="max-h-72 overflow-y-auto">
            {options.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                {emptyHint ?? 'Sin opciones disponibles'}
              </p>
            ) : (
              options.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent"
                >
                  <Checkbox.Root
                    checked={selectedSet.has(option.value)}
                    onCheckedChange={() => toggle(option.value)}
                    className="flex size-4 items-center justify-center rounded border border-border data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                  >
                    <Checkbox.Indicator>
                      <CheckMark />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  <span className="truncate">{option.label}</span>
                </label>
              ))
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

function SingleSelectPill({
  icon: Icon,
  label,
  options,
  selected,
  onChange,
  stack = false,
}: {
  icon: LucideIcon
  label: string
  options: Option[]
  selected: string
  onChange: (value: string) => void
  stack?: boolean
}) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button type="button" className={stack ? PILL_STACK_CLASS : PILL_CLASS}>
          <span className="flex items-center gap-1.5">
            <Icon
              className="size-3.5 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="truncate">{label}</span>
          </span>
          <ChevronDown
            className="size-3.5 text-muted-foreground"
            aria-hidden="true"
          />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          className="z-50 w-44 rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-lg"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-accent',
                option.value === selected && 'font-semibold text-foreground',
              )}
            >
              {option.label}
              {option.value === selected ? <CheckMark /> : null}
            </button>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

function CheckMark() {
  return (
    <svg
      viewBox="0 0 12 12"
      className="size-3 text-primary-foreground"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        d="M2.5 6.5l2.5 2.5 4.5-5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
