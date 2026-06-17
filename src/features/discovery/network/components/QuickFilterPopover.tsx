import { t } from '@lingui/core/macro'
import { ChevronDown, X } from 'lucide-react'
import { Popover } from 'radix-ui'
import { useState } from 'react'

import { Button } from '#/components/ui/button'
import {
  useListCountries,
  useListInterests,
} from '#/shared/api/generated/lookups/lookups'

import { useDiscoveryFiltersStore } from '../store/discoveryFiltersStore'
import type { DiscoveryFilters } from '../store/discoveryFiltersStore'
import {
  AGE_OPTIONS,
  CheckboxOptionList,
  ENGAGEMENT_OPTIONS,
  isInvalidDecimalRange,
  isInvalidNumberRange,
  MoneyInput,
  PillGroup,
  PillToggle,
  PLATFORM_OPTIONS,
} from './filterControls'

export type QuickChipKey =
  | 'platforms'
  | 'countries'
  | 'interests'
  | 'age_buckets'
  | 'followers'
  | 'cpm'
  | 'engagement_rate'
  | 'price'

// The filter keys each quick chip owns, so applying/clearing only touches its
// own slice of the shared filters object.
const FILTER_KEYS: Record<QuickChipKey, (keyof DiscoveryFilters)[]> = {
  platforms: ['platforms'],
  countries: ['countries'],
  interests: ['interests'],
  age_buckets: ['age_buckets'],
  followers: ['followers_min', 'followers_max'],
  cpm: ['cpm_min', 'cpm_max'],
  engagement_rate: ['engagement_rate_min'],
  price: ['price_min', 'price_max'],
}

interface QuickFilterPopoverProps {
  chipKey: QuickChipKey
  label: string
  active: boolean
  onRemove: () => void
}

