import { t } from '@lingui/core/macro'
import { SlidersHorizontal, X } from 'lucide-react'

import {
  GetDiscoveryCreatorsGender,
  SocialPlatform,
} from '#/shared/api/generated/model'

import {
  countActiveFilters,
  useDiscoveryFiltersStore,
} from '../store/discoveryFiltersStore'
import type { DiscoveryFilters } from '../store/discoveryFiltersStore'

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
  [SocialPlatform.instagram]: 'Instagram',
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
  const chips = buildFilterChips(appliedFilters)
  const activeCount = countActiveFilters(appliedFilters)

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
    <div className="flex flex-wrap items-center gap-2">
      {activeCount > 0 && (
        <button
          type="button"
          onClick={onOpenFilterPanel}
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-surface-hover"
        >
          <SlidersHorizontal className="size-3.5" aria-hidden />
          {t`Filtros (${activeCount})`}
        </button>
      )}

      {chips.map((chip) => (
        <FilterChip
          key={chip.key}
          label={chip.label}
          onRemove={() => removeChip(chip.key)}
        />
      ))}

      {activeCount > 0 && (
        <button
          type="button"
          onClick={clearFilters}
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
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
    <span className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-full border border-border bg-muted px-3 text-xs font-medium text-foreground">
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

function buildFilterChips(filters: DiscoveryFilters): FilterChipItem[] {
  const chips: FilterChipItem[] = []

  if (filters.platforms?.length) {
    const platformList = filters.platforms
      .map((platform) => PLATFORM_LABELS[platform])
      .join(', ')
    chips.push({
      key: 'platforms',
      label: t`Plataformas: ${platformList}`,
    })
  }

  if (filters.gender) {
    const genderLabel = GENDER_LABELS[filters.gender]
    chips.push({
      key: 'gender',
      label: t`Género: ${genderLabel}`,
    })
  }

  if (filters.countries?.length) {
    const countryList = filters.countries.join(', ')
    chips.push({
      key: 'countries',
      label: t`Países: ${countryList}`,
    })
  }

  if (filters.age_buckets?.length) {
    const ageList = filters.age_buckets.join(', ')
    chips.push({
      key: 'age_buckets',
      label: t`Edad: ${ageList}`,
    })
  }

  if (filters.interests?.length) {
    const interestList = filters.interests.join(', ')
    chips.push({
      key: 'interests',
      label: t`Intereses: ${interestList}`,
    })
  }

  if (filters.content_types?.length) {
    const contentList = filters.content_types.join(', ')
    chips.push({
      key: 'content_types',
      label: t`Contenido: ${contentList}`,
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
      label: t`Seguidores: ${followersRange}`,
    })
  }

  if (filters.engagement_rate_min !== undefined) {
    const erMin = filters.engagement_rate_min
    chips.push({
      key: 'engagement_rate',
      label: t`ER: ≥${erMin}%`,
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
      label: t`Vistas: ${viewsRange}`,
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
      label: t`CPM: ${cpmRange}`,
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
      label: t`Precio: ${priceRange}`,
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
    return `${formatValue(min)}–${formatValue(max)}`
  }

  if (min !== undefined) {
    return `≥${formatValue(min)}`
  }

  if (max !== undefined) {
    return `≤${formatValue(max)}`
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
