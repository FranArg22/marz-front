import { t } from '@lingui/core/macro'
import { useQueryClient } from '@tanstack/react-query'
import { Save } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import { Switch } from '#/components/ui/switch'
import { Textarea } from '#/components/ui/textarea'
import type {
  CampaignDetailResponse,
  UpdateCampaignRequest,
} from '#/shared/api/generated/model'
import { formatPlatform } from '#/shared/utils/format'
import { useUpdateCampaignMutation } from '#/features/campaigns/wizard/mutations'

import { campaignDetailQueryKey } from './useCampaignDetailQuery'
import { campaignOverviewQueryKey } from './useCampaignOverviewQuery'

interface CampaignConfigurationSheetProps {
  campaign: CampaignDetailResponse
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface FormState {
  name: string
  description: string
  targetUrl: string
  compensationNotes: string
  contentGuidelines: string
  videoReusePermissionDefault: boolean
}

export function CampaignConfigurationSheet({
  campaign,
  open,
  onOpenChange,
}: CampaignConfigurationSheetProps) {
  const queryClient = useQueryClient()
  const updateCampaign = useUpdateCampaignMutation()
  const initialState = useMemo(() => makeInitialState(campaign), [campaign])
  const [form, setForm] = useState<FormState>(initialState)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm(initialState)
      setError(null)
    }
  }, [initialState, open])

  const payload = buildPayload(initialState, form)
  const hasChanges = Object.keys(payload).length > 0
  const canSave = form.name.trim().length > 0 && hasChanges

  const handleSave = async () => {
    setError(null)
    const version = campaign.version
    const ifMatch = typeof version === 'number' ? String(version) : '*'

    try {
      const response = await updateCampaign.mutateAsync({
        campaignId: campaign.campaign_id,
        data: payload,
        ifMatch,
      })
      queryClient.setQueryData(
        campaignDetailQueryKey(campaign.campaign_id),
        (previous: unknown) =>
          previous && typeof previous === 'object'
            ? { ...previous, ...response.data }
            : previous,
      )
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: campaignDetailQueryKey(campaign.campaign_id),
        }),
        queryClient.invalidateQueries({
          queryKey: campaignOverviewQueryKey(campaign.campaign_id),
        }),
      ])
      onOpenChange(false)
    } catch {
      setError(t`No pudimos guardar la configuración. Intentá de nuevo.`)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-2xl">
        <SheetHeader className="border-b border-border p-6">
          <SheetTitle>{t`Configuración de campaña`}</SheetTitle>
          <SheetDescription>
            {t`Editá la información principal y los lineamientos que usan los creadores.`}
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-6 p-6">
          {error ? (
            <p
              role="alert"
              className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          <section className="grid gap-4">
            <SectionTitle
              title={t`Información principal`}
              description={t`Lo que identifica la campaña dentro del equipo.`}
            />
            <Field label={t`Nombre`}>
              <Input
                value={form.name}
                maxLength={150}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label={t`Descripción`}>
              <Textarea
                value={form.description}
                maxLength={4000}
                className="min-h-28 resize-y"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label={t`URL objetivo`}>
              <Input
                value={form.targetUrl}
                maxLength={500}
                placeholder="https://"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    targetUrl: event.target.value,
                  }))
                }
              />
            </Field>
          </section>

          <section className="grid gap-4 border-t border-border pt-6">
            <SectionTitle
              title={t`Contenido y compensación`}
              description={t`Instrucciones operativas para propuestas y entregables.`}
            />
            <Field label={t`Notas de compensación`}>
              <Textarea
                value={form.compensationNotes}
                maxLength={4000}
                className="min-h-24 resize-y"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    compensationNotes: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label={t`Guías de contenido`}>
              <Textarea
                value={form.contentGuidelines}
                maxLength={4000}
                className="min-h-32 resize-y"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    contentGuidelines: event.target.value,
                  }))
                }
              />
            </Field>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
              <div>
                <Label className="text-sm font-medium">
                  {t`Permitir reutilización de videos`}
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t`Define si los videos quedan reutilizables por defecto.`}
                </p>
              </div>
              <Switch
                checked={form.videoReusePermissionDefault}
                onCheckedChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    videoReusePermissionDefault: value,
                  }))
                }
              />
            </div>
          </section>

          <section className="grid gap-3 border-t border-border pt-6">
            <SectionTitle
              title={t`Resumen no editable`}
              description={t`Estos datos salen de la definición comercial de la campaña.`}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <ReadonlyItem
                label={t`Plataformas`}
                value={formatList(campaign.platforms)}
              />
              <ReadonlyItem
                label={t`Audiencia`}
                value={
                  campaign.audience.description ?? t`Sin audiencia definida`
                }
              />
              <ReadonlyItem
                label={t`Contenido`}
                value={formatContentModel(campaign.commercial.content_model)}
              />
              <ReadonlyItem
                label={t`Pago`}
                value={formatPricingModel(campaign.commercial.pricing_model)}
              />
            </div>
          </section>
        </div>

        <SheetFooter className="sticky bottom-0 border-t border-border bg-background p-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t`Cancelar`}
          </Button>
          <Button
            type="button"
            disabled={!canSave || updateCampaign.isPending}
            onClick={() => void handleSave()}
          >
            <Save className="size-3.5" aria-hidden="true" />
            {updateCampaign.isPending ? t`Guardando` : t`Guardar cambios`}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function SectionTitle({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function ReadonlyItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-foreground">
        {value}
      </p>
    </div>
  )
}

function makeInitialState(campaign: CampaignDetailResponse): FormState {
  return {
    name: campaign.name,
    description: campaign.description,
    targetUrl: campaign.target_url,
    compensationNotes: campaign.compensation_notes ?? '',
    contentGuidelines: campaign.content_guidelines,
    videoReusePermissionDefault: campaign.video_reuse_permission_default,
  }
}

function buildPayload(
  initial: FormState,
  current: FormState,
): UpdateCampaignRequest {
  const payload: UpdateCampaignRequest = {}
  if (current.name !== initial.name) payload.name = current.name.trim()
  if (current.description !== initial.description) {
    const description = current.description.trim()
    if (description) payload.description = description
  }
  if (current.targetUrl !== initial.targetUrl) {
    const targetUrl = current.targetUrl.trim()
    if (targetUrl) payload.target_url = targetUrl
  }
  if (current.compensationNotes !== initial.compensationNotes) {
    payload.compensation_notes = current.compensationNotes.trim() || null
  }
  if (current.contentGuidelines !== initial.contentGuidelines) {
    const contentGuidelines = current.contentGuidelines.trim()
    if (contentGuidelines) payload.content_guidelines = contentGuidelines
  }
  if (
    current.videoReusePermissionDefault !== initial.videoReusePermissionDefault
  ) {
    payload.video_reuse_permission_default = current.videoReusePermissionDefault
  }
  return payload
}

function formatList(items: string[]) {
  if (items.length === 0) return t`Sin plataformas`
  return items.map(formatPlatform).join(', ')
}

function formatContentModel(value: string | null) {
  if (value === 'ugc_videos') return t`Videos UGC`
  if (value === 'influencer_posts') return t`Publicaciones de influencers`
  return value ?? t`Sin modelo definido`
}

function formatPricingModel(value: string | null) {
  if (value === 'pay_per_post') return t`Pago por publicación`
  if (value === 'cpm') return t`CPM`
  return value ?? t`Sin modelo de pago definido`
}
