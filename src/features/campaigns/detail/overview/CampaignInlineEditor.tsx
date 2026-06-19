import { t } from '@lingui/core/macro'
import { useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  FileText,
  ImageUp,
  Pencil,
  RefreshCw,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ComponentProps, ReactNode } from 'react'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Switch } from '#/components/ui/switch'
import { Textarea } from '#/components/ui/textarea'
import { cn } from '#/lib/utils'
import type {
  Campaign,
  CampaignDetailResponse,
  UpdateCampaignRequest,
} from '#/shared/api/generated/model'
import { ApiError } from '#/shared/api/mutator'
import { formatPlatform } from '#/shared/utils/format'
import {
  usePresignBriefPdfMutation,
  usePresignImageMutation,
  useUpdateCampaignMutation,
} from '#/features/campaigns/wizard/mutations'
import {
  useCreatorTiersQuery,
  useInterestsQuery,
} from '#/features/campaigns/wizard/queries'

import { campaignDetailQueryKey } from '../useCampaignDetailQuery'
import { campaignOverviewQueryKey } from '../useCampaignOverviewQuery'

const ACCEPTED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])
const MAX_BRIEF_PDF_BYTES = 10 * 1024 * 1024

type EditableCampaign = CampaignDetailResponse &
  Partial<Omit<Campaign, keyof CampaignDetailResponse>>

type EditableField = keyof Pick<
  UpdateCampaignRequest,
  | 'name'
  | 'description'
  | 'target_url'
  | 'image_s3_key'
  | 'interests'
  | 'min_creator_tier_slug'
  | 'compensation_notes'
  | 'video_reuse_permission_default'
  | 'content_guidelines'
  | 'brief_pdf_s3_key'
>

type BannerState = {
  kind: 'concurrency' | 'immutable' | 'error'
  message: string
}

interface CampaignInlineEditorProps {
  campaignId: string
  campaign: EditableCampaign
}

