import { useEffect, useMemo, useRef, useState } from 'react'
import { t } from '@lingui/core/macro'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { Checkbox, Popover } from 'radix-ui'

import { Input } from '#/components/ui/input'
import { Switch } from '#/components/ui/switch'
import { cn } from '#/lib/utils'
import type { CreatorCampaignBoardAvailableFilters } from '#/shared/api/generated/model'

import type { CampaignBoardSearch } from './search-schema'

const SEARCH_DEBOUNCE_MS = 300
const decimalAmountPattern = /^\d+(?:\.\d{1,2})?$/
const campaignBoardPlatforms = ['instagram', 'tiktok', 'youtube'] as const
type CampaignBoardPlatform = (typeof campaignBoardPlatforms)[number]

// Chips de filtro con el mismo estilo que la barra de Creadores/Explorar:
// pill transparente sobre la card contenedora para que entren todos en un renglón.
const FILTER_CHIP_CLASS =
  // eslint-disable-next-line lingui/no-unlocalized-strings -- clases Tailwind, no es UI
  'inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-border bg-transparent px-4 text-xs font-medium text-foreground transition-colors hover:bg-surface-hover'

interface CampaignBoardFiltersProps {
  search: CampaignBoardSearch
  available?: CreatorCampaignBoardAvailableFilters
  onSearchChange: (patch: Partial<CampaignBoardSearch>) => void
  onReset: () => void
}

