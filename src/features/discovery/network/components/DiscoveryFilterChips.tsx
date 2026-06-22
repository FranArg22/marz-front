import { t } from '@lingui/core/macro'
import { SlidersHorizontal, X } from 'lucide-react'

import {
  GetDiscoveryCreatorsGender,
  SocialPlatform,
} from '#/shared/api/generated/model'
import { useListInterests } from '#/shared/api/generated/lookups/lookups'

import {
  countActiveFilters,
  useDiscoveryFiltersStore,
} from '../store/discoveryFiltersStore'
import type { DiscoveryFilters } from '../store/discoveryFiltersStore'
import { QuickFilterPopover } from './QuickFilterPopover'
import type { QuickChipKey } from './QuickFilterPopover'

interface DiscoveryFilterChipsProps {
  onOpenFilterPanel: () => void
}

type ChipKey =
  | 'platforms'
  | 'gender'
  | 'countries'
  | 'age_buckets'
  | 'interests'
  | 'content_types'
  | 'followers'
  | 'engagement_rate'
  | 'avg_views'
  | 'cpm'
  | 'price'

type FilterChipItem = {
  key: ChipKey
  label: string
}

/* eslint-disable lingui/no-unlocalized-strings -- brand names and static labels, not translatable */
const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  [SocialPlatform.instagram]: 'IG',
  [SocialPlatform.tiktok]: 'TikTok',
  [SocialPlatform.youtube]: 'YouTube',
}

const GENDER_LABELS: Record<GetDiscoveryCreatorsGender, string> = {
  [GetDiscoveryCreatorsGender.male]: 'Masculino',
  [GetDiscoveryCreatorsGender.female]: 'Femenino',
  [GetDiscoveryCreatorsGender.non_binary]: 'No binario',
}
/* eslint-enable lingui/no-unlocalized-strings */

const RANGE_KEYS: Record<
  Extract<ChipKey, 'followers' | 'avg_views' | 'cpm' | 'price'>,
  [keyof DiscoveryFilters, keyof DiscoveryFilters]
> = {
  followers: ['followers_min', 'followers_max'],
  avg_views: ['avg_views_min', 'avg_views_max'],
  cpm: ['cpm_min', 'cpm_max'],
  price: ['price_min', 'price_max'],
}

export function DiscoveryFilterChips({
  onOpenFilterPanel,
}: DiscoveryFilterChipsProps) {
  const { appliedFilters, setPendingFilters } = useDiscoveryFiltersStore()
  const interestsQuery = useListInterests()
  const interestLabels =
    interestsQuery.data?.status === 200
      ? new Map(
          interestsQuery.data.data.items.map((interest) => [
            interest.slug,
            interest.label_es,
          ]),
        )
      : undefined
  const activeChips = buildFilterChips(appliedFilters, interestLabels)
  const activeChipByKey = new Map(activeChips.map((chip) => [chip.key, chip]))
  const activeCount = countActiveFilters(appliedFilters)

  // Most-used filters surfaced as suggestions even when not applied, so the bar
  // never looks empty. Each opens an inline mini-popover scoped to that single
  // filter. When a suggested filter is active it renders its value chip
  // instead; active filters outside this list are appended after.
  const suggestedFilters: { key: QuickChipKey; label: string }[] = [
    { key: 'platforms', label: t`Plataforma` },
    { key: 'countries', label: t`País` },
    { key: 'interests', label: t`Interés` },
    { key: 'age_buckets', label: t`Edad` },
    { key: 'followers', label: t`Seguidores` },
    { key: 'cpm', label: t`CPM` },
    { key: 'engagement_rate', label: t`ER` },
    { key: 'price', label: t`Precio` },
  ]
  const suggestedKeys = new Set<ChipKey>(
    suggestedFilters.map((item) => item.key),
  )
  const extraActiveChips = activeChips.filter(
    (chip) => !suggestedKeys.has(chip.key),
  )

  const syncFilters = (nextFilters: DiscoveryFilters) => {
    useDiscoveryFiltersStore.setState({ appliedFilters: nextFilters })
    setPendingFilters(nextFilters)
  }

  const removeChip = (chipKey: ChipKey) => {
    const nextFilters = { ...appliedFilters }

    switch (chipKey) {
      case 'followers':
      case 'avg_views':
      case 'cpm':
      case 'price': {
        const [minKey, maxKey] = RANGE_KEYS[chipKey]
        delete nextFilters[minKey]
        delete nextFilters[maxKey]
        break
      }
      case 'engagement_rate':
        delete nextFilters.engagement_rate_min
        break
      default:
        delete nextFilters[chipKey]
    }

    syncFilters(nextFilters)
  }

  const clearFilters = () => {
    syncFilters({})
  }

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2.5 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.12)]">
      <button
        type="button"
        onClick={onOpenFilterPanel}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-foreground transition-colors hover:bg-surface-hover"
      >
        <SlidersHorizontal className="size-3.5" aria-hidden />
        {t`Filtros`}
        {activeCount > 0 ? (
          <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
            {activeCount}
          </span>
        ) : null}
      </button>

      <div className="hidden flex-1 items-center gap-2 overflow-x-auto md:flex">
        {suggestedFilters.map((item) => {
          const activeChip = activeChipByKey.get(item.key)
          return (
            <QuickFilterPopover
              key={item.key}
              chipKey={item.key}
              label={activeChip ? activeChip.label : item.label}
              active={Boolean(activeChip)}
              onRemove={() => removeChip(item.key)}
            />
          )
        })}
        {extraActiveChips.map((chip) => (
          <FilterChip
            key={chip.key}
            label={chip.label}
            onRemove={() => removeChip(chip.key)}
          />
        ))}
      </div>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={clearFilters}
          className="shrink-0 px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {t`Limpiar`}
        </button>
      )}
    </div>
  )
}