export function QuickFilterPopover({
  chipKey,
  label,
  active,
  onRemove,
}: QuickFilterPopoverProps) {
  const appliedFilters = useDiscoveryFiltersStore(
    (state) => state.appliedFilters,
  )
  const setPendingFilters = useDiscoveryFiltersStore(
    (state) => state.setPendingFilters,
  )
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<DiscoveryFilters>({})

  const handleOpenChange = (nextOpen: boolean) => {
    // Seed the draft from the applied filters every time the popover opens so
    // editing always starts from the live state and discards on cancel.
    if (nextOpen) {
      setDraft(pickFilterKeys(appliedFilters, FILTER_KEYS[chipKey]))
    }
    setOpen(nextOpen)
  }

  const handleApply = () => {
    const nextFilters: DiscoveryFilters = { ...appliedFilters }
    FILTER_KEYS[chipKey].forEach((key) => {
      delete nextFilters[key]
    })
    Object.assign(nextFilters, cleanDraft(draft))

    useDiscoveryFiltersStore.setState({ appliedFilters: nextFilters })
    setPendingFilters(nextFilters)
    setOpen(false)
  }

  const invalid =
    (chipKey === 'followers' &&
      isInvalidNumberRange(draft.followers_min, draft.followers_max)) ||
    (chipKey === 'cpm' &&
      isInvalidDecimalRange(draft.cpm_min, draft.cpm_max)) ||
    (chipKey === 'price' &&
      isInvalidDecimalRange(draft.price_min, draft.price_max))

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      {active ? (
        <span className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full bg-secondary pr-1.5 pl-3 text-xs font-medium text-secondary-foreground">
          <Popover.Trigger asChild>
            <button
              type="button"
              className="max-w-[12rem] truncate transition-opacity hover:opacity-80 focus-visible:outline-none"
            >
              {label}
            </button>
          </Popover.Trigger>
          <button
            type="button"
            onClick={onRemove}
            className="rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={t`Quitar filtro ${label}`}
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </span>
      ) : (
        <Popover.Trigger asChild>
          <button
            type="button"
            className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full border border-border bg-transparent px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            {label}
            <ChevronDown className="size-3" aria-hidden />
          </button>
        </Popover.Trigger>
      )}

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-50 w-64 rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-lg"
        >
          <div className="p-1">
            <QuickFilterEditor
              chipKey={chipKey}
              draft={draft}
              setDraft={setDraft}
              invalid={invalid}
            />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 border-t border-border pt-2">
            <button
              type="button"
              onClick={() => setDraft({})}
              className="px-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t`Limpiar`}
            </button>
            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              disabled={invalid}
            >
              {t`Aplicar`}
            </Button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

function QuickFilterEditor({
  chipKey,
  draft,
  setDraft,
  invalid,
}: {
  chipKey: QuickChipKey
  draft: DiscoveryFilters
  setDraft: React.Dispatch<React.SetStateAction<DiscoveryFilters>>
  invalid: boolean
}) {
  const setField = (patch: Partial<DiscoveryFilters>) =>
    setDraft((current) => ({ ...current, ...patch }))

  switch (chipKey) {
    case 'platforms':
      return (
        <PillGroup>
          {PLATFORM_OPTIONS.map((option) => (
            <PillToggle
              key={option.value}
              label={option.label}
              selected={(draft.platforms ?? []).includes(option.value)}
              onToggle={() =>
                setField({
                  platforms: toggleArrayValue(draft.platforms, option.value),
                })
              }
            />
          ))}
        </PillGroup>
      )

    case 'countries':
      return (
        <CountryOptions
          values={draft.countries ?? []}
          onToggle={(value) =>
            setField({ countries: toggleArrayValue(draft.countries, value) })
          }
        />
      )

    case 'interests':
      return (
        <InterestOptions
          values={draft.interests ?? []}
          onToggle={(value) =>
            setField({ interests: toggleArrayValue(draft.interests, value) })
          }
        />
      )

    case 'age_buckets':
      return (
        <CheckboxOptionList
          options={AGE_OPTIONS.map((value) => ({ value, label: value }))}
          values={draft.age_buckets ?? []}
          onToggle={(value) =>
            setField({
              age_buckets: toggleArrayValue(draft.age_buckets, value),
            })
          }
        />
      )

    case 'engagement_rate':
      return (
        <PillGroup>
          {ENGAGEMENT_OPTIONS.map((option) => {
            const value = option / 100
            return (
              <PillToggle
                key={option}
                label={t`Mayor a ${option}%`}
                selected={draft.engagement_rate_min === value}
                onToggle={() =>
                  setField({
                    engagement_rate_min:
                      draft.engagement_rate_min === value ? undefined : value,
                  })
                }
              />
            )
          })}
        </PillGroup>
      )

    case 'followers':
      return (
        <div className="grid grid-cols-2 gap-2">
          <MoneyInput
            inputType="number"
            value={draft.followers_min}
            error={invalid}
            onChange={(value) => setField({ followers_min: toNumber(value) })}
            placeholder={t`Desde`}
          />
          <MoneyInput
            inputType="number"
            value={draft.followers_max}
            error={invalid}
            onChange={(value) => setField({ followers_max: toNumber(value) })}
            placeholder={t`Hasta`}
          />
        </div>
      )

    case 'cpm':
      return (
        <div className="grid grid-cols-2 gap-2">
          <MoneyInput
            inputType="text"
            moneyPrefix
            value={draft.cpm_min}
            error={invalid}
            onChange={(value) => setField({ cpm_min: value })}
            placeholder={t`Desde`}
          />
          <MoneyInput
            inputType="text"
            moneyPrefix
            value={draft.cpm_max}
            error={invalid}
            onChange={(value) => setField({ cpm_max: value })}
            placeholder={t`Hasta`}
          />
        </div>
      )

    case 'price':
      return (
        <div className="grid grid-cols-2 gap-2">
          <MoneyInput
            inputType="text"
            moneyPrefix
            value={draft.price_min}
            error={invalid}
            onChange={(value) => setField({ price_min: value })}
            placeholder={t`Desde`}
          />
          <MoneyInput
            inputType="text"
            moneyPrefix
            value={draft.price_max}
            error={invalid}
            onChange={(value) => setField({ price_max: value })}
            placeholder={t`Hasta`}
          />
        </div>
      )
  }
}

function CountryOptions({
  values,
  onToggle,
}: {
  values: string[]
  onToggle: (value: string) => void
}) {
  const countriesQuery = useListCountries({ active: true })
  const options =
    countriesQuery.data?.status === 200
      ? countriesQuery.data.data.items.map((country) => ({
          value: country.code,
          label: country.label_es,
        }))
      : []

  return (
    <CheckboxOptionList options={options} values={values} onToggle={onToggle} />
  )
}

function InterestOptions({
  values,
  onToggle,
}: {
  values: string[]
  onToggle: (value: string) => void
}) {
  const interestsQuery = useListInterests()
  const options =
    interestsQuery.data?.status === 200
      ? interestsQuery.data.data.items.map((interest) => ({
          value: interest.slug,
          label: interest.label_es,
        }))
      : []

  return (
    <CheckboxOptionList options={options} values={values} onToggle={onToggle} />
  )
}

function toggleArrayValue<T extends string>(
  current: T[] | undefined,
  value: T,
): T[] {
  const values = current ?? []
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value]
}

function toNumber(value: string): number | undefined {
  return value === '' ? undefined : Number(value)
}

function pickFilterKeys(
  filters: DiscoveryFilters,
  keys: (keyof DiscoveryFilters)[],
): DiscoveryFilters {
  const result: DiscoveryFilters = {}
  keys.forEach((key) => {
    const value = filters[key]
    if (value !== undefined) {
      ;(result as Record<string, unknown>)[key] = value
    }
  })
  return result
}

function cleanDraft(draft: DiscoveryFilters): DiscoveryFilters {
  const result: DiscoveryFilters = {}
  ;(Object.entries(draft) as [string, unknown][]).forEach(([key, value]) => {
    if (value === undefined || value === '') return
    if (Array.isArray(value) && value.length === 0) return
    ;(result as Record<string, unknown>)[key] = value
  })
  return result
}
