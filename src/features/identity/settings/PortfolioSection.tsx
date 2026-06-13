import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { t } from '@lingui/core/macro'
import { z } from 'zod'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  getGetMyCreatorSettingsQueryKey,
  useReplaceMyCreatorSampleVideos,
} from '#/shared/api/generated/creator/creator'
import type { CreatorSettingsResponse } from '#/shared/api/generated/model'

import { SectionSaveBar } from './SectionSaveBar'

type SlotsState = [string, string, string]
type SlotErrors = [string | undefined, string | undefined, string | undefined]

const EMPTY_SLOTS: SlotsState = ['', '', '']
const EMPTY_ERRORS: SlotErrors = [undefined, undefined, undefined]
const SLOT_INDEXES = [0, 1, 2] as const
const URL_ERROR = 'Ingresá una URL válida que empiece con http:// o https://'
const httpUrlSchema = z
  .string()
  .url()
  .refine(
    (value) => value.startsWith('http://') || value.startsWith('https://'),
  )

interface PortfolioSectionProps {
  data: CreatorSettingsResponse
}

export function PortfolioSection({ data }: PortfolioSectionProps) {
  const queryClient = useQueryClient()
  const replaceSampleVideos = useReplaceMyCreatorSampleVideos()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const initialSlots = useMemo(() => toSlotsState(data), [data])
  const [slots, setSlots] = useState<SlotsState>(initialSlots)
  const errors = useMemo(() => validateSlots(slots), [slots])
  const hasErrors = errors.some(Boolean)
  const isDirty = hasVideoChanges(slots, data)

  useEffect(() => {
    setSlots(initialSlots)
    setSaveError(null)
  }, [initialSlots])

  const handleSave = useCallback(async () => {
    if (isSubmitting || hasErrors) return

    const videos = slots
      .filter((url) => url.trim() !== '')
      .map((url) => ({ url: url.trim() }))

    if (videos.length > 3) {
      setSaveError(t`No podés cargar más de 3 videos.`)
      return
    }

    setSaveError(null)
    setIsSubmitting(true)
    try {
      await replaceSampleVideos.mutateAsync({ data: { videos } })
      await queryClient.invalidateQueries({
        queryKey: getGetMyCreatorSettingsQueryKey(),
      })
    } catch (error) {
      setSaveError(extractErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }, [hasErrors, isSubmitting, queryClient, replaceSampleVideos, slots])

  return (
    <section className="flex min-h-full flex-col">
      <h1 className="text-2xl font-semibold text-foreground">{t`Portfolio`}</h1>
      <form
        className="mt-6 flex flex-1 flex-col"
        onSubmit={(event) => {
          event.preventDefault()
          void handleSave()
        }}
      >
        <div className="flex-1 space-y-4">
          {SLOT_INDEXES.map((index) => (
            <SampleVideoSlot
              key={index}
              index={index}
              url={slots[index]}
              error={errors[index]}
              initiallyFilled={initialSlots[index].trim() !== ''}
              onChange={(nextUrl) => {
                setSlots((current) => replaceSlot(current, index, nextUrl))
                setSaveError(null)
              }}
              onRemove={() => {
                setSlots((current) => replaceSlot(current, index, ''))
                setSaveError(null)
              }}
            />
          ))}
        </div>

        <SectionSaveBar
          isDirty={isDirty && !hasErrors}
          isSubmitting={isSubmitting}
          error={saveError}
          onSave={handleSave}
        />
      </form>
    </section>
  )
}

function SampleVideoSlot({
  index,
  url,
  error,
  initiallyFilled,
  onChange,
  onRemove,
}: {
  index: number
  url: string
  error?: string
  initiallyFilled: boolean
  onChange: (url: string) => void
  onRemove: () => void
}) {
  const inputId = `sample-video-${index}`
  const trimmedUrl = url.trim()
  const showReadOnlyUrl = initiallyFilled && trimmedUrl !== ''

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">
              {t`Video ${index + 1}`}
            </p>
            {trimmedUrl === '' ? (
              <span className="rounded-sm bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {t`Pendiente`}
              </span>
            ) : null}
          </div>

          {showReadOnlyUrl ? (
            <p className="break-all text-sm text-muted-foreground">
              {trimmedUrl}
            </p>
          ) : (
            <div className="max-w-xl space-y-2">
              <Label htmlFor={inputId}>{t`URL del video`}</Label>
              <Input
                id={inputId}
                type="text"
                inputMode="url"
                value={url}
                placeholder="https://..."
                onChange={(event) => onChange(event.target.value)}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${inputId}-error` : undefined}
              />
            </div>
          )}

          {error ? (
            <p id={`${inputId}-error`} className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        {trimmedUrl !== '' ? (
          <Button type="button" variant="outline" onClick={onRemove}>
            {t`Quitar link`}
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function toSlotsState(data: CreatorSettingsResponse): SlotsState {
  const initial: SlotsState = [...EMPTY_SLOTS]
  data.sample_videos.forEach((video, index) => {
    if (index < 3) initial[index] = video.url
  })
  return initial
}

function validateSlots(slots: SlotsState): SlotErrors {
  const errors: SlotErrors = [...EMPTY_ERRORS]

  slots.forEach((url, index) => {
    const trimmedUrl = url.trim()
    if (trimmedUrl === '') return
    if (!httpUrlSchema.safeParse(trimmedUrl).success) {
      errors[index] = URL_ERROR
    }
  })

  return errors
}

function hasVideoChanges(slots: SlotsState, data: CreatorSettingsResponse) {
  const currentUrls = slots.map((url) => url.trim()).filter((url) => url !== '')
  const initialUrls = data.sample_videos.map((video) => video.url)
  return !arraysEqual(currentUrls, initialUrls)
}

function arraysEqual(left: string[], right: string[]) {
  return (
    left.length === right.length && left.every((value, i) => value === right[i])
  )
}

function replaceSlot(
  slots: SlotsState,
  index: number,
  value: string,
): SlotsState {
  const next: SlotsState = [...slots]
  next[index] = value
  return next
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return t`No pudimos guardar los cambios. Intentá nuevamente.`
}