export function CampaignInlineEditor({
  campaignId,
  campaign,
}: CampaignInlineEditorProps) {
  const queryClient = useQueryClient()
  const [currentCampaign, setCurrentCampaign] =
    useState<EditableCampaign>(campaign)
  const [banner, setBanner] = useState<BannerState | null>(null)
  const updateCampaign = useUpdateCampaignMutation()

  useEffect(() => {
    setCurrentCampaign((previous) => ({ ...previous, ...campaign }))
  }, [campaign])

  const saveField = async (field: EditableField, value: unknown) => {
    setBanner(null)
    // version proviene del PATCH response después del primer guardado.
    const version = currentCampaign.version
    const ifMatch = typeof version === 'number' ? String(version) : '*'

    const response = await updateCampaign
      .mutateAsync({
        campaignId,
        data: { [field]: value } as UpdateCampaignRequest,
        ifMatch,
      })
      .catch((error: unknown) => {
        setBanner(buildBannerFromError(error))
        return null
      })

    if (!response) {
      return false
    }

    const updatedCampaign = response.data as EditableCampaign
    setCurrentCampaign((previous) => ({ ...previous, ...updatedCampaign }))
    queryClient.setQueryData<EditableCampaign>(
      campaignDetailQueryKey(campaignId),
      (previous) => (previous ? { ...previous, ...updatedCampaign } : previous),
    )
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: campaignDetailQueryKey(campaignId),
      }),
      queryClient.invalidateQueries({
        queryKey: campaignOverviewQueryKey(campaignId),
      }),
    ])
    return true
  }

  const reloadCampaign = () => {
    setBanner(null)
    void queryClient.invalidateQueries({
      queryKey: campaignDetailQueryKey(campaignId),
    })
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-col gap-3 border-b border-border pb-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
            {t`Edición de campaña`}
          </p>
          <h2 className="mt-1 text-base font-semibold text-foreground">
            {t`Brief y configuración`}
          </h2>
        </div>
        {typeof currentCampaign.version === 'number' ? (
          <Badge variant="outline">{t`Versión ${currentCampaign.version}`}</Badge>
        ) : null}
      </div>

      {banner ? (
        <div
          role="alert"
          className="mt-4 flex flex-col gap-3 rounded-lg border border-destructive/35 bg-destructive/10 p-3 text-sm text-destructive md:flex-row md:items-center md:justify-between"
        >
          <span className="inline-flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            {banner.message}
          </span>
          {banner.kind === 'concurrency' ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={reloadCampaign}
            >
              <RefreshCw className="size-3.5" aria-hidden="true" />
              {t`Recargar`}
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4">
        <EditableTextField
          label={t`Nombre`}
          value={currentCampaign.name}
          maxLength={150}
          disabled={updateCampaign.isPending}
          onSave={(value) => saveField('name', value)}
        />
        <EditableTextareaField
          label={t`Descripción`}
          value={currentCampaign.description ?? ''}
          maxLength={4000}
          disabled={updateCampaign.isPending}
          onSave={(value) => saveField('description', value)}
        />
        <EditableTextField
          label={t`URL objetivo`}
          value={currentCampaign.target_url ?? ''}
          maxLength={500}
          placeholder="https://"
          disabled={updateCampaign.isPending}
          onSave={(value) => saveField('target_url', value)}
        />
        <ImageField
          value={currentCampaign.image_s3_key ?? ''}
          disabled={updateCampaign.isPending}
          onSave={(value) => saveField('image_s3_key', value)}
        />
        <InterestsField
          value={currentCampaign.interests ?? []}
          disabled={updateCampaign.isPending}
          onSave={(value) => saveField('interests', value)}
        />
        <CreatorTierField
          value={currentCampaign.min_creator_tier_slug ?? ''}
          disabled={updateCampaign.isPending}
          onSave={(value) => saveField('min_creator_tier_slug', value)}
        />
        <EditableTextareaField
          label={t`Notas de compensación`}
          value={currentCampaign.compensation_notes ?? ''}
          maxLength={4000}
          optional
          disabled={updateCampaign.isPending}
          onSave={(value) =>
            saveField('compensation_notes', value.trim() ? value : null)
          }
        />
        <BooleanField
          value={currentCampaign.video_reuse_permission_default ?? false}
          disabled={updateCampaign.isPending}
          onSave={(value) => saveField('video_reuse_permission_default', value)}
        />
        <EditableTextareaField
          label={t`Guías de contenido`}
          value={currentCampaign.content_guidelines ?? ''}
          maxLength={4000}
          disabled={updateCampaign.isPending}
          onSave={(value) => saveField('content_guidelines', value)}
        />
        <BriefPdfField
          value={currentCampaign.brief_pdf_s3_key ?? null}
          disabled={updateCampaign.isPending}
          onSave={(value) => saveField('brief_pdf_s3_key', value)}
        />
      </div>

      <div className="mt-5 grid gap-3 border-t border-border pt-5 md:grid-cols-2 lg:grid-cols-5">
        <ReadonlyField
          label={t`Tipo de contenido`}
          value={currentCampaign.content_type}
        />
        <ReadonlyField
          label={t`Modelo de precios`}
          value={currentCampaign.pricing_model}
        />
        <ReadonlyField
          label={t`Plataformas`}
          value={currentCampaign.platforms}
        />
        <ReadonlyField
          label={t`País creator`}
          value={currentCampaign.creator_country}
        />
        <ReadonlyField
          label={t`Tipo de compensación`}
          value={currentCampaign.compensation_type}
        />
      </div>
    </section>
  )
}

function EditableTextField({
  label,
  value,
  maxLength,
  placeholder,
  optional = false,
  disabled,
  onSave,
}: {
  label: string
  value: string
  maxLength: number
  placeholder?: string
  optional?: boolean
  disabled: boolean
  onSave: (value: string) => Promise<boolean>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    if (!editing) setDraft(value)
  }, [editing, value])

  if (editing) {
    return (
      <EditableShell label={label}>
        <Input
          aria-label={label}
          value={draft}
          maxLength={maxLength}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) => setDraft(event.target.value)}
        />
        <EditActions
          disabled={disabled || (!optional && draft.trim().length === 0)}
          onCancel={() => setEditing(false)}
          onSave={async () => {
            if (draft === value) {
              setEditing(false)
              return
            }
            if (await onSave(draft)) setEditing(false)
          }}
        />
      </EditableShell>
    )
  }

  return (
    <DisplayField
      label={label}
      value={value || t`Sin dato`}
      disabled={disabled}
      onEdit={() => setEditing(true)}
    />
  )
}