export function CampaignBoardFilters({
  search,
  available,
  onSearchChange,
  onReset,
}: CampaignBoardFiltersProps) {
  const [query, setQuery] = useState(search.q ?? '')
  const [feeMin, setFeeMin] = useState(search.fee_min_amount ?? '')
  const [feeMax, setFeeMax] = useState(search.fee_max_amount ?? '')
  const queryTimerRef = useRef<number | null>(null)
  const feeRangeError = getFeeRangeError(feeMin, feeMax)

  useEffect(() => {
    setQuery(search.q ?? '')
  }, [search.q])

  useEffect(() => {
    setFeeMin(search.fee_min_amount ?? '')
  }, [search.fee_min_amount])

  useEffect(() => {
    setFeeMax(search.fee_max_amount ?? '')
  }, [search.fee_max_amount])

  useEffect(() => {
    return () => {
      if (queryTimerRef.current !== null) {
        window.clearTimeout(queryTimerRef.current)
      }
    }
  }, [])

  function scheduleQueryChange(nextValue: string) {
    if (queryTimerRef.current !== null) {
      window.clearTimeout(queryTimerRef.current)
    }

    queryTimerRef.current = window.setTimeout(() => {
      const trimmedQuery = nextValue.trim()
      const nextQuery = trimmedQuery === '' ? undefined : trimmedQuery
      if (nextQuery !== search.q) {
        onSearchChange({ q: nextQuery })
      }
      queryTimerRef.current = null
    }, SEARCH_DEBOUNCE_MS)
  }

  function handleQueryChange(nextValue: string) {
    const limitedValue = nextValue.slice(0, 80)
    setQuery(limitedValue)
    scheduleQueryChange(limitedValue)
  }

  function handleFeeChange(nextMin: string, nextMax: string) {
    setFeeMin(nextMin)
    setFeeMax(nextMax)

    if (getFeeRangeError(nextMin, nextMax) !== undefined) return

    onSearchChange({
      fee_min_amount: nextMin === '' ? undefined : nextMin,
      fee_max_amount: nextMax === '' ? undefined : nextMax,
    })
  }

  return (
    <section aria-label={t`Filtros de campañas`}>
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card px-3 py-2.5 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.12)] sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-0 flex-1 sm:min-w-[280px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label={t`Buscar campañas`}
            placeholder={t`Buscar por marca, campaña o nicho`}
            value={query}
            maxLength={80}
            onChange={(event) => handleQueryChange(event.target.value)}
            className="rounded-full bg-transparent pl-9 pr-9"
          />
          {query.length > 0 ? (
            <button
              type="button"
              aria-label={t`Limpiar búsqueda`}
              onClick={() => handleQueryChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        <MultiSelectFilter
          label={t`Intereses`}
          selected={search.interests ?? []}
          options={available?.interests ?? []}
          onChange={(interests) => onSearchChange({ interests })}
        />
        <MultiSelectFilter
          label={t`Plataformas`}
          selected={search.platforms ?? []}
          options={available?.platforms ?? []}
          onChange={(platforms) =>
            onSearchChange({
              platforms: filterCampaignBoardPlatforms(platforms),
            })
          }
        />
        <FeeRangeFilter
          feeMin={feeMin}
          feeMax={feeMax}
          error={feeRangeError}
          onChange={handleFeeChange}
        />

        <label className="inline-flex h-9 shrink-0 items-center gap-3 rounded-full border border-border bg-transparent px-4 text-xs font-medium text-foreground">
          <span>{t`Solo recomendadas para mí`}</span>
          <Switch
            size="sm"
            checked={search.recommended_only}
            onCheckedChange={(recommendedOnly) =>
              onSearchChange({ recommended_only: recommendedOnly })
            }
          />
        </label>

        <button
          type="button"
          className="shrink-0 px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          disabled={!hasActiveBoardFilters(search)}
          onClick={onReset}
        >
          {t`Limpiar filtros`}
        </button>
      </div>
    </section>
  )
}

function MultiSelectFilter({
  label,
  selected,
  options,
  onChange,
}: {
  label: string
  selected: string[]
  options: string[]
  onChange: (selected: string[] | undefined) => void
}) {
  const selectedSet = useMemo(() => new Set(selected), [selected])
  const count = selected.length
  const triggerLabel = count === 0 ? label : `${label} · ${count}`

  function toggleOption(option: string) {
    const next = selectedSet.has(option)
      ? selected.filter((selectedOption) => selectedOption !== option)
      : [...selected, option]
    onChange(next.length === 0 ? undefined : next)
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            FILTER_CHIP_CLASS,
            count > 0 && 'border-primary/60 bg-primary/10 hover:bg-primary/10',
          )}
        >
          {triggerLabel}
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          className="z-50 w-64 rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-lg"
        >
          <div className="max-h-72 overflow-y-auto">
            {options.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                {t`Sin opciones disponibles`}
              </p>
            ) : (
              options.map((option) => (
                <label
                  key={option}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent"
                >
                  <Checkbox.Root
                    checked={selectedSet.has(option)}
                    onCheckedChange={() => toggleOption(option)}
                    className="flex size-4 items-center justify-center rounded border border-border data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                  >
                    <Checkbox.Indicator>
                      <Check className="size-3 text-primary-foreground" />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  <span className="truncate">{formatFilterOption(option)}</span>
                </label>
              ))
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

function FeeRangeFilter({
  feeMin,
  feeMax,
  error,
  onChange,
}: {
  feeMin: string
  feeMax: string
  error?: string
  onChange: (feeMin: string, feeMax: string) => void
}) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-invalid={error !== undefined}
          className={cn(FILTER_CHIP_CLASS, 'aria-invalid:border-destructive')}
        >
          {t`Rango de precios`}
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          className="z-50 w-72 space-y-3 rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-lg"
        >
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1 text-xs font-medium text-muted-foreground">
              {t`Mínimo USD`}
              <Input
                inputMode="decimal"
                pattern="\\d+(\\.\\d{1,2})?"
                value={feeMin}
                onChange={(event) => onChange(event.target.value, feeMax)}
                aria-invalid={error !== undefined}
              />
            </label>
            <label className="space-y-1 text-xs font-medium text-muted-foreground">
              {t`Máximo USD`}
              <Input
                inputMode="decimal"
                pattern="\\d+(\\.\\d{1,2})?"
                value={feeMax}
                onChange={(event) => onChange(feeMin, event.target.value)}
                aria-invalid={error !== undefined}
              />
            </label>
          </div>
          {error !== undefined ? (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

function hasActiveBoardFilters(search: CampaignBoardSearch): boolean {
  return [
    search.q,
    search.interests,
    search.platforms,
    search.fee_min_amount,
    search.fee_max_amount,
    search.recommended_only ? true : undefined,
  ].some((value) => {
    if (Array.isArray(value)) return value.length > 0
    return value !== undefined
  })
}

function formatFilterOption(option: string) {
  return option
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function filterCampaignBoardPlatforms(platforms: string[] | undefined) {
  if (platforms === undefined) return undefined
  const filteredPlatforms = platforms.filter(isCampaignBoardPlatform)
  return filteredPlatforms.length === 0 ? undefined : filteredPlatforms
}

function isCampaignBoardPlatform(
  platform: string,
): platform is CampaignBoardPlatform {
  return campaignBoardPlatforms.some(
    (allowedPlatform) => allowedPlatform === platform,
  )
}

function getFeeRangeError(feeMin: string, feeMax: string) {
  const hasInvalidMin =
    feeMin !== '' && decimalAmountPattern.exec(feeMin) === null
  const hasInvalidMax =
    feeMax !== '' && decimalAmountPattern.exec(feeMax) === null

  if (hasInvalidMin || hasInvalidMax) {
    return t`Ingresá montos con hasta dos decimales.`
  }

  if (feeMin !== '' && feeMax !== '' && Number(feeMax) < Number(feeMin)) {
    return t`El fee máximo debe ser mayor o igual al mínimo.`
  }

  return undefined
}
