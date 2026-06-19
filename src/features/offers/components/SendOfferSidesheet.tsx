import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-form'
import { t } from '@lingui/core/macro'
import { Ban, Calendar as CalendarIcon, Check, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
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
  SheetDescription,
  SheetTitle,
} from '#/components/ui/sheet'
import { Switch } from '#/components/ui/switch'
import { cn } from '#/lib/utils'
import { ApiError } from '#/shared/api/mutator'
import { useActiveCampaigns } from '#/shared/api/activeCampaigns'
import { useMe } from '#/shared/api/generated/accounts/accounts'
import type { OfferSendError } from '#/shared/api/generated/model'
import { getConversationOffersQueryKey } from '#/shared/queries/offers'
import { FieldRow, firstErrorMessage, useAppForm } from '#/shared/ui/form'

import { useCreateOfferMutation } from '../hooks/useCreateOfferMutation'
import { getWorkspacePlan } from '../utils/workspacePlan'
import {
  createCreateOfferSchema,
  getMinimumOfferDeadlineUTC,
  getMinimumTentativePublishDateUTC,
} from '../schemas/createOffer'
import type { CreateOfferFormValues } from '../schemas/createOffer'
import { useSendOfferWizard } from '../store/sendOfferWizardStore'
import type { SendOfferWizardMode } from '../store/sendOfferWizardStore'
import { redirectToCheckout } from '../utils/redirectToCheckout'
import { OfferSendErrorBanner } from './OfferSendErrorBanner'
import { OfferSummaryBlock } from './OfferSummaryBlock'

const platformOptions = ['instagram', 'tiktok', 'youtube'] as const
type PlatformOption = (typeof platformOptions)[number]

interface SendOfferSidesheetProps {
  creatorName: string
  creatorAccountId: string
  conversationId?: string
}

function createDefaultValues(
  creatorAccountId: string,
  draft: Partial<CreateOfferFormValues>,
  mode: SendOfferWizardMode,
): CreateOfferFormValues {
  return {
    campaign_id: draft.campaign_id ?? '',
    creator_account_id: draft.creator_account_id ?? creatorAccountId,
    offer_mode: mode,
    amount: draft.amount ?? 0,
    tentative_publish_date: draft.tentative_publish_date ?? '',
    offer_deadline: draft.offer_deadline ?? '',
    platforms: draft.platforms ?? ['instagram'],
    bonus_terms: draft.bonus_terms ?? {
      enabled: false,
      speed_bonus_windows: [],
    },
  }
}

function getStripeUnavailableError(): OfferSendError {
  return {
    code: 'stripe_unavailable' as OfferSendError['code'],
    stripe_code: null,
  }
}

function isStripeUnavailableError(error: ApiError) {
  if (error.status !== 502) return false

  const body = error.body as
    | { error?: { code?: string }; code?: string }
    | undefined
  return (
    body?.error?.code === 'stripe_unavailable' ||
    error.code === 'stripe_unavailable'
  )
}

function getPlatformLabel(platform: PlatformOption) {
  if (platform === 'instagram') return t`Instagram`
  if (platform === 'tiktok') return t`TikTok`
  return t`YouTube`
}

type OfferFieldName =
  | 'amount'
  | 'campaign_id'
  | 'creator_account_id'
  | 'platforms'
  | 'offer_mode'
  | 'tentative_publish_date'
  | 'offer_deadline'

function toOfferFieldName(field: string): OfferFieldName | null {
  if (
    field === 'amount' ||
    field === 'campaign_id' ||
    field === 'creator_account_id' ||
    field === 'platforms' ||
    field === 'offer_mode' ||
    field === 'tentative_publish_date' ||
    field === 'offer_deadline'
  ) {
    return field
  }

  return null
}

