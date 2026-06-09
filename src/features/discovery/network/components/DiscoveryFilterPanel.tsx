import { t } from '@lingui/core/macro'
import type { ReactNode } from 'react'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import { cn } from '#/lib/utils'
import {
  GetDiscoveryCreatorsAgeBucketsItem,
  GetDiscoveryCreatorsCreatorType,
  GetDiscoveryCreatorsGender,
  SocialPlatform,
} from '#/shared/api/generated/model'

import { useDiscoveryFiltersStore } from '../store/discoveryFiltersStore'
import type { DiscoveryFilters } from '../store/discoveryFiltersStore'

interface DiscoveryFilterPanelProps {
  open: boolean
  onClose: () => void
}

/* eslint-disable lingui/no-unlocalized-strings -- brand names, country names, and static labels */
const PLATFORM_OPTIONS = [
  { value: SocialPlatform.instagram, label: 'Instagram' },
  { value: SocialPlatform.tiktok, label: 'TikTok' },
  { value: SocialPlatform.youtube, label: 'YouTube' },
]

const COUNTRY_OPTIONS = [
  { value: 'AR', label: 'Argentina' },
  { value: 'CO', label: 'Colombia' },
  { value: 'MX', label: 'México' },
  { value: 'ES', label: 'España' },
  { value: 'CL', label: 'Chile' },
]

const GENDER_OPTIONS = [
  { value: GetDiscoveryCreatorsGender.male, label: 'Masculino' },
  { value: GetDiscoveryCreatorsGender.female, label: 'Femenino' },
  { value: GetDiscoveryCreatorsGender.non_binary, label: 'No binario' },
]
/* eslint-enable lingui/no-unlocalized-strings */

const AGE_OPTIONS = [
  GetDiscoveryCreatorsAgeBucketsItem['18-24'],
  GetDiscoveryCreatorsAgeBucketsItem['25-34'],
  GetDiscoveryCreatorsAgeBucketsItem['35-44'],
  GetDiscoveryCreatorsAgeBucketsItem['45-54'],
  GetDiscoveryCreatorsAgeBucketsItem['55+'],
]

const ENGAGEMENT_OPTIONS = [
  { value: 'empty', label: '-' },
  { value: '1', label: '>=1%' },
  { value: '3', label: '>=3%' },
  { value: '5', label: '>=5%' },
]

