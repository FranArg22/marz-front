import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { t } from '@lingui/core/macro'

import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  getGetMyCreatorSettingsQueryKey,
  useUpdateMyCreatorRates,
} from '#/shared/api/generated/creator/creator'
import type {
  CreatorSettingsChannel,
  CreatorSettingsChannelPlatform,
  CreatorSettingsRateFormat,
  CreatorSettingsResponse,
  UpdateCreatorRatesRequest,
  UpdateCreatorRatesRequestChannelRatesItemFormat,
} from '#/shared/api/generated/model'

import { SectionSaveBar } from './SectionSaveBar'

const DELETE_RATE_MESSAGE =
  'No se puede eliminar una tarifa declarada; ingresá un monto válido o dejá el valor anterior'
const MUST_BE_POSITIVE = 'must_be_positive'
const FOLLOWERS_FORMATTER = new Intl.NumberFormat()

const PLATFORM_FORMATS: Record<
  CreatorSettingsChannelPlatform,
  CreatorSettingsRateFormat
> = {
  instagram: 'ig_reel',
  tiktok: 'tiktok_video',
  youtube: 'yt_short',
}

type RatesFormValues = {
  channelRates: Record<string, string>
  ugcRateAmount: string
}

type RatesFormErrors = {
  channelRates: Record<string, string>
  ugcRateAmount?: string
}

interface RatesSectionProps {
  data: CreatorSettingsResponse
}