export function SendOfferSidesheet({
  creatorName,
  creatorAccountId,
  conversationId,
}: SendOfferSidesheetProps) {
  const wizard = useSendOfferWizard()
  const { isOpen, conversationId: wizardConversationId, close } = wizard
  const activeConversationId = conversationId ?? wizardConversationId
  const queryClient = useQueryClient()
  const campaignsQuery = useActiveCampaigns()
  const meQuery = useMe()
  const createOfferMutation = useCreateOfferMutation()
  const createOfferSchema = useMemo(() => createCreateOfferSchema(), [])
  const [offerDraftId] = useState(() => crypto.randomUUID())
  const [sendError, setSendError] = useState<OfferSendError | null>(null)
  const workspacePlan = getWorkspacePlan(
    meQuery.data?.status === 200
      ? meQuery.data.data.brand_workspace?.plan
      : undefined,
  )

  const form = useAppForm({
    defaultValues: createDefaultValues(
      creatorAccountId,
      wizard.draft,
      wizard.mode,
    ),
    validators: { onChange: createOfferSchema },
    onSubmit: async ({ value }) => {
      if (!activeConversationId) return

      setSendError(null)

      const submitValue: CreateOfferFormValues =
        value.offer_mode === 'per_platform'
          ? {
              ...value,
              bonus_terms: { enabled: false, speed_bonus_windows: [] },
            }
          : value

      try {
        const result = await createOfferMutation.mutateAsync({
          ...submitValue,
          conversation_id: activeConversationId,
          offer_draft_id: offerDraftId,
          return_to: conversationId
            ? { kind: 'conversation', id: conversationId }
            : { kind: 'inbox' },
        })

        if (result.data.status === 'sent') {
          await queryClient.invalidateQueries({
            queryKey: getConversationOffersQueryKey(activeConversationId),
          })
          toast.success(t`Oferta enviada`)
          useSendOfferWizard.getState().reset()
          close()
          return
        }

        if (result.data.status === 'requires_action') {
          redirectToCheckout(result.data.checkout_url)
          return
        }

        setSendError(result.data.error)
      } catch (error) {
        if (error instanceof ApiError && isStripeUnavailableError(error)) {
          setSendError(getStripeUnavailableError())
          return
        }

        if (error instanceof ApiError && error.details?.field_errors) {
          for (const [field, messages] of Object.entries(
            error.details.field_errors,
          )) {
            const fieldName = toOfferFieldName(field)
            const message = messages[0]
            if (!fieldName || !message) continue
            form.setFieldMeta(fieldName, (prev) => ({
              ...prev,
              errorMap: { ...prev.errorMap, onServer: message },
              isBlurred: true,
              isTouched: true,
              isDirty: true,
            }))
          }
        }
      }
    },
  })

  const values = useStore(form.store, (state) => state.values)
  const amount = useStore(form.store, (state) => state.values.amount)
  const bonusTerms = useStore(form.store, (state) => state.values.bonus_terms)
  const offerMode = useStore(form.store, (state) => state.values.offer_mode)
  const selectedPlatforms = useStore(
    form.store,
    (state) => state.values.platforms,
  )

  useEffect(() => {
    useSendOfferWizard.getState().patchDraft(values)
  }, [values])

  useEffect(() => {
    if (!isOpen) {
      useSendOfferWizard.getState().reset()
    }
  }, [isOpen])

  function setMode(nextMode: SendOfferWizardMode) {
    useSendOfferWizard.getState().setMode(nextMode)
    form.setFieldValue('offer_mode', nextMode)

    if (nextMode === 'per_platform') {
      const currentBonusTerms = form.state.values.bonus_terms
      if (currentBonusTerms?.enabled) {
        useSendOfferWizard.getState().setBonusesSnapshot(currentBonusTerms)
      }
      form.setFieldValue('bonus_terms', {
        enabled: false,
        speed_bonus_windows: [],
      })
      return
    }

    const snapshot = useSendOfferWizard.getState().bonusesSnapshot
    if (snapshot) {
      form.setFieldValue('bonus_terms', snapshot)
    }
  }

  function updatePlatforms(platform: PlatformOption) {
    const selected = form.state.values.platforms
    const next = selected.includes(platform)
      ? selected.filter((item) => item !== platform)
      : [...selected, platform]
    form.setFieldValue('platforms', next)
  }

  function handleClose() {
    setSendError(null)
    useSendOfferWizard.getState().reset()
    close()
  }

  const campaigns = campaignsQuery.data ?? []
  const hasCampaigns = campaigns.length > 0

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
    >
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full gap-0 overflow-hidden border-border bg-card p-0 sm:max-w-[560px]"
      >
        <SheetTitle className="sr-only">{t`Enviar oferta`}</SheetTitle>
        <SheetDescription className="sr-only">
          {t`Enviar una oferta a ${creatorName}`}
        </SheetDescription>

        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="space-y-0.5">
            <h2 className="text-[length:var(--font-size-2xl)] font-semibold tracking-tight text-card-foreground">
              {t`Enviar oferta`}
            </h2>
            <p className="text-[length:var(--font-size-sm)] text-muted-foreground">
              {t`Para ${creatorName}`}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t`Cerrar`}
            onClick={handleClose}
            className="rounded-full"
          >
            <X className="size-4" />
          </Button>
        </header>

        {campaignsQuery.isError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
            <p className="text-center text-sm text-destructive">
              {t`No pudimos cargar tus campañas. Intentá de nuevo.`}
            </p>
            <Button
              variant="outline"
              onClick={() => void campaignsQuery.refetch()}
            >
              {t`Reintentar`}
            </Button>
          </div>
        ) : !hasCampaigns && !campaignsQuery.isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
            <p className="text-center text-sm text-muted-foreground">
              {t`No tenés campañas activas para enviar ofertas.`}
            </p>
            <Button variant="outline" onClick={handleClose}>
              {t`Cerrar`}
            </Button>
          </div>
        ) : (
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={(event) => {
              event.preventDefault()
              void form.handleSubmit()
            }}
          >
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
              {sendError ? <OfferSendErrorBanner error={sendError} /> : null}

              <section className="space-y-1">
                <h3 className="text-[length:var(--font-size-lg)] font-semibold tracking-tight text-card-foreground">
                  {t`Configuración de la oferta`}
                </h3>
                <p className="text-[length:var(--font-size-sm)] text-muted-foreground">
                  {t`Una oferta · monto y fechas unificados`}
                </p>
              </section>

              <section className="space-y-4 rounded-2xl border border-border bg-muted p-4">
                <header className="flex items-center justify-between gap-3">
                  <h4 className="text-[length:var(--font-size-sm)] font-semibold text-card-foreground">
                    {t`Contenido y plataformas`}
                  </h4>
                  <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[length:var(--font-size-xs)] font-medium text-primary-foreground">
                    {(() => {
                      const count = selectedPlatforms.length
                      return count === 1 ? t`${count} red` : t`${count} redes`
                    })()}
                  </span>
                </header>

                <form.AppField name="campaign_id">
                  {(field) => {
                    const error =
                      field.state.meta.errors.length > 0
                        ? firstErrorMessage(field.state.meta.errors)
                        : undefined

                    return (
                      <FieldRow label={t`Campaña`} error={error} required>
                        {(aria) => (
                          <Select
                            value={field.state.value}
                            onValueChange={field.handleChange}
                          >
                            <SelectTrigger
                              id={aria.id}
                              aria-describedby={aria['aria-describedby']}
                              aria-invalid={aria['aria-invalid']}
                              className="h-11 w-full rounded-xl bg-background"
                            >
                              <SelectValue placeholder={t`Elegí una campaña`} />
                            </SelectTrigger>
                            <SelectContent>
                              {campaigns.map((campaign) => (
                                <SelectItem
                                  key={campaign.id}
                                  value={campaign.id}
                                >
                                  {campaign.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </FieldRow>
                    )
                  }}
                </form.AppField>

                <form.AppField name="amount">
                  {(field) => (
                    <FieldRow
                      label={t`Monto`}
                      hint={t`Un único monto para las plataformas seleccionadas.`}
                      error={
                        field.state.meta.errors.length > 0
                          ? firstErrorMessage(field.state.meta.errors)
                          : undefined
                      }
                      required
                    >
                      {(aria) => (
                        <div className="relative">
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[length:var(--font-size-sm)] text-muted-foreground"
                          >
                            $
                          </span>
                          <Input
                            {...aria}
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="0.01"
                            value={field.state.value || ''}
                            onChange={(event) =>
                              field.handleChange(Number(event.target.value))
                            }
                            onBlur={field.handleBlur}
                            className="h-11 rounded-xl bg-background pl-6 font-mono"
                            placeholder="2500"
                          />
                        </div>
                      )}
                    </FieldRow>
                  )}
                </form.AppField>

                <form.AppField name="platforms">
                  {(field) => (
                    <FieldRow
                      label={t`Publicar en`}
                      error={
                        field.state.meta.errors.length > 0
                          ? firstErrorMessage(field.state.meta.errors)
                          : undefined
                      }
                      required
                    >
                      {(aria) => (
                        <div
                          id={aria.id}
                          aria-describedby={aria['aria-describedby']}
                          aria-invalid={aria['aria-invalid']}
                          className="grid grid-cols-3 gap-2"
                        >
                          {platformOptions.map((platform) => {
                            const selected =
                              field.state.value.includes(platform)

                            return (
                              <button
                                key={platform}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => updatePlatforms(platform)}
                                className={cn(
                                  'inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-[length:var(--font-size-sm)] font-medium text-foreground transition-colors',
                                  selected &&
                                    'border-primary bg-primary text-primary-foreground',
                                )}
                              >
                                {selected ? (
                                  <Check
                                    className="size-3.5"
                                    aria-hidden="true"
                                  />
                                ) : null}
                                {getPlatformLabel(platform)}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </FieldRow>
                  )}
                </form.AppField>

                <div className="space-y-2 rounded-xl border border-border bg-background p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-[length:var(--font-size-sm)] font-semibold text-card-foreground">
                        {t`Un contenido para todas las redes`}
                      </p>
                      <p className="text-[length:var(--font-size-xs)] text-muted-foreground">
                        {t`Desactivá el switch si cada plataforma necesita contenido y monto propios.`}
                      </p>
                    </div>
                    <Switch
                      aria-label={t`Un contenido para todas las redes`}
                      checked={offerMode === 'same_content'}
                      onCheckedChange={(checked) =>
                        setMode(checked ? 'same_content' : 'per_platform')
                      }
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-3 rounded-2xl border border-border bg-muted p-4">
                <header className="space-y-0.5">
                  <h4 className="text-[length:var(--font-size-sm)] font-semibold text-card-foreground">
                    {t`Fechas`}
                  </h4>
                  <p className="text-[length:var(--font-size-xs)] text-muted-foreground">
                    {t`Hitos clave de esta oferta.`}
                  </p>
                </header>

                <form.AppField name="tentative_publish_date">
                  {(field) => (
                    <TimelineDateRow
                      icon={
                        <CalendarIcon
                          className="size-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                      }
                      title={t`Publicación tentativa`}
                      hint={t`Día ideal para que el creador publique.`}
                      value={field.state.value}
                      onChange={field.handleChange}
                      onBlur={field.handleBlur}
                      ariaLabel={t`Publicación tentativa`}
                      min={getMinimumTentativePublishDateUTC()}
                      error={
                        field.state.meta.errors.length > 0
                          ? firstErrorMessage(field.state.meta.errors)
                          : undefined
                      }
                    />
                  )}
                </form.AppField>

                <form.AppField name="offer_deadline">
                  {(field) => (
                    <TimelineDateRow
                      icon={
                        <CalendarIcon
                          className="size-4 text-destructive"
                          aria-hidden="true"
                        />
                      }
                      title={t`Fecha límite`}
                      hint={t`Último día válido para publicar.`}
                      value={field.state.value}
                      onChange={field.handleChange}
                      onBlur={field.handleBlur}
                      ariaLabel={t`Fecha límite`}
                      min={getMinimumOfferDeadlineUTC(
                        values.tentative_publish_date || undefined,
                      )}
                      error={
                        field.state.meta.errors.length > 0
                          ? firstErrorMessage(field.state.meta.errors)
                          : undefined
                      }
                    />
                  )}
                </form.AppField>
              </section>

              <section className="space-y-3 rounded-2xl border border-border bg-muted p-4">
                <h4 className="text-[length:var(--font-size-sm)] font-semibold text-card-foreground">
                  {t`Aceptación y cancelación`}
                </h4>
                <ul className="space-y-2 text-[length:var(--font-size-xs)] text-muted-foreground">
                  <RuleRow
                    icon={
                      <Check
                        className="size-3.5 text-primary"
                        aria-hidden="true"
                      />
                    }
                  >
                    {t`El creador tiene 72 hs para aceptar. Si expira, la oferta se rechaza automáticamente.`}
                  </RuleRow>
                  <RuleRow
                    icon={
                      <Ban
                        className="size-3.5 text-muted-foreground"
                        aria-hidden="true"
                      />
                    }
                  >
                    {t`La marca puede cancelar antes de la aceptación. Después, requiere que se venza la fecha límite.`}
                  </RuleRow>
                </ul>
              </section>

              <OfferSummaryBlock
                amount={amount}
                bonusTerms={
                  offerMode === 'same_content' ? bonusTerms : undefined
                }
                plan={workspacePlan}
              />
            </div>

            <footer className="flex justify-end gap-2 border-t border-border p-5">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={handleClose}
              >
                {t`Cancelar`}
              </Button>
              <form.AppForm>
                <form.SubmitButton
                  data-testid="offers.send.submit_button"
                  label={t`Enviar oferta`}
                  loadingLabel={t`Enviando`}
                  className="rounded-xl"
                />
              </form.AppForm>
            </footer>
          </form>
        )}
      </SheetContent>
    </Sheet>
  )
}

interface TimelineDateRowProps {
  icon: React.ReactNode
  title: string
  hint: string
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  ariaLabel: string
  error?: string
  min?: string
}

function TimelineDateRow({
  icon,
  title,
  hint,
  value,
  onChange,
  onBlur,
  ariaLabel,
  error,
  min,
}: TimelineDateRowProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 inline-flex size-8 items-center justify-center rounded-lg bg-muted"
          >
            {icon}
          </span>
          <div className="space-y-0.5">
            <p className="text-[length:var(--font-size-sm)] font-medium text-card-foreground">
              {title}
            </p>
            <p className="text-[length:var(--font-size-xs)] text-muted-foreground">
              {hint}
            </p>
          </div>
        </div>
        <Input
          type="date"
          aria-label={ariaLabel}
          aria-invalid={error ? true : undefined}
          value={value}
          min={min}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          className="h-9 w-[10.5rem] rounded-lg bg-input font-mono text-[length:var(--font-size-sm)] dark:bg-input/30"
        />
      </div>
      {error ? (
        <p
          role="status"
          aria-live="polite"
          className="text-[length:var(--font-size-xs)] text-destructive"
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}

function RuleRow({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <li className="flex items-start gap-2">
      <span
        aria-hidden="true"
        className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center"
      >
        {icon}
      </span>
      <span>{children}</span>
    </li>
  )
}
