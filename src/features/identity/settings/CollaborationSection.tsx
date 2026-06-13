import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useStore } from '@tanstack/react-form'
import { useQueryClient } from '@tanstack/react-query'
import { t } from '@lingui/core/macro'
import {
  BookOpen,
  Check,
  Clapperboard,
  GraduationCap,
  Laugh,
  LayoutTemplate,
  Megaphone,
  Mic,
  PackageOpen,
  Scissors,
  Sparkles,
  Star,
  Sun,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { z } from 'zod'

import { Button } from '#/components/ui/button'
import { Label } from '#/components/ui/label'
import { Switch } from '#/components/ui/switch'
import { cn } from '#/lib/utils'
import {
  getGetMyCreatorSettingsQueryKey,
  useUpdateMyCreatorProfileCollaboration,
} from '#/shared/api/generated/creator/creator'
import {
  useListContentTypes,
  useListInterests,
} from '#/shared/api/generated/lookups/lookups'
import type {
  CreatorSettingsResponse,
  UpdateCreatorCollaborationRequestCreatorKindsItem,
} from '#/shared/api/generated/model'
import { ApiError } from '#/shared/api/mutator'
import {
  applyBackendFieldErrors,
  firstErrorMessage,
  useAppForm,
} from '#/shared/ui/form'

import { SectionSaveBar } from './SectionSaveBar'

function getCreatorKinds() {
  return [
    { value: 'influencer', label: t`Influencer` },
    { value: 'ugc', label: t`UGC` },
  ] as const
}

const CONTENT_TYPE_ICONS: Record<string, LucideIcon> = {
  unboxing: PackageOpen,
  reviews: Star,
  product_demos: LayoutTemplate,
  lifestyle: Sparkles,
  storytelling: BookOpen,
  video_ads: Megaphone,
  faceless_clipping: Scissors,
  tutorials: GraduationCap,
  interviews: Mic,
  humor_sketches: Laugh,
  day_in_the_life: Sun,
  behind_the_scenes: Clapperboard,
}

export const CollaborationSectionSchema = z.object({
  creator_kinds: z
    .array(z.enum(['influencer', 'ugc']))
    .min(1, 'min_1')
    .max(2, 'max_2'),
  niches: z.array(z.string()).min(1, 'min_1').max(5, 'max_5'),
  content_types: z.array(z.string()).min(1, 'min_1'),
  barter_preference: z.boolean(),
})

type CollaborationSectionValues = z.infer<typeof CollaborationSectionSchema>

interface CollaborationSectionProps {
  data: CreatorSettingsResponse
}

interface Option {
  value: string
  label: string
}

export function CollaborationSection({ data }: CollaborationSectionProps) {
  const queryClient = useQueryClient()
  const updateCollaboration = useUpdateMyCreatorProfileCollaboration()
  const interestsQuery = useListInterests()
  const contentTypesQuery = useListContentTypes()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const defaultValues = useMemo(() => toFormValues(data), [data])

  const form = useAppForm({
    defaultValues,
    validators: {
      onSubmit: CollaborationSectionSchema,
    },
    onSubmit: async ({ value }) => {
      setSaveError(null)
      try {
        await updateCollaboration.mutateAsync({
          data: {
            creator_kinds: value.creator_kinds,
            niches: value.niches,
            content_types: value.content_types,
            barter_preference: value.barter_preference,
          },
        })
        await queryClient.invalidateQueries({
          queryKey: getGetMyCreatorSettingsQueryKey(),
        })
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.status === 422 &&
          applyBackendFieldErrors(form, error, {
            fallback: (message) => setSaveError(message),
          })
        ) {
          return
        }
        setSaveError(extractErrorMessage(error))
        throw error
      }
    },
  })

  const values = useStore(form.store, (state) => state.values)
  const isDirty = hasCollaborationChanges(values, data)
  const interestOptions = useMemo(
    () =>
      mergeSelectedOptions(
        interestsQuery.data?.status === 200
          ? interestsQuery.data.data.items.map((interest) => ({
              value: interest.slug,
              label: interest.label_es,
            }))
          : [],
        values.niches,
      ),
    [interestsQuery.data, values.niches],
  )
  const contentTypeOptions = useMemo(
    () =>
      mergeSelectedOptions(
        contentTypesQuery.data?.status === 200
          ? contentTypesQuery.data.data.items.map((contentType) => ({
              value: contentType.slug,
              label: contentType.label_es,
            }))
          : [],
        values.content_types,
      ),
    [contentTypesQuery.data, values.content_types],
  )

  const handleSave = useCallback(async () => {
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      await form.handleSubmit()
    } catch (error) {
      setSaveError(extractErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }, [form, isSubmitting])

  return (
    <section className="flex min-h-full flex-col">
      <h1 className="text-2xl font-semibold text-foreground">{t`Colaboraciones`}</h1>
      <form
        className="mt-6 flex flex-1 flex-col"
        onSubmit={(event) => {
          event.preventDefault()
          void handleSave()
        }}
      >
        <div className="flex-1 space-y-8">
          <form.AppField name="creator_kinds">
            {(field) => (
              <CreatorKindChips
                value={field.state.value}
                onChange={field.handleChange}
                onBlur={field.handleBlur}
                error={getFieldError(field)}
              />
            )}
          </form.AppField>

          <form.AppField name="niches">
            {(field) => (
              <InterestsPicker
                value={field.state.value}
                options={interestOptions}
                onChange={field.handleChange}
                onBlur={field.handleBlur}
                error={getFieldError(field)}
              />
            )}
          </form.AppField>

          <form.AppField name="content_types">
            {(field) => (
              <ContentTypesPicker
                value={field.state.value}
                options={contentTypeOptions}
                onChange={field.handleChange}
                onBlur={field.handleBlur}
                error={getFieldError(field)}
              />
            )}
          </form.AppField>

          <form.AppField name="barter_preference">
            {(field) => (
              <BarterToggle
                value={field.state.value}
                onChange={field.handleChange}
                onBlur={field.handleBlur}
              />
            )}
          </form.AppField>
        </div>

        <SectionSaveBar
          isDirty={isDirty}
          isSubmitting={isSubmitting}
          error={saveError}
          onSave={handleSave}
        />
      </form>
    </section>
  )
}

function CreatorKindChips({
  value,
  onChange,
  onBlur,
  error,
}: {
  value: UpdateCreatorCollaborationRequestCreatorKindsItem[]
  onChange: (value: UpdateCreatorCollaborationRequestCreatorKindsItem[]) => void
  onBlur: () => void
  error?: string
}) {
  const hintId = 'creator-kind-min-hint'
  const creatorKinds = useMemo(() => getCreatorKinds(), [])

  return (
    <FieldGroup
      label={t`Tipo de colaboración`}
      hint={t`Debe seleccionar al menos uno`}
      error={error}
      hintId={hintId}
    >
      <div className="flex flex-wrap gap-2">
        {creatorKinds.map((option) => {
          const selected = value.includes(option.value)
          const disabled = selected && value.length === 1

          return (
            <SelectionChip
              key={option.value}
              label={option.label}
              selected={selected}
              disabled={disabled}
              ariaDescribedBy={disabled ? hintId : undefined}
              title={disabled ? t`Debe seleccionar al menos uno` : undefined}
              onBlur={onBlur}
              onToggle={() => {
                if (disabled) return
                onChange(toggleValue(value, option.value))
              }}
            />
          )
        })}
      </div>
    </FieldGroup>
  )
}

function InterestsPicker({
  value,
  options,
  onChange,
  onBlur,
  error,
}: {
  value: string[]
  options: Option[]
  onChange: (value: string[]) => void
  onBlur: () => void
  error?: string
}) {
  return (
    <FieldGroup
      label={t`Nichos`}
      hint={t`${value.length} de 5 seleccionados`}
      error={error}
    >
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value.includes(option.value)
          const disabled =
            (selected && value.length === 1) || (!selected && value.length >= 5)

          return (
            <SelectionChip
              key={option.value}
              label={option.label}
              selected={selected}
              disabled={disabled}
              title={
                selected && value.length === 1
                  ? t`Debe seleccionar al menos uno`
                  : !selected && value.length >= 5
                    ? t`Máximo 5 nichos`
                    : undefined
              }
              onBlur={onBlur}
              onToggle={() => {
                if (disabled) return
                onChange(toggleValue(value, option.value))
              }}
            />
          )
        })}
      </div>
    </FieldGroup>
  )
}

