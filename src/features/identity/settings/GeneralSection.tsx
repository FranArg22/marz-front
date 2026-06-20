import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '@tanstack/react-form'
import { useQueryClient } from '@tanstack/react-query'
import { t } from '@lingui/core/macro'
import { LogOut, Upload, User } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import type {
  AvatarPresignRequestContentType,
  CreatorSettingsResponse,
  UpdateCreatorContactRequest,
} from '#/shared/api/generated/model'
import {
  getGetMyCreatorSettingsQueryKey,
  useSetMyCreatorAvatar,
  useUpdateMyCreatorProfileContact,
} from '#/shared/api/generated/creator/creator'
import { usePresignCreatorAvatar } from '#/shared/api/generated/onboarding/onboarding'
import { useSignOut } from '#/features/identity/hooks/useSignOut'
import { useAppForm } from '#/shared/ui/form'

import { SectionSaveBar } from './SectionSaveBar'
import { SettingsCard, SettingsRow } from './SettingsCard'

const MAX_BYTES = 5 * 1024 * 1024

const ACCEPTED_TYPES: Record<string, AvatarPresignRequestContentType> = {
  'image/jpeg': 'image/jpeg',
  'image/png': 'image/png',
  'image/webp': 'image/webp',
}

function createGeneralSectionSchema() {
  return z.object({
    full_name: z
      .string()
      .min(1, t`Ingresá tu nombre completo`)
      .max(200),
    phone_e164: z
      .string()
      .regex(
        /^\+[1-9]\d{1,14}$/,
        t`Usá formato E.164, por ejemplo +5491123456789`,
      )
      .optional()
      .or(z.literal('')),
    birthday: z.string().optional(),
    country: z
      .string()
      .length(2, t`Seleccioná un país`)
      .optional()
      .or(z.literal('')),
    city: z.string().max(200).optional(),
    shipping_address: z.string().max(500).optional(),
  })
}

type GeneralSectionValues = z.infer<
  ReturnType<typeof createGeneralSectionSchema>
>

interface GeneralSectionProps {
  data: CreatorSettingsResponse
}