function EditableTextareaField({
  label,
  value,
  maxLength,
  optional = false,
  disabled,
  onSave,
}: {
  label: string
  value: string
  maxLength: number
  optional?: boolean
  disabled: boolean
  onSave: (value: string) => Promise<boolean>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    if (!editing) setDraft(value)
  }, [editing, value])

  if (editing) {
    return (
      <EditableShell label={label}>
        <Textarea
          aria-label={label}
          value={draft}
          maxLength={maxLength}
          disabled={disabled}
          className="min-h-28 resize-y"
          onChange={(event) => setDraft(event.target.value)}
        />
        <EditActions
          disabled={disabled || (!optional && draft.trim().length === 0)}
          onCancel={() => setEditing(false)}
          onSave={async () => {
            if (draft === value) {
              setEditing(false)
              return
            }
            if (await onSave(draft)) setEditing(false)
          }}
        />
      </EditableShell>
    )
  }

  return (
    <DisplayField
      label={label}
      value={value || t`Sin dato`}
      multiline
      disabled={disabled}
      onEdit={() => setEditing(true)}
    />
  )
}

function ImageField({
  value,
  disabled,
  onSave,
}: {
  value: string
  disabled: boolean
  onSave: (value: string) => Promise<boolean>
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const presignImage = usePresignImageMutation()

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      setError(t`Subí una imagen PNG, JPG o WebP.`)
      return
    }

    setError(null)
    try {
      const presign = await presignImage.mutateAsync({ file })
      if (await onSave(presign.s3_key)) setEditing(false)
    } catch {
      setError(t`No pudimos subir la imagen. Intentá de nuevo.`)
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  if (!editing) {
    return (
      <DisplayField
        label={t`Imagen`}
        value={value || t`Sin imagen`}
        disabled={disabled}
        onEdit={() => setEditing(true)}
      />
    )
  }

  return (
    <EditableShell label={t`Imagen`}>
      <button
        type="button"
        disabled={disabled || presignImage.isPending}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault()
          void handleFile(event.dataTransfer.files[0])
        }}
        className={cn(
          'flex min-h-28 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background p-5 text-center text-sm transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-60',
          error && 'border-destructive',
        )}
      >
        <ImageUp className="size-5 text-muted-foreground" aria-hidden="true" />
        <span className="font-medium">
          {presignImage.isPending
            ? t`Subiendo imagen...`
            : t`Reemplazar imagen`}
        </span>
        <span className="text-muted-foreground">PNG, JPG o WebP</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        aria-label={t`Imagen`}
        className="sr-only"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <EditActions
        saveLabel={t`Elegir archivo`}
        disabled={disabled || presignImage.isPending}
        onCancel={() => setEditing(false)}
        onSave={() => inputRef.current?.click()}
      />
    </EditableShell>
  )
}

function InterestsField({
  value,
  disabled,
  onSave,
}: {
  value: string[]
  disabled: boolean
  onSave: (value: string[]) => Promise<boolean>
}) {
  const interestsQuery = useInterestsQuery()
  const options =
    interestsQuery.data?.status === 200 ? interestsQuery.data.data.items : []
  const mergedOptions = [
    ...options,
    ...value
      .filter((slug) => !options.some((option) => option.slug === slug))
      .map((slug) => ({ slug, label_es: slug })),
  ]
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    if (!editing) setDraft(value)
  }, [editing, value])

  const toggle = (slug: string) => {
    setDraft((previous) =>
      previous.includes(slug)
        ? previous.filter((item) => item !== slug)
        : [...previous, slug],
    )
  }

  if (!editing) {
    return (
      <DisplayField
        label={t`Intereses`}
        value={formatSlugs(value)}
        disabled={disabled}
        onEdit={() => setEditing(true)}
      />
    )
  }

  return (
    <EditableShell label={t`Intereses`}>
      <div
        role="group"
        aria-label={t`Intereses`}
        className="flex flex-wrap gap-2"
      >
        {mergedOptions.map((interest) => {
          const selected = draft.includes(interest.slug)
          return (
            <ChipButton
              key={interest.slug}
              selected={selected}
              disabled={disabled}
              onClick={() => toggle(interest.slug)}
            >
              {interest.label_es}
            </ChipButton>
          )
        })}
      </div>
      <EditActions
        disabled={disabled || draft.length === 0}
        onCancel={() => setEditing(false)}
        onSave={async () => {
          if (arrayEquals(draft, value)) {
            setEditing(false)
            return
          }
          if (await onSave(draft)) setEditing(false)
        }}
      />
    </EditableShell>
  )
}