export function RatesSection({ data }: RatesSectionProps) {
  const queryClient = useQueryClient()
  const updateRates = useUpdateMyCreatorRates()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const initialValues = useMemo(() => toFormValues(data), [data])
  const [values, setValues] = useState<RatesFormValues>(initialValues)
  const [errors, setErrors] = useState<RatesFormErrors>({ channelRates: {} })
  const changedChannelRates = getChangedChannelRates(values, data)
  const ugcRateChanged = values.ugcRateAmount !== (data.ugc_rate?.amount ?? '')
  const isDirty = hasChannelRateChanges(values, data) || ugcRateChanged

  useEffect(() => {
    setValues(initialValues)
    setErrors({ channelRates: {} })
    setSaveError(null)
  }, [initialValues])

  const handleSave = useCallback(async () => {
    if (isSubmitting) return

    const validation = validateRatesForm(values, data)
    setErrors(validation.errors)
    setSaveError(null)
    if (!validation.valid) return

    const body: UpdateCreatorRatesRequest = {}
    if (changedChannelRates.length > 0) {
      body.channel_rates = changedChannelRates
    }
    if (ugcRateChanged) {
      body.ugc_rate_amount = values.ugcRateAmount
    }

    setIsSubmitting(true)
    try {
      await updateRates.mutateAsync({ data: body })
      await queryClient.invalidateQueries({
        queryKey: getGetMyCreatorSettingsQueryKey(),
      })
    } catch (error) {
      setSaveError(extractErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }, [
    changedChannelRates,
    data,
    isSubmitting,
    queryClient,
    ugcRateChanged,
    updateRates,
    values,
  ])

  return (
    <section className="flex min-h-full flex-col">
      <h1 className="text-2xl font-semibold text-foreground">{t`Redes y tarifas`}</h1>
      <form
        className="mt-6 flex flex-1 flex-col"
        onSubmit={(event) => {
          event.preventDefault()
          void handleSave()
        }}
      >
        <div className="flex-1 space-y-6">
          {data.channels.map((channel) => {
            const format = PLATFORM_FORMATS[channel.platform]
            const rateKey = getRateKey(channel.channel_id, format)

            return (
              <ChannelRatesCard
                key={channel.channel_id}
                channel={channel}
                format={format}
                amount={values.channelRates[rateKey] ?? ''}
                error={errors.channelRates[rateKey]}
                onAmountChange={(amount) => {
                  setValues((current) => ({
                    ...current,
                    channelRates: {
                      ...current.channelRates,
                      [rateKey]: amount,
                    },
                  }))
                  setErrors((current) => ({
                    ...current,
                    channelRates: omitKey(current.channelRates, rateKey),
                  }))
                }}
              />
            )
          })}

          <UgcRateRow
            amount={values.ugcRateAmount}
            error={errors.ugcRateAmount}
            onAmountChange={(amount) => {
              setValues((current) => ({ ...current, ugcRateAmount: amount }))
              setErrors((current) => ({
                ...current,
                ugcRateAmount: undefined,
              }))
            }}
          />
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

function ChannelRatesCard({
  channel,
  format,
  amount,
  error,
  onAmountChange,
}: {
  channel: CreatorSettingsChannel
  format: CreatorSettingsRateFormat
  amount: string
  error?: string
  onAmountChange: (amount: string) => void
}) {
  const inputId = `rate-${channel.channel_id}-${format}`

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="grid gap-3 md:grid-cols-3">
        <ReadOnlyMetric
          label={t`Plataforma`}
          value={platformLabel(channel.platform)}
        />
        <ReadOnlyMetric label={t`Handle`} value={channel.handle} />
        <ReadOnlyMetric
          label={t`Seguidores`}
          value={formatFollowers(channel.followers)}
        />
      </div>
      <div className="mt-4 max-w-sm space-y-2">
        <Label htmlFor={inputId}>{formatLabel(format)}</Label>
        <div className="flex items-center gap-2">
          <Input
            id={inputId}
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(event) => onAmountChange(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : undefined}
          />
          <span className="text-sm font-medium text-muted-foreground">USD</span>
        </div>
        {error ? (
          <p id={`${inputId}-error`} className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function UgcRateRow({
  amount,
  error,
  onAmountChange,
}: {
  amount: string
  error?: string
  onAmountChange: (amount: string) => void
}) {
  const inputId = 'ugc-rate-amount'

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="max-w-sm space-y-2">
        <Label htmlFor={inputId}>{t`Tarifa UGC`}</Label>
        <div className="flex items-center gap-2">
          <Input
            id={inputId}
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(event) => onAmountChange(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : undefined}
          />
          <span className="text-sm font-medium text-muted-foreground">USD</span>
        </div>
        {error ? (
          <p id={`${inputId}-error`} className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function ReadOnlyMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm text-foreground">{value}</p>
    </div>
  )
}

export function validateRatesForm(
  values: RatesFormValues,
  data: CreatorSettingsResponse,
): { valid: boolean; errors: RatesFormErrors } {
  const errors: RatesFormErrors = { channelRates: {} }

  for (const channel of data.channels) {
    const format = PLATFORM_FORMATS[channel.platform]
    const key = getRateKey(channel.channel_id, format)
    const amount = values.channelRates[key] ?? ''
    const original = getOriginalChannelRateAmount(
      data,
      channel.channel_id,
      format,
    )

    if (amount.trim() === '') {
      if (original) errors.channelRates[key] = DELETE_RATE_MESSAGE
      continue
    }

    if (!isPositiveDecimal(amount)) {
      errors.channelRates[key] = MUST_BE_POSITIVE
    }
  }

  if (
    values.ugcRateAmount.trim() !== '' &&
    !isPositiveDecimal(values.ugcRateAmount)
  ) {
    errors.ugcRateAmount = MUST_BE_POSITIVE
  }

  return {
    valid:
      Object.keys(errors.channelRates).length === 0 && !errors.ugcRateAmount,
    errors,
  }
}

function toFormValues(data: CreatorSettingsResponse): RatesFormValues {
  const channelRates: Record<string, string> = {}

  for (const channel of data.channels) {
    const format = PLATFORM_FORMATS[channel.platform]
    channelRates[getRateKey(channel.channel_id, format)] =
      channel.rates.find((rate) => rate.format === format)?.amount ?? ''
  }

  return {
    channelRates,
    ugcRateAmount: data.ugc_rate?.amount ?? '',
  }
}

function getChangedChannelRates(
  values: RatesFormValues,
  data: CreatorSettingsResponse,
) {
  return Object.entries(values.channelRates)
    .filter(([key, amount]) => {
      if (amount.trim() === '') return false

      const [channelId, format] = splitRateKey(key)
      const original = getOriginalChannelRateAmount(data, channelId, format)
      return original !== amount
    })
    .map(([key, amount]) => {
      const [channel_id, format] = splitRateKey(key)
      return { channel_id, format, amount }
    })
}

function hasChannelRateChanges(
  values: RatesFormValues,
  data: CreatorSettingsResponse,
) {
  return Object.entries(values.channelRates).some(([key, amount]) => {
    const [channelId, format] = splitRateKey(key)
    const original = getOriginalChannelRateAmount(data, channelId, format) ?? ''
    return original !== amount
  })
}

function getOriginalChannelRateAmount(
  data: CreatorSettingsResponse,
  channelId: string,
  format: CreatorSettingsRateFormat,
) {
  return data.channels
    .find((channel) => channel.channel_id === channelId)
    ?.rates.find((rate) => rate.format === format)?.amount
}

function getRateKey(channelId: string, format: CreatorSettingsRateFormat) {
  return `${channelId}:${format}`
}

function splitRateKey(
  key: string,
): [string, UpdateCreatorRatesRequestChannelRatesItemFormat] {
  const [channelId = '', format = 'ig_reel'] = key.split(':')
  return [channelId, format as UpdateCreatorRatesRequestChannelRatesItemFormat]
}

function isPositiveDecimal(value: string) {
  const trimmed = value.trim()
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return false
  return Number(trimmed) > 0
}

function platformLabel(platform: CreatorSettingsChannelPlatform) {
  if (platform === 'instagram') return 'Instagram'
  if (platform === 'tiktok') return 'TikTok'
  return 'YouTube'
}

function formatLabel(format: CreatorSettingsRateFormat) {
  if (format === 'ig_reel') return t`Reel de Instagram`
  if (format === 'tiktok_video') return t`Video de TikTok`
  return t`Short de YouTube`
}

function formatFollowers(followers: number | null) {
  return followers === null
    ? t`Sin datos`
    : FOLLOWERS_FORMATTER.format(followers)
}

function omitKey<T>(record: Record<string, T>, key: string) {
  const next = { ...record }
  delete next[key]
  return next
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return t`No pudimos guardar los cambios. Intentá nuevamente.`
}