export function GeneralSection({ data }: GeneralSectionProps) {
  const queryClient = useQueryClient()
  const signOut = useSignOut()
  const presignAvatar = usePresignCreatorAvatar()
  const setAvatar = useSetMyCreatorAvatar()
  const updateContact = useUpdateMyCreatorProfileContact()
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [invalidFileError, setInvalidFileError] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>(data.avatar_url)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const defaultValues = useMemo(() => toFormValues(data), [data])
  const generalSectionSchema = useMemo(() => createGeneralSectionSchema(), [])

  useEffect(() => {
    setAvatarPreview(data.avatar_url)
    setPendingFile(null)
    setInvalidFileError(null)
  }, [data.avatar_url])

  const form = useAppForm({
    defaultValues,
    validators: {
      onSubmit: generalSectionSchema,
    },
    onSubmit: async ({ value }) => {
      setSaveError(null)
      try {
        await submitChanges({
          value,
          data,
          pendingFile,
          presignAvatar,
          setAvatar,
          updateContact,
          queryClient,
          onAvatarSaved: () => setPendingFile(null),
        })
      } catch (error) {
        setSaveError(extractErrorMessage(error))
        throw error
      }
    },
  })

  const values = useStore(form.store, (state) => state.values)
  const isDirty = pendingFile !== null || hasContactChanges(values, data)
  const handleFileSelected = useCallback(async (file: File) => {
    if (file.size > MAX_BYTES) {
      const message = t`El archivo supera los 5MB permitidos.`
      toast.error(message)
      setInvalidFileError(message)
      setSaveError(message)
      return
    }

    if (!ACCEPTED_TYPES[file.type]) {
      const message = t`Solo se permiten imágenes JPEG, PNG o WebP.`
      toast.error(message)
      setInvalidFileError(message)
      setSaveError(message)
      return
    }

    try {
      const preview = await fileToDataUrl(file)
      setAvatarPreview(preview)
      setPendingFile(file)
      setInvalidFileError(null)
      setSaveError(null)
    } catch {
      const message = t`No pudimos leer la imagen. Intentá de nuevo.`
      toast.error(message)
      setInvalidFileError(message)
      setSaveError(message)
    }
  }, [])

  const handleSave = useCallback(async () => {
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      if (invalidFileError) {
        setSaveError(invalidFileError)
        return
      }

      await form.handleSubmit()
    } catch (error) {
      setSaveError(extractErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }, [form, invalidFileError, isSubmitting])

  return (
    <section className="flex min-h-full flex-col">
      <h1 className="text-2xl font-semibold text-foreground">{t`General`}</h1>
      <form
        className="mt-6 flex flex-1 flex-col"
        onSubmit={(event) => {
          event.preventDefault()
          void handleSave()
        }}
      >
        <div className="flex-1">
          <SettingsCard
            title={t`Perfil`}
            description={t`Datos privados y de contacto del creador.`}
          >
            <SettingsRow label={t`Foto de perfil`}>
              <AvatarField
                preview={avatarPreview}
                onFileSelected={handleFileSelected}
              />
            </SettingsRow>

            <SettingsRow label={t`Nombre completo`} required>
              <form.AppField name="full_name">
                {(field) => (
                  <field.TextField
                    aria-label={t`Nombre completo`}
                    autoComplete="name"
                  />
                )}
              </form.AppField>
            </SettingsRow>

            <SettingsRow
              label={t`Email`}
              hint={t`Para login y notificaciones.`}
            >
              <Input
                id="creator-settings-email"
                value={data.contact.email}
                disabled
                aria-label={t`Email`}
              />
            </SettingsRow>

            <SettingsRow label={t`Teléfono`} hint={t`Con código de país.`}>
              <form.AppField name="phone_e164">
                {(field) => (
                  <field.TextField
                    aria-label={t`Teléfono`}
                    placeholder="+5491123456789"
                    autoComplete="tel"
                  />
                )}
              </form.AppField>
            </SettingsRow>

            <SettingsRow label={t`Fecha de cumpleaños`}>
              <form.AppField
                name="birthday"
                validators={{
                  onSubmit: ({ value }) =>
                    value && !isAtLeast18(value)
                      ? t`Tenés que ser mayor de 18 años.`
                      : undefined,
                }}
              >
                {(field) => (
                  <field.TextField
                    aria-label={t`Fecha de cumpleaños`}
                    type="date"
                    autoComplete="bday"
                  />
                )}
              </form.AppField>
            </SettingsRow>

            <SettingsRow label={t`País`}>
              <form.AppField name="country">
                {(field) => (
                  <field.TextField
                    aria-label={t`País`}
                    placeholder="AR"
                    maxLength={2}
                    autoComplete="country"
                  />
                )}
              </form.AppField>
            </SettingsRow>

            <SettingsRow label={t`Ciudad`}>
              <form.AppField name="city">
                {(field) => (
                  <field.TextField
                    aria-label={t`Ciudad`}
                    autoComplete="address-level2"
                  />
                )}
              </form.AppField>
            </SettingsRow>

            <SettingsRow
              label={t`Dirección para envíos`}
              hint={t`Para productos y canjes.`}
              align="start"
            >
              <form.AppField name="shipping_address">
                {(field) => (
                  <field.TextareaField
                    aria-label={t`Dirección para envíos`}
                    autoComplete="street-address"
                    rows={3}
                  />
                )}
              </form.AppField>
            </SettingsRow>
          </SettingsCard>
        </div>

        <SectionSaveBar
          isDirty={isDirty}
          isSubmitting={isSubmitting}
          error={saveError}
          onSave={handleSave}
          leftSlot={
            <Button
              type="button"
              variant="outline"
              onClick={() => void signOut()}
            >
              <LogOut className="size-4" />
              {t`Cerrar sesión`}
            </Button>
          }
        />
      </form>
    </section>
  )
}

function AvatarField({
  preview,
  onFileSelected,
}: {
  preview: string
  onFileSelected: (file: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex items-center gap-4">
      {preview ? (
        <img
          src={preview}
          alt={t`Preview de avatar`}
          className="size-20 rounded-full object-cover"
        />
      ) : (
        <div className="flex size-20 items-center justify-center rounded-full border border-border bg-card">
          <User className="size-6 text-muted-foreground" />
        </div>
      )}
      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="size-4" />
          {preview ? t`Cambiar foto` : t`Subir foto`}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) onFileSelected(file)
            event.target.value = ''
          }}
          className="hidden"
          aria-label={t`Seleccionar imagen`}
        />
        <p className="text-xs text-muted-foreground">
          {t`JPEG, PNG o WebP. Máximo 5MB.`}
        </p>
      </div>
    </div>
  )
}

