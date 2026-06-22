import { t } from '@lingui/core/macro'
import { ChevronDown } from 'lucide-react'
import { Popover } from 'radix-ui'
import type { ReactNode } from 'react'

import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Sheet, SheetContent } from '#/components/ui/sheet'
import { cn } from '#/lib/utils'
import { useIsMobile } from '#/shared/hooks'
import {
  countActiveFilters,
  useDiscoveryFiltersStore,
} from '../store/discoveryFiltersStore'
import type { DiscoveryFilters } from '../store/discoveryFiltersStore'
import {
  GetDiscoveryCreatorsCreatorType,
  GetDiscoveryCreatorsGender,
} from '#/shared/api/generated/model'
import {
  useListContentTypes,
  useListCountries,
  useListInterests,
} from '#/shared/api/generated/lookups/lookups'
import {
  AGE_OPTIONS,
  CheckboxOptionList,
  ENGAGEMENT_OPTIONS,
  FieldGroup,
  isInvalidDecimalRange,
  isInvalidNumberRange,
  MoneyInput,
  PillGroup,
  PillToggle,
  PLATFORM_OPTIONS,
} from './filterControls'

interface DiscoveryFilterPanelProps {
  open: boolean
  onClose: () => void
}

export function DiscoveryFilterPanel({
  open,
  onClose,
}: DiscoveryFilterPanelProps) {
  const isMobile = useIsMobile()
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

  const handleApply = () => {
    applyFilters()
    onClose()
  }

  const handleClear = () => {
    clearFilters()
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetPendingFilters()
      onClose()
    }
  }

  const countriesQuery = useListCountries({ active: true })
  const interestsQuery = useListInterests()
  const contentTypesQuery = useListContentTypes()

  const countryOptions =
    countriesQuery.data?.status === 200
      ? countriesQuery.data.data.items.map((country) => ({
          value: country.code,
          label: country.label_es,
        }))
      : []
  const interestOptions =
    interestsQuery.data?.status === 200
      ? interestsQuery.data.data.items.map((interest) => ({
          value: interest.slug,
          label: interest.label_es,
        }))
      : []
  const contentTypeOptions =
    contentTypesQuery.data?.status === 200
      ? contentTypesQuery.data.data.items.map((contentType) => ({
          value: contentType.slug,
          label: contentType.label_es,
        }))
      : []

  const validationErrors = getValidationErrors(pendingFilters)
  const hasValidationError = validationErrors.length > 0
  const activeCount = countActiveFilters(pendingFilters)
  const genderValue = pendingFilters.gender ?? 'all'
  const creatorType =
    pendingFilters.creator_type ?? GetDiscoveryCreatorsCreatorType.all
  const engagementValue = pendingFilters.engagement_rate_min

  const panelContent = (
    <>
      <DialogHeader className="px-6 pt-6 pb-4">
        <DialogTitle>{t`Filtros`}</DialogTitle>
        <DialogDescription>
          {t`Refiná la búsqueda de creadores para esta campaña.`}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-8 px-6 pb-6">
        <FilterSection title={t`Creador`}>
          <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <div className="space-y-4">
              <FieldGroup label={t`Plataformas`}>
                <PillGroup>
                  {PLATFORM_OPTIONS.map((option) => (
                    <PillToggle
                      key={option.value}
                      label={option.label}
                      selected={(pendingFilters.platforms ?? []).includes(
                        option.value,
                      )}
                      onToggle={() =>
                        toggleArrayValue(
                          'platforms',
                          pendingFilters.platforms,
                          option.value,
                        )
                      }
                    />
                  ))}
                </PillGroup>
              </FieldGroup>

              <FieldGroup label={t`País`}>
                <MultiSelectDropdown
                  placeholder={t`Seleccioná países`}
                  options={countryOptions}
                  values={pendingFilters.countries ?? []}
                  onToggle={(value) =>
                    toggleArrayValue(
                      'countries',
                      pendingFilters.countries,
                      value,
                    )
                  }
                />
              </FieldGroup>

              <FieldGroup label={t`Edad`}>
                <MultiSelectDropdown
                  placeholder={t`Seleccioná rangos de edad`}
                  options={AGE_OPTIONS.map((value) => ({
                    value,
                    label: value,
                  }))}
                  values={pendingFilters.age_buckets ?? []}
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
                <MultiSelectDropdown
                  placeholder={t`Seleccioná intereses`}
                  options={interestOptions}
                  values={pendingFilters.interests ?? []}
                  onToggle={(value) =>
                    toggleArrayValue(
                      'interests',
                      pendingFilters.interests,
                      value,
                    )
                  }
                />
              </FieldGroup>
            </div>

            <div className="space-y-4">
              <FieldGroup label={t`Tipo de creador`}>
                <PillGroup>
                  <PillToggle
                    label={t`Todos`}
                    selected={
                      creatorType === GetDiscoveryCreatorsCreatorType.all
                    }
                    onToggle={() =>
                      updatePendingFilters({
                        creator_type: GetDiscoveryCreatorsCreatorType.all,
                      })
                    }
                  />
                  <PillToggle
                    label={t`Influencer`}
                    selected={
                      creatorType === GetDiscoveryCreatorsCreatorType.influencer
                    }
                    onToggle={() =>
                      updatePendingFilters({
                        creator_type:
                          GetDiscoveryCreatorsCreatorType.influencer,
                      })
                    }
                  />
                </PillGroup>
              </FieldGroup>

              <FieldGroup label={t`Sexo`}>
                <PillGroup>
                  <PillToggle
                    label={t`Todos`}
                    selected={genderValue === 'all'}
                    onToggle={() => updatePendingFilters({ gender: undefined })}
                  />
                  <PillToggle
                    label={t`Masculino`}
                    selected={genderValue === GetDiscoveryCreatorsGender.male}
                    onToggle={() =>
                      updatePendingFilters({
                        gender: GetDiscoveryCreatorsGender.male,
                      })
                    }
                  />
                  <PillToggle
                    label={t`Femenino`}
                    selected={genderValue === GetDiscoveryCreatorsGender.female}
                    onToggle={() =>
                      updatePendingFilters({
                        gender: GetDiscoveryCreatorsGender.female,
                      })
                    }
                  />
                </PillGroup>
              </FieldGroup>

              <FieldGroup label={t`Tipo de contenido`}>
                <MultiSelectDropdown
                  placeholder={t`Seleccioná tipos de contenido`}
                  options={contentTypeOptions}
                  values={pendingFilters.content_types ?? []}
                  onToggle={(value) =>
                    toggleArrayValue(
                      'content_types',
                      pendingFilters.content_types,
                      value,
                    )
                  }
                />
              </FieldGroup>
            </div>
          </div>
        </FilterSection>

        <FilterSection title={t`Performance`}>
          <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <div className="space-y-4">
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

              <RangeField
                label={t`Vistas promedio`}
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
                label={t`Precio`}
                minValue={pendingFilters.price_min}
                maxValue={pendingFilters.price_max}
                inputType="text"
                moneyPrefix
                error={validationErrors.includes('price')}
                onMinChange={(value) =>
                  updatePendingFilters({ price_min: value })
                }
                onMaxChange={(value) =>
                  updatePendingFilters({ price_max: value })
                }
              />
            </div>

            <div className="space-y-4">
              <FieldGroup label={t`Engagement rate`}>
                <PillGroup>
                  {ENGAGEMENT_OPTIONS.map((option) => {
                    const value = option / 100
                    return (
                      <PillToggle
                        key={option}
                        label={t`Mayor a ${option}%`}
                        selected={engagementValue === value}
                        onToggle={() =>
                          updatePendingFilters({
                            engagement_rate_min:
                              engagementValue === value ? undefined : value,
                          })
                        }
                      />
                    )
                  })}
                </PillGroup>
              </FieldGroup>

              <RangeField
                label="CPM"
                minValue={pendingFilters.cpm_min}
                maxValue={pendingFilters.cpm_max}
                inputType="text"
                moneyPrefix
                error={validationErrors.includes('cpm')}
                onMinChange={(value) =>
                  updatePendingFilters({ cpm_min: value })
                }
                onMaxChange={(value) =>
                  updatePendingFilters({ cpm_max: value })
                }
              />
            </div>
          </div>
        </FilterSection>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-border px-6 py-4">
        <Button
          type="button"
          variant="link"
          size="sm"
          className="px-0 text-muted-foreground"
          onClick={handleClear}
        >
          {t`Limpiar filtros`}
        </Button>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground">
            {t`${activeCount} filtros activos`}
          </span>
          <Button
            type="button"
            onClick={handleApply}
            disabled={hasValidationError}
          >
            {t`Aplicar`}
          </Button>
        </div>
      </div>
    </>
  )

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="bottom"
          className="max-h-[90dvh] gap-0 overflow-y-auto rounded-t-3xl p-0 ease-[var(--ease-drawer)] data-[state=closed]:duration-200 data-[state=open]:duration-300"
        >
          {panelContent}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-2xl">
        {panelContent}
      </DialogContent>
    </Dialog>
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