function ContentTypesPicker({
  value,
  options,
  onChange,
  onBlur,
  error,
}: {
  value: string[]
  options: Option[]
  onChange: (value: string[]) => void
  onBlur: () => void
  error?: string
}) {
  return (
    <FieldGroup
      label={t`Tipos de contenido`}
      hint={t`${value.length} seleccionados`}
      error={error}
    >
      <div className="flex flex-wrap gap-2.5">
        {options.map((option) => {
          const selected = value.includes(option.value)
          const disabled = selected && value.length === 1
          const Icon = CONTENT_TYPE_ICONS[option.value] ?? Sparkles

          return (
            <SelectionChip
              key={option.value}
              label={option.label}
              selected={selected}
              disabled={disabled}
              icon={Icon}
              className="h-12 rounded-md"
              title={disabled ? t`Debe seleccionar al menos uno` : undefined}
              onBlur={onBlur}
              onToggle={() => {
                if (disabled) return
                onChange(toggleValue(value, option.value))
              }}
            />
          )
        })}
      </div>
    </FieldGroup>
  )
}

function BarterToggle({
  value,
  onChange,
  onBlur,
}: {
  value: boolean
  onChange: (value: boolean) => void
  onBlur: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-card px-4 py-3">
      <div className="space-y-1">
        <Label htmlFor="barter-preference">{t`Acepto canjes`}</Label>
        <p className="text-sm text-muted-foreground">
          {t`Las marcas pueden proponerte colaboraciones con producto como compensación.`}
        </p>
      </div>
      <Switch
        id="barter-preference"
        checked={value}
        onCheckedChange={onChange}
        onBlur={onBlur}
      />
    </div>
  )
}