export function DiscoveryFilterPanel({
  open,
  onClose,
}: DiscoveryFilterPanelProps) {
  const {
    pendingFilters,
    setPendingFilters,
    applyFilters,
    resetPendingFilters,
    clearFilters,
  } = useDiscoveryFiltersStore()

  const updatePendingFilters = (patch: Partial<DiscoveryFilters>) => {
    setPendingFilters(removeEmptyValues({ ...pendingFilters, ...patch }))
  }

  const toggleArrayValue = <T extends string>(
    field: keyof DiscoveryFilters,
    currentValues: T[] | undefined,
    value: T,
  ) => {
    const values = currentValues ?? []
    const nextValues = values.includes(value)
      ? values.filter((item) => item !== value)
      : [...values, value]

    updatePendingFilters({ [field]: nextValues } as Partial<DiscoveryFilters>)
  }

  const handleNumberChange = (field: keyof DiscoveryFilters, value: string) => {
    updatePendingFilters({
      [field]: value === '' ? undefined : Number(value),
    } as Partial<DiscoveryFilters>)
  }

  const handleTagInput = (value: string) => {
    const tags = value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)

    updatePendingFilters({ interests: tags })
  }

  const handleCloseWithoutApplying = () => {
    resetPendingFilters()
    onClose()
  }

  const handleApply = () => {
    applyFilters()
    onClose()
  }

  const handleClear = () => {
    clearFilters()
  }

  const validationErrors = getValidationErrors(pendingFilters)
  const hasValidationError = validationErrors.length > 0

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleCloseWithoutApplying()
        }
      }}
    >
      <SheetContent
        side="right"
        className="w-[400px] overflow-y-auto sm:max-w-none"
      >
        <SheetHeader>
          <SheetTitle>{t`Filtros`}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 px-6 py-4">
          <FilterSection title={t`Creador`}>
            <FieldGroup label={t`Plataformas`}>
              <CheckboxList
                options={PLATFORM_OPTIONS}
                values={pendingFilters.platforms}
                onToggle={(value) =>
                  toggleArrayValue('platforms', pendingFilters.platforms, value)
                }
              />
            </FieldGroup>

            <FieldGroup label={t`Tipo de creator`}>
              <div className="space-y-2">
                <RadioOption
                  name="creator-type"
                  label={t`Todos`}
                  checked={
                    !pendingFilters.creator_type ||
                    pendingFilters.creator_type ===
                      GetDiscoveryCreatorsCreatorType.all
                  }
                  onChange={() =>
                    updatePendingFilters({
                      creator_type: GetDiscoveryCreatorsCreatorType.all,
                    })
                  }
                />
                <RadioOption
                  name="creator-type"
                  label={t`Influencer`}
                  checked={
                    pendingFilters.creator_type ===
                    GetDiscoveryCreatorsCreatorType.influencer
                  }
                  onChange={() =>
                    updatePendingFilters({
                      creator_type: GetDiscoveryCreatorsCreatorType.influencer,
                    })
                  }
                />
                <RadioOption
                  name="creator-type"
                  label={t`UGC (Próximamente)`}
                  checked={false}
                  disabled
                  onChange={() => undefined}
                />
              </div>
            </FieldGroup>

            <FieldGroup label={t`País`}>
              <Input
                type="text"
                value={(pendingFilters.countries ?? []).join(', ')}
                onChange={(event) =>
                  updatePendingFilters({
                    countries: parseCsvValues(event.target.value),
                  })
                }
                placeholder={t`AR, CO, MX`}
              />
              <CheckboxList
                options={COUNTRY_OPTIONS}
                values={pendingFilters.countries}
                onToggle={(value) =>
                  toggleArrayValue('countries', pendingFilters.countries, value)
                }
              />
            </FieldGroup>

            <FieldGroup label={t`Género`}>
              <div className="space-y-2">
                {GENDER_OPTIONS.map((option) => (
                  <RadioOption
                    key={option.value}
                    name="gender"
                    label={option.label}
                    checked={pendingFilters.gender === option.value}
                    onChange={() =>
                      updatePendingFilters({ gender: option.value })
                    }
                  />
                ))}
              </div>
            </FieldGroup>

            <FieldGroup label={t`Edad`}>
              <CheckboxList
                options={AGE_OPTIONS.map((value) => ({ value, label: value }))}
                values={pendingFilters.age_buckets}
                onToggle={(value) =>
                  toggleArrayValue(
                    'age_buckets',
                    pendingFilters.age_buckets,
                    value,
                  )
                }
              />
            </FieldGroup>

            <FieldGroup label={t`Intereses`}>
              <Input
                type="text"
                value={(pendingFilters.interests ?? []).join(', ')}
                onChange={(event) => handleTagInput(event.target.value)}
                placeholder={t`moda, belleza, fitness`}
              />
            </FieldGroup>
          </FilterSection>

          <FilterSection title={t`Performance`}>
            <RangeField
              label={t`Seguidores`}
              minValue={pendingFilters.followers_min}
              maxValue={pendingFilters.followers_max}
              inputType="number"
              error={validationErrors.includes('followers')}
              onMinChange={(value) =>
                handleNumberChange('followers_min', value)
              }
              onMaxChange={(value) =>
                handleNumberChange('followers_max', value)
              }
            />

            <FieldGroup label={t`Tasa de engagement mínima`}>
              <Select
                value={String(pendingFilters.engagement_rate_min ?? 'empty')}
                onValueChange={(value) =>
                  updatePendingFilters({
                    engagement_rate_min:
                      value === 'empty' ? undefined : Number(value),
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENGAGEMENT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>

            <RangeField
              label={t`Promedio de vistas`}
              minValue={pendingFilters.avg_views_min}
              maxValue={pendingFilters.avg_views_max}
              inputType="number"
              error={validationErrors.includes('avg_views')}
              onMinChange={(value) =>
                handleNumberChange('avg_views_min', value)
              }
              onMaxChange={(value) =>
                handleNumberChange('avg_views_max', value)
              }
            />

            <RangeField
              label="CPM"
              minValue={pendingFilters.cpm_min}
              maxValue={pendingFilters.cpm_max}
              inputType="text"
              error={validationErrors.includes('cpm')}
              onMinChange={(value) => updatePendingFilters({ cpm_min: value })}
              onMaxChange={(value) => updatePendingFilters({ cpm_max: value })}
            />

            <RangeField
              label={t`Precio`}
              minValue={pendingFilters.price_min}
              maxValue={pendingFilters.price_max}
              inputType="text"
              error={validationErrors.includes('price')}
              onMinChange={(value) =>
                updatePendingFilters({ price_min: value })
              }
              onMaxChange={(value) =>
                updatePendingFilters({ price_max: value })
              }
            />
          </FilterSection>
        </div>

        <SheetFooter className="mt-auto flex-col gap-2 sm:flex-col">
          <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
            {t`Limpiar filtros`}
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            disabled={hasValidationError}
          >
            {t`Aplicar`}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function FilterSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function FieldGroup({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold text-muted-foreground uppercase">
        {label}
      </Label>
      {children}
    </div>
  )
}

function CheckboxList<T extends string>({
  options,
  values,
  onToggle,
}: {
  options: Array<{ value: T; label: string }>
  values?: T[]
  onToggle: (value: T) => void
}) {
  return (
    <div className="space-y-2">
      {options.map((option) => (
        <label
          key={option.value}
          className="flex items-center gap-2 text-sm text-foreground"
        >
          <input
            type="checkbox"
            className="size-4 rounded border-input"
            checked={(values ?? []).includes(option.value)}
            onChange={() => onToggle(option.value)}
          />
          {option.label}
        </label>
      ))}
    </div>
  )
}

function RadioOption({
  name,
  label,
  checked,
  disabled,
  onChange,
}: {
  name: string
  label: string
  checked: boolean
  disabled?: boolean
  onChange: () => void
}) {
  return (
    <label
      className={cn(
        'flex items-center gap-2 text-sm text-foreground',
        disabled && 'text-muted-foreground opacity-60',
      )}
    >
      <input
        type="radio"
        name={name}
        className="size-4 border-input"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
      {label}
    </label>
  )
}

function RangeField({
  label,
  minValue,
  maxValue,
  inputType,
  error,
  onMinChange,
  onMaxChange,
}: {
  label: string
  minValue?: number | string
  maxValue?: number | string
  inputType: 'number' | 'text'
  error: boolean
  onMinChange: (value: string) => void
  onMaxChange: (value: string) => void
}) {
  return (
    <FieldGroup label={label}>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <Input
          type={inputType}
          min={inputType === 'number' ? 0 : undefined}
          value={minValue ?? ''}
          onChange={(event) => onMinChange(event.target.value)}
          aria-invalid={error}
          placeholder={t`De`}
        />
        <span className="text-sm text-muted-foreground">-</span>
        <Input
          type={inputType}
          min={inputType === 'number' ? 0 : undefined}
          value={maxValue ?? ''}
          onChange={(event) => onMaxChange(event.target.value)}
          aria-invalid={error}
          placeholder={t`Hasta`}
        />
      </div>
      {error ? (
        <p className="text-xs text-destructive">
          {t`El valor inicial no puede ser mayor que el final.`}
        </p>
      ) : null}
    </FieldGroup>
  )
}

function parseCsvValues(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean)
}

function removeEmptyValues(filters: DiscoveryFilters): DiscoveryFilters {
  const nextFilters = { ...filters }

  Object.entries(nextFilters).forEach(([key, value]) => {
    if (Array.isArray(value) && value.length === 0) {
      delete nextFilters[key as keyof DiscoveryFilters]
    }
  })

  return nextFilters
}

function getValidationErrors(filters: DiscoveryFilters): string[] {
  const errors: string[] = []

  if (isInvalidNumberRange(filters.followers_min, filters.followers_max)) {
    errors.push('followers')
  }

  if (isInvalidNumberRange(filters.avg_views_min, filters.avg_views_max)) {
    errors.push('avg_views')
  }

  if (isInvalidDecimalRange(filters.cpm_min, filters.cpm_max)) {
    errors.push('cpm')
  }

  if (isInvalidDecimalRange(filters.price_min, filters.price_max)) {
    errors.push('price')
  }

  return errors
}

function isInvalidNumberRange(min?: number, max?: number): boolean {
  return min !== undefined && max !== undefined && min > max
}

function isInvalidDecimalRange(min?: string, max?: string): boolean {
  if (!min || !max) {
    return false
  }

  const parsedMin = Number.parseFloat(min)
  const parsedMax = Number.parseFloat(max)

  return (
    !Number.isNaN(parsedMin) &&
    !Number.isNaN(parsedMax) &&
    parsedMin > parsedMax
  )
}