function MultiSelectDropdown<T extends string>({
  placeholder,
  options,
  values,
  onToggle,
}: {
  placeholder: string
  options: Array<{ value: T; label: string }>
  values: T[]
  onToggle: (value: T) => void
}) {
  const selectedSet = new Set(values)
  const triggerLabel =
    values.length === 0
      ? placeholder
      : options
          .filter((option) => selectedSet.has(option.value))
          .map((option) => option.label)
          .join(', ')

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-border bg-input px-3 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <span
            className={cn(
              'truncate',
              values.length === 0 && 'text-muted-foreground',
            )}
          >
            {triggerLabel}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-50 w-[var(--radix-popover-trigger-width)] rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-lg"
        >
          <CheckboxOptionList
            options={options}
            values={values}
            onToggle={onToggle}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

function RangeField({
  label,
  minValue,
  maxValue,
  inputType,
  moneyPrefix,
  error,
  onMinChange,
  onMaxChange,
}: {
  label: string
  minValue?: number | string
  maxValue?: number | string
  inputType: 'number' | 'text'
  moneyPrefix?: boolean
  error: boolean
  onMinChange: (value: string) => void
  onMaxChange: (value: string) => void
}) {
  return (
    <FieldGroup label={label}>
      <div className="grid grid-cols-2 gap-3">
        <MoneyInput
          inputType={inputType}
          moneyPrefix={moneyPrefix}
          value={minValue}
          onChange={onMinChange}
          error={error}
          placeholder={t`Desde`}
        />
        <MoneyInput
          inputType={inputType}
          moneyPrefix={moneyPrefix}
          value={maxValue}
          onChange={onMaxChange}
          error={error}
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