function CreatorTierField({
  value,
  disabled,
  onSave,
}: {
  value: string
  disabled: boolean
  onSave: (value: string) => Promise<boolean>
}) {
  const tiersQuery = useCreatorTiersQuery()
  const options =
    tiersQuery.data?.status === 200 ? tiersQuery.data.data.items : []
  const mergedOptions =
    value && !options.some((option) => option.slug === value)
      ? [...options, { slug: value, label_es: value, followers_min: 0 }]
      : options
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    if (!editing) setDraft(value)
  }, [editing, value])

  if (!editing) {
    return (
      <DisplayField
        label={t`Tier mínimo`}
        value={value || t`Sin dato`}
        disabled={disabled}
        onEdit={() => setEditing(true)}
      />
    )
  }

  return (
    <EditableShell label={t`Tier mínimo`}>
      <div
        role="radiogroup"
        aria-label={t`Tier mínimo`}
        className="flex flex-wrap gap-2"
      >
        {mergedOptions.map((tier) => (
          <ChipButton
            key={tier.slug}
            role="radio"
            selected={draft === tier.slug}
            aria-checked={draft === tier.slug}
            disabled={disabled}
            onClick={() => setDraft(tier.slug)}
          >
            {tier.label_es}
          </ChipButton>
        ))}
      </div>
      <EditActions
        disabled={disabled || draft.length === 0}
        onCancel={() => setEditing(false)}
        onSave={async () => {
          if (draft === value) {
            setEditing(false)
            return
          }
          if (await onSave(draft)) setEditing(false)
        }}
      />
    </EditableShell>
  )
}

function BooleanField({
  value,
  disabled,
  onSave,
}: {
  value: boolean
  disabled: boolean
  onSave: (value: boolean) => Promise<boolean>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    if (!editing) setDraft(value)
  }, [editing, value])

  if (!editing) {
    return (
      <DisplayField
        label={t`Permiso de reutilización`}
        value={value ? t`Permitido por defecto` : t`No permitido por defecto`}
        disabled={disabled}
        onEdit={() => setEditing(true)}
      />
    )
  }

  return (
    <EditableShell label={t`Permiso de reutilización`}>
      <label className="inline-flex items-center gap-3 text-sm font-medium text-foreground">
        <Switch
          aria-label={t`Permiso de reutilización`}
          checked={draft}
          disabled={disabled}
          onCheckedChange={setDraft}
        />
        {draft ? t`Permitido por defecto` : t`No permitido por defecto`}
      </label>
      <EditActions
        disabled={disabled}
        onCancel={() => setEditing(false)}
        onSave={async () => {
          if (draft === value) {
            setEditing(false)
            return
          }
          if (await onSave(draft)) setEditing(false)
        }}
      />
    </EditableShell>
  )
}

function BriefPdfField({
  value,
  disabled,
  onSave,
}: {
  value: string | null
  disabled: boolean
  onSave: (value: string | null) => Promise<boolean>
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const presignPdf = usePresignBriefPdfMutation()

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError(t`Solo podés subir un archivo PDF.`)
      return
    }
    if (file.size > MAX_BRIEF_PDF_BYTES) {
      setError(t`El PDF no puede superar los 10 MB.`)
      return
    }

    setError(null)
    try {
      const presign = await presignPdf.mutateAsync({ file })
      if (await onSave(presign.s3_key)) setEditing(false)
    } catch {
      setError(t`No pudimos subir el PDF. Intentá de nuevo.`)
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  if (!editing) {
    return (
      <DisplayField
        label={t`PDF del brief`}
        value={value ?? t`Sin PDF`}
        disabled={disabled}
        onEdit={() => setEditing(true)}
      />
    )
  }

  return (
    <EditableShell label={t`PDF del brief`}>
      <button
        type="button"
        disabled={disabled || presignPdf.isPending}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault()
          void handleFile(event.dataTransfer.files[0])
        }}
        className={cn(
          'flex min-h-28 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background p-5 text-center text-sm transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-60',
          error && 'border-destructive',
        )}
      >
        <FileText className="size-5 text-muted-foreground" aria-hidden="true" />
        <span className="font-medium">
          {presignPdf.isPending ? t`Subiendo PDF...` : t`Subir PDF del brief`}
        </span>
        <span className="text-muted-foreground">{t`PDF opcional, hasta 10 MB`}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        aria-label={t`PDF del brief`}
        className="sr-only"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <EditActions
          saveLabel={t`Elegir archivo`}
          disabled={disabled || presignPdf.isPending}
          onCancel={() => setEditing(false)}
          onSave={() => inputRef.current?.click()}
        />
        {value ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || presignPdf.isPending}
            onClick={async () => {
              if (await onSave(null)) setEditing(false)
            }}
          >
            <X className="size-3.5" aria-hidden="true" />
            {t`Eliminar`}
          </Button>
        ) : null}
      </div>
    </EditableShell>
  )
}

