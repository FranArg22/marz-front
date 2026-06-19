import { useNavigate, useSearch } from '@tanstack/react-router'
import {
  ChevronDown,
  CircleDot,
  Clapperboard,
  MapPin,
  Megaphone,
  RotateCcw,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Checkbox, Popover } from 'radix-ui'

import { cn } from '#/lib/utils'
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
type Option = { value: string; label: string }

export function DashboardFilters() {
  const navigate = useNavigate()
  const search = useSearch({ strict: false })
  const campaignsQuery = useListCampaigns(
    { limit: 50 },
    { query: { staleTime: 300_000 } },
  )

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

  return (
    <section className="rounded-3xl border border-border bg-card px-3.5 py-3 text-card-foreground shadow-[0_12px_28px_-18px_rgba(0,0,0,0.35)]">
      <div className="flex flex-wrap items-center gap-2">
        <MultiSelectPill
          icon={Megaphone}
          emptyLabel="Todas las campañas"
          countLabel="Campañas"
          options={campaignOptions}
          selected={search.campaign_ids ?? []}
          onChange={(value) => updateSearch({ campaign_ids: value })}
        />
        <MultiSelectPill
          icon={Users}
          emptyLabel="Todos los creadores"
          countLabel="Creadores"
          options={creatorOptions}
          selected={search.creator_ids ?? []}
          onChange={(value) => updateSearch({ creator_ids: value })}
          emptyHint="Filtrá creadores desde el listado de creadores."
        />
        <MultiSelectPill
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
        <SingleSelectPill
          icon={CircleDot}
          label={`Estado: ${statusLabel}`}
          options={[...STATUS_OPTIONS]}
          selected={search.status ?? 'active'}
          onChange={(value) =>
            updateSearch({ status: value as DashboardSearch['status'] })
          }
        />
        <MultiSelectPill
          icon={MapPin}
          emptyLabel="País"
          countLabel="País"
          options={[...COUNTRY_OPTIONS]}
          selected={search.countries ?? []}
          onChange={(value) => updateSearch({ countries: value })}
        />

        <button
          type="button"
          onClick={clearFilters}
          className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Limpiar
        </button>

        <div className="ml-auto">
          <DashboardDateRangePicker />
        </div>
      </div>
    </section>
  )
}

export const PILL_CLASS =
  'inline-flex h-8 items-center justify-between gap-2 rounded-full border border-border bg-muted px-2.5 text-[11px] font-semibold text-foreground transition hover:bg-muted/70'

function MultiSelectPill({
  icon: Icon,
  emptyLabel,
  countLabel,
  options,
  selected,
  onChange,
  emptyHint,
}: {
  icon: LucideIcon
  emptyLabel: string
  countLabel: string
  options: Option[]
  selected: string[]
  onChange: (value: string[]) => void
  emptyHint?: string
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
        <button type="button" className={PILL_CLASS} aria-label={countLabel}>
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
}: {
  icon: LucideIcon
  label: string
  options: Option[]
  selected: string
  onChange: (value: string) => void
}) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button type="button" className={PILL_CLASS}>
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