function FieldGroup({
  label,
  hint,
  error,
  hintId,
  children,
}: {
  label: string
  hint: string
  error?: string
  hintId?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-sm font-medium text-muted-foreground">
          {label}
        </Label>
        <p
          id={hintId}
          className={cn(
            'text-xs',
            error ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {error ?? hint}
        </p>
      </div>
      {children}
    </div>
  )
}

function SelectionChip({
  label,
  selected,
  disabled,
  icon: Icon,
  className,
  title,
  ariaDescribedBy,
  onToggle,
  onBlur,
}: {
  label: string
  selected: boolean
  disabled: boolean
  icon?: LucideIcon
  className?: string
  title?: string
  ariaDescribedBy?: string
  onToggle: () => void
  onBlur: () => void
}) {
  return (
    <Button
      type="button"
      variant="outline"
      role="checkbox"
      aria-checked={selected}
      aria-describedby={ariaDescribedBy}
      disabled={disabled}
      title={title}
      onClick={onToggle}
      onBlur={onBlur}
      className={cn(
        'h-10 rounded-full',
        selected &&
          'border-primary bg-primary/10 font-semibold text-primary hover:bg-primary/10',
        className,
      )}
    >
      {Icon ? (
        <Icon className={cn('size-4', selected && 'text-primary')} />
      ) : selected ? (
        <Check className="size-4" />
      ) : null}
      {label}
    </Button>
  )
}

function toggleValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value]
}

function mergeSelectedOptions(options: Option[], selected: string[]): Option[] {
  const known = new Set(options.map((option) => option.value))
  const missing = selected
    .filter((value) => !known.has(value))
    .map((value) => ({ value, label: value }))
  return [...options, ...missing]
}

function toFormValues(
  data: CreatorSettingsResponse,
): CollaborationSectionValues {
  return {
    creator_kinds: data.collaboration.creator_kinds,
    niches: data.collaboration.niches,
    content_types: data.collaboration.content_types,
    barter_preference: data.collaboration.barter_preference,
  }
}

function hasCollaborationChanges(
  value: CollaborationSectionValues,
  data: CreatorSettingsResponse,
) {
  const baseline = toFormValues(data)

  return (
    !sameSet(value.creator_kinds, baseline.creator_kinds) ||
    !sameSet(value.niches, baseline.niches) ||
    !sameSet(value.content_types, baseline.content_types) ||
    value.barter_preference !== baseline.barter_preference
  )
}

function sameSet(a: string[], b: string[]) {
  return JSON.stringify([...a].sort()) === JSON.stringify([...b].sort())
}

function getFieldError(field: {
  state: { meta: { errors: unknown[]; isTouched: boolean; isBlurred: boolean } }
}) {
  const meta = field.state.meta
  if (meta.errors.length === 0 || (!meta.isTouched && !meta.isBlurred)) {
    return undefined
  }
  return firstErrorMessage(meta.errors)
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return t`No pudimos guardar los cambios. Intentá nuevamente.`
}