function DisplayField({
  label,
  value,
  multiline = false,
  disabled,
  onEdit,
}: {
  label: string
  value: string
  multiline?: boolean
  disabled: boolean
  onEdit: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onEdit}
      className="group grid gap-1 rounded-lg border border-border bg-background p-3 text-left transition-colors hover:border-primary/50 hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="flex items-center justify-between gap-3 text-xs font-medium text-muted-foreground">
        {label}
        <Pencil
          className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden="true"
        />
      </span>
      <span
        className={cn(
          'text-sm font-medium text-foreground',
          multiline ? 'whitespace-pre-wrap' : 'truncate',
        )}
      >
        {value}
      </span>
    </button>
  )
}

function EditableShell({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="grid gap-2 rounded-lg border border-primary/40 bg-background p-3">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

function EditActions({
  saveLabel = t`Guardar`,
  disabled,
  onCancel,
  onSave,
}: {
  saveLabel?: string
  disabled: boolean
  onCancel: () => void
  onSave: () => void | Promise<void>
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        disabled={disabled}
        onClick={() => void onSave()}
      >
        {saveLabel}
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={onCancel}>
        {t`Cancelar`}
      </Button>
    </div>
  )
}

function ChipButton({
  selected,
  className,
  ...props
}: ComponentProps<'button'> & { selected: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={props.role === 'radio' ? undefined : selected}
      className={cn(
        'inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-foreground hover:bg-surface-hover',
        className,
      )}
      {...props}
    />
  )
}

function ReadonlyField({
  label,
  value,
}: {
  label: string
  value: string | string[] | null | undefined
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-foreground">
        {Array.isArray(value) ? formatPlatforms(value) : value || t`Sin dato`}
      </dd>
    </div>
  )
}

function buildBannerFromError(error: unknown): BannerState {
  if (error instanceof ApiError) {
    const body = error.body
    const bodyError =
      isRecord(body) && isRecord(body.error) ? body.error : undefined
    const code =
      (bodyError && typeof bodyError.code === 'string'
        ? bodyError.code
        : undefined) ?? error.code
    const message =
      (bodyError && typeof bodyError.message === 'string'
        ? bodyError.message
        : undefined) ?? error.message

    return buildBannerFromStatus(error.status, code, message)
  }

  return {
    kind: 'error',
    message: t`No pudimos guardar los cambios. Intentá de nuevo.`,
  }
}

function buildBannerFromStatus(
  status: number,
  code: string,
  message: string,
): BannerState {
  if (status === 412 && code === 'concurrency.version_mismatch') {
    return {
      kind: 'concurrency',
      message: t`El dato cambió desde otra sesión. Recargá la página para ver la versión actualizada.`,
    }
  }

  if (status === 422 && code === 'campaign.field_immutable') {
    return {
      kind: 'immutable',
      message: t`Este campo no se puede modificar`,
    }
  }

  return {
    kind: 'error',
    message:
      status === 422
        ? message
        : t`No pudimos guardar los cambios. Intentá de nuevo.`,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function formatPlatforms(items: string[] | null | undefined) {
  if (!items || items.length === 0) return t`Sin dato`
  return items.map(formatPlatform).join(', ')
}

function formatSlugs(items: string[] | null | undefined) {
  if (!items || items.length === 0) return t`Sin dato`
  return items.join(', ')
}

function arrayEquals(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((item, index) => item === right[index])
  )
}