function FilterChip({
  label,
  onRemove,
}: {
  label: string
  onRemove: () => void
}) {
  return (
    <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-secondary px-3 text-xs font-medium text-secondary-foreground">
      <span className="truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={t`Quitar filtro ${label}`}
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </span>
  )
}

function buildFilterChips(
  filters: DiscoveryFilters,
  interestLabels?: Map<string, string>,
): FilterChipItem[] {
  const chips: FilterChipItem[] = []

  if (filters.platforms?.length) {
    const platformList = filters.platforms
      .map((platform) => PLATFORM_LABELS[platform])
      .join(' + ')
    chips.push({
      key: 'platforms',
      label: platformList,
    })
  }

  if (filters.gender) {
    const genderLabel = GENDER_LABELS[filters.gender]
    chips.push({
      key: 'gender',
      label: genderLabel,
    })
  }

  if (filters.countries?.length) {
    const countryList = filters.countries.join(', ')
    chips.push({
      key: 'countries',
      label: countryList,
    })
  }

  if (filters.age_buckets?.length) {
    const ageList = filters.age_buckets.join(', ')
    chips.push({
      key: 'age_buckets',
      label: ageList,
    })
  }

  if (filters.interests?.length) {
    const interestList = filters.interests
      .map((slug) => interestLabels?.get(slug) ?? slug)
      .join(', ')
    chips.push({
      key: 'interests',
      label: interestList,
    })
  }

  if (filters.content_types?.length) {
    const contentList = filters.content_types.join(', ')
    chips.push({
      key: 'content_types',
      label: contentList,
    })
  }

  if (
    filters.followers_min !== undefined ||
    filters.followers_max !== undefined
  ) {
    const followersRange = formatRange(
      filters.followers_min,
      filters.followers_max,
      formatCompactNumber,
    )
    chips.push({
      key: 'followers',
      label: t`${followersRange} seguidores`,
    })
  }

  if (filters.engagement_rate_min !== undefined) {
    const erMinPct = Math.round(filters.engagement_rate_min * 100)
    chips.push({
      key: 'engagement_rate',
      label: t`+${erMinPct}% ER`,
    })
  }

  if (
    filters.avg_views_min !== undefined ||
    filters.avg_views_max !== undefined
  ) {
    const viewsRange = formatRange(
      filters.avg_views_min,
      filters.avg_views_max,
      formatCompactNumber,
    )
    chips.push({
      key: 'avg_views',
      label: t`${viewsRange} vistas`,
    })
  }

  if (hasValue(filters.cpm_min) || hasValue(filters.cpm_max)) {
    const cpmRange = formatStringRange(
      filters.cpm_min,
      filters.cpm_max,
      formatMoney,
    )
    chips.push({
      key: 'cpm',
      label: t`${cpmRange} CPM`,
    })
  }

  if (hasValue(filters.price_min) || hasValue(filters.price_max)) {
    const priceRange = formatStringRange(
      filters.price_min,
      filters.price_max,
      formatMoney,
    )
    chips.push({
      key: 'price',
      label: priceRange,
    })
  }

  return chips
}

function formatRange<T extends string | number>(
  min: T | undefined,
  max: T | undefined,
  formatValue: (value: T) => string,
): string {
  if (min !== undefined && max !== undefined) {
    return `${formatValue(min)}-${formatValue(max)}`
  }

  if (min !== undefined) {
    const minLabel = formatValue(min)
    return t`Desde ${minLabel}`
  }

  if (max !== undefined) {
    const maxLabel = formatValue(max)
    return t`Hasta ${maxLabel}`
  }

  return ''
}

function formatCompactNumber(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    // eslint-disable-next-line lingui/no-unlocalized-strings -- numeric suffix, not UI copy
    return `${formatRounded(value / 1_000_000)}M`
  }

  if (Math.abs(value) >= 1_000) {
    return `${formatRounded(value / 1_000)}k`
  }

  return String(value)
}

function formatRounded(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function formatMoney(value: string | number): string {
  return `$${value}`
}

function formatStringRange(
  min: string | undefined,
  max: string | undefined,
  formatValue: (value: string) => string,
): string {
  return formatRange(
    hasValue(min) ? min : undefined,
    hasValue(max) ? max : undefined,
    formatValue,
  )
}

function hasValue(value: string | undefined): boolean {
  return value !== undefined && value !== ''
}
