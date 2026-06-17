import { useEffect, useMemo, useRef } from 'react'
import { t } from '@lingui/core/macro'
import type { AnyFormApi } from '@tanstack/react-form'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '#/components/ui/button'
import {
  getGetBrandSettingsQueryKey,
  useGetBrandSettings,
  usePatchBrandSettings,
} from '#/shared/api/generated/identity/identity'
import type { BrandSettingsResponse } from '#/shared/api/generated/model/brandSettingsResponse'
import type { PatchBrandSettingsRequest } from '#/shared/api/generated/model/patchBrandSettingsRequest'
import { ApiError } from '#/shared/api/mutator'
import { useAppForm } from '#/shared/ui/form'

import { BrandCard } from './BrandCard'
import { ProfileCard } from './ProfileCard'

const schema = z.object({
  full_name: z.string().min(1).max(200),
  phone_e164: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/)
    .nullable()
    .optional(),
  name: z.string().min(1).max(200),
  website_url: z
    .string()
    .url()
    .refine((u) => u.startsWith('https://'), 'Must be https'),
  logo_s3_key: z.string().nullable().optional(),
})

type GeneralFormValues = z.infer<typeof schema>
type GeneralFormField = keyof GeneralFormValues

const currentLogoSentinel = '__current_brand_logo__'

const emptyValues: GeneralFormValues = {
  full_name: '',
  phone_e164: null,
  name: '',
  website_url: '',
  logo_s3_key: null,
}

export function GeneralSection() {
  const queryClient = useQueryClient()
  const settingsQuery = useGetBrandSettings()
  const patchSettings = usePatchBrandSettings()
  const initialValuesRef = useRef<GeneralFormValues | null>(null)

  const settings =
    settingsQuery.data?.status === 200 ? settingsQuery.data.data : null

  const form = useAppForm({
    defaultValues: emptyValues,
    validators: {
      onChange: schema,
      onSubmit: schema,
    },
    onSubmit: async ({ value, formApi }) => {
      const initialValues = initialValuesRef.current
      if (!initialValues) return

      const normalizedValue = normalizeValues(value)
      const diff = buildDiff(initialValues, normalizedValue)
      if (Object.keys(diff).length === 0) return

      try {
        const response = await patchSettings.mutateAsync({ data: diff })
        if (response.status === 200) {
          initialValuesRef.current = normalizedValue
          formApi.reset(normalizedValue)
          await queryClient.invalidateQueries({
            queryKey: getGetBrandSettingsQueryKey(),
          })
          toast.success(t`Ajustes guardados`)
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 422) {
          applyFieldErrors(formApi, getFieldErrors(error))
          return
        }

        throw error
      }
    },
  })

  useEffect(() => {
    if (!settings) return

    const nextValues = responseToValues(settings)
    initialValuesRef.current = nextValues
    form.reset(nextValues)
  }, [form, settings])

  const email = settings?.profile.email ?? ''
  const currentLogoUrl = settings?.brand.logo_url ?? null
  const brandName = useMemo(
    () => settings?.brand.name ?? form.state.values.name,
    [form.state.values.name, settings?.brand.name],
  )

  if (settingsQuery.isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        {t`Cargando ajustes...`}
      </div>
    )
  }

  if (settingsQuery.isError || !settings) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-destructive">
        {t`No pudimos cargar los ajustes.`}
      </div>
    )
  }

  return (
    <form
      className="flex flex-col gap-6"
      noValidate
      action={() => void form.handleSubmit()}
    >
      <ProfileCard form={form} email={email} />
      <BrandCard
        form={form}
        currentLogoUrl={currentLogoUrl}
        brandName={brandName}
      />

      <div className="flex justify-end">
        <form.AppForm>
          <Button
            type="submit"
            disabled={patchSettings.isPending}
            className="min-w-32"
          >
            {patchSettings.isPending ? t`Guardando...` : t`Guardar`}
          </Button>
        </form.AppForm>
      </div>
    </form>
  )
}

function responseToValues(settings: BrandSettingsResponse): GeneralFormValues {
  return {
    full_name: settings.profile.full_name,
    phone_e164: settings.profile.phone_e164 ?? null,
    name: settings.brand.name,
    website_url: settings.brand.website_url ?? '',
    logo_s3_key: settings.brand.logo_url ? currentLogoSentinel : null,
  }
}

function normalizeValues(value: GeneralFormValues): GeneralFormValues {
  return {
    ...value,
    full_name: value.full_name.trim(),
    phone_e164:
      value.phone_e164 && value.phone_e164.trim() !== ''
        ? value.phone_e164.trim()
        : null,
    name: value.name.trim(),
    website_url: value.website_url.trim(),
    logo_s3_key: value.logo_s3_key ?? null,
  }
}

function buildDiff(
  initialValues: GeneralFormValues,
  nextValues: GeneralFormValues,
): PatchBrandSettingsRequest {
  const diff: PatchBrandSettingsRequest = {}

  if (nextValues.full_name !== initialValues.full_name) {
    diff.full_name = nextValues.full_name
  }
  if (nextValues.phone_e164 !== initialValues.phone_e164) {
    diff.phone_e164 = nextValues.phone_e164
  }
  if (nextValues.name !== initialValues.name) {
    diff.name = nextValues.name
  }
  if (nextValues.website_url !== initialValues.website_url) {
    diff.website_url = nextValues.website_url
  }
  if (nextValues.logo_s3_key !== initialValues.logo_s3_key) {
    diff.logo_s3_key = nextValues.logo_s3_key
  }

  return diff
}

function getFieldErrors(
  error: ApiError,
): Partial<Record<GeneralFormField, string>> {
  const fieldErrors = extractFieldErrors(error)
  if (!fieldErrors) return {}

  const result: Partial<Record<GeneralFormField, string>> = {}
  for (const field of Object.keys(emptyValues) as GeneralFormField[]) {
    const message = fieldErrors[field]?.[0]
    if (message) result[field] = message
  }
  return result
}

function applyFieldErrors(
  form: AnyFormApi,
  errors: Partial<Record<GeneralFormField, string>>,
) {
  for (const [field, message] of Object.entries(errors)) {
    if (!message) continue
    form.setFieldMeta(field, (prev) => ({
      ...prev,
      errorMap: { ...prev.errorMap, onServer: message },
      isTouched: true,
      isBlurred: true,
    }))
  }
}

function extractFieldErrors(error: ApiError) {
  if (error.details?.field_errors) return error.details.field_errors

  const body = error.body
  if (!body || typeof body !== 'object') return null

  const directFields = 'fields' in body ? body.fields : null
  if (isFieldErrorRecord(directFields)) return directFields

  const errorValue = 'error' in body ? body.error : null
  if (!errorValue || typeof errorValue !== 'object') return null

  const errorFields = 'fields' in errorValue ? errorValue.fields : null
  if (isFieldErrorRecord(errorFields)) return errorFields

  const details = 'details' in errorValue ? errorValue.details : null
  if (!details || typeof details !== 'object') return null

  const detailFieldErrors =
    'field_errors' in details ? details.field_errors : null
  if (isFieldErrorRecord(detailFieldErrors)) return detailFieldErrors

  return null
}

function isFieldErrorRecord(value: unknown): value is Record<string, string[]> {
  return (
    !!value &&
    typeof value === 'object' &&
    Object.values(value).every(
      (messages) =>
        Array.isArray(messages) &&
        messages.every((message) => typeof message === 'string'),
    )
  )
}