async function submitChanges({
  value,
  data,
  pendingFile,
  presignAvatar,
  setAvatar,
  updateContact,
  queryClient,
  onAvatarSaved,
}: {
  value: GeneralSectionValues
  data: CreatorSettingsResponse
  pendingFile: File | null
  presignAvatar: ReturnType<typeof usePresignCreatorAvatar>
  setAvatar: ReturnType<typeof useSetMyCreatorAvatar>
  updateContact: ReturnType<typeof useUpdateMyCreatorProfileContact>
  queryClient: ReturnType<typeof useQueryClient>
  onAvatarSaved: () => void
}) {
  if (pendingFile) {
    const contentType = ACCEPTED_TYPES[pendingFile.type]
    if (!contentType) {
      throw new Error(t`Solo se permiten imágenes JPEG, PNG o WebP.`)
    }

    const presignResult = await presignAvatar.mutateAsync({
      data: {
        filename: pendingFile.name,
        content_type: contentType,
        size_bytes: pendingFile.size,
      },
    })

    if (presignResult.status !== 200) {
      throw new Error(t`Error al preparar la subida de la imagen.`)
    }

    const upload = await fetch(presignResult.data.upload_url, {
      method: 'PUT',
      headers: {
        'Content-Type': pendingFile.type,
        ...presignResult.data.required_headers,
      },
      body: pendingFile,
    })

    if (!upload.ok) {
      throw new Error(t`Error al subir la imagen. Intentá de nuevo.`)
    }

    const avatarResult = await setAvatar.mutateAsync({
      data: { s3_key: presignResult.data.s3_key },
    })

    if (avatarResult.status !== 200) {
      throw new Error(t`Error al guardar el avatar. Intentá de nuevo.`)
    }

    await queryClient.invalidateQueries({
      queryKey: getGetMyCreatorSettingsQueryKey(),
    })
    onAvatarSaved()
  }

  const changedFields = getChangedContactFields(value, data)
  if (Object.keys(changedFields).length === 0) return

  const contactResult = await updateContact.mutateAsync({
    data: changedFields,
  })
  if (contactResult.status !== 200) {
    throw new Error(
      t`Error al guardar los datos de contacto. Intentá de nuevo.`,
    )
  }

  await queryClient.invalidateQueries({
    queryKey: getGetMyCreatorSettingsQueryKey(),
  })
}

function toFormValues(data: CreatorSettingsResponse): GeneralSectionValues {
  return {
    full_name: data.contact.full_name,
    phone_e164: data.contact.phone_e164 ?? '',
    birthday: data.contact.birthday ?? '',
    country: data.contact.country ?? '',
    city: data.contact.city ?? '',
    shipping_address: data.contact.shipping_address ?? '',
  }
}

function hasContactChanges(
  value: GeneralSectionValues,
  data: CreatorSettingsResponse,
) {
  return Object.keys(getChangedContactFields(value, data)).length > 0
}

function getChangedContactFields(
  value: GeneralSectionValues,
  data: CreatorSettingsResponse,
): UpdateCreatorContactRequest {
  const baseline = toFormValues(data)
  const changed: UpdateCreatorContactRequest = {}

  if (value.full_name !== baseline.full_name) {
    changed.full_name = value.full_name
  }
  if (value.phone_e164 !== baseline.phone_e164) {
    changed.phone_e164 = value.phone_e164
  }
  if (value.birthday !== baseline.birthday) {
    changed.birthday = value.birthday
  }
  if (value.country !== baseline.country) {
    changed.country = value.country
  }
  if (value.city !== baseline.city) {
    changed.city = value.city
  }
  if (value.shipping_address !== baseline.shipping_address) {
    changed.shipping_address = value.shipping_address
  }

  return changed
}

function isAtLeast18(value: string): boolean {
  const birthday = parseDateInput(value)
  if (!birthday) return false

  const today = new Date()
  const minBirthday = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate(),
  )
  return birthday <= minBirthday
}

function parseDateInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  const date = new Date(year, month, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null
  }
  return date
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return t`No pudimos guardar los cambios. Intentá nuevamente.`
}
