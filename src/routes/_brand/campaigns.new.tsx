import { useCallback, useEffect, useState } from 'react'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { z } from 'zod'

import { Button } from '#/components/ui/button'
import { WizardLayout } from '#/features/campaigns/wizard/WizardLayout'
import { WizardStep1ContentType } from '#/features/campaigns/wizard/WizardStep1ContentType'
import { WizardStep2PricingModel } from '#/features/campaigns/wizard/WizardStep2PricingModel'
import {
  isValidTargetUrl,
  WizardStep3Brief,
} from '#/features/campaigns/wizard/WizardStep3Brief'
import { WizardStep4Audience } from '#/features/campaigns/wizard/WizardStep4Audience'
import { WizardStep5Compensation } from '#/features/campaigns/wizard/WizardStep5Compensation'
import { WizardStep6Content } from '#/features/campaigns/wizard/WizardStep6Content'
import {
  buildCreateCampaignRequest,
  WizardStep7Review,
} from '#/features/campaigns/wizard/WizardStep7Review'
import { useCreateCampaignMutation } from '#/features/campaigns/wizard/mutations'
import type { CreateCampaignMutationVariables } from '#/features/campaigns/wizard/mutations'
import { useCampaignWizardStore } from '#/features/campaigns/wizard/store'
import type { CampaignWizardState } from '#/features/campaigns/wizard/store'
import { ApiError } from '#/shared/api/mutator'
import type { createCampaignResponse } from '#/shared/api/generated/campaigns/campaigns'
import { track } from '#/shared/analytics/track'

type CreateCampaignMutate = (
  variables: CreateCampaignMutationVariables,
  options?: {
    onSuccess?: (response: createCampaignResponse) => void
    onError?: (error: Error) => void
  },
) => void

interface SubmitCampaignWizardOptions {
  state: CampaignWizardState
  mutate: CreateCampaignMutate
  navigateToCampaign: (campaignId: string) => void
  reset: () => void
  setSubmitError: (message: string | null) => void
}

const campaignWizardSearchSchema = z.object({
  step: z.number().int().min(1).max(7).default(1),
})

type CampaignWizardSearch = {
  step?: number
}

export const Route = createFileRoute('/_brand/campaigns/new')({
  validateSearch: (search): CampaignWizardSearch =>
    campaignWizardSearchSchema.parse(search),
  beforeLoad: ({ search }) => {
    const step = search.step ?? 1
    if (step > 1 && !useCampaignWizardStore.getState().canAccessStep(step)) {
      throw redirect({ to: '/campaigns/new', search: { step: 1 } })
    }
  },
  component: CampaignsNewLayout,
  pendingComponent: CampaignsNewPending,
  errorComponent: CampaignsNewError,
})

function CampaignsNewLayout() {
  const router = useRouter()
  const { step = 1 } = Route.useSearch()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const createCampaignMutation = useCreateCampaignMutation()
  const wizardState = useCampaignWizardStore()
  const step1ContentType = useCampaignWizardStore(
    (state) => state.step1.content_type,
  )
  const step2PricingModel = useCampaignWizardStore(
    (state) => state.step2.pricing_model,
  )
  const step3 = useCampaignWizardStore((state) => state.step3)
  const step4 = useCampaignWizardStore((state) => state.step4)
  const step5CompensationType = useCampaignWizardStore(
    (state) => state.step5.compensation_type,
  )
  const step6ContentGuidelines = useCampaignWizardStore(
    (state) => state.step6.content_guidelines,
  )
  const completedSteps = useCampaignWizardStore((state) => state.completedSteps)

  useEffect(() => {
    track('campaign_wizard_step_entered', { step_number: step })
  }, [step])

  const handleExit = useCallback(() => {
    void router.navigate({ to: '/campaigns' })
  }, [router])

  const handleBack = useCallback(() => {
    if (step === 1) {
      return
    }

    void router.navigate({
      to: '/campaigns/new',
      search: { step: step - 1 },
    })
  }, [router, step])

  const handleEditStep = useCallback(
    (nextStep: number) => {
      setSubmitError(null)
      void router.navigate({
        to: '/campaigns/new',
        search: { step: nextStep },
      })
    },
    [router],
  )

  const handleNext = useCallback(() => {
    if (step === 1) {
      const store = useCampaignWizardStore.getState()
      if (store.step1.content_type === null) {
        return
      }
      store.markStepCompleted(1)
      track('campaign_wizard_step_completed', { step_number: 1 })
      void router.navigate({ to: '/campaigns/new', search: { step: 2 } })
      return
    }

    if (step === 2) {
      const store = useCampaignWizardStore.getState()
      if (store.step2.pricing_model === null) {
        return
      }
      store.markStepCompleted(2)
      track('campaign_wizard_step_completed', { step_number: 2 })
      void router.navigate({ to: '/campaigns/new', search: { step: 3 } })
      return
    }

    if (step === 3) {
      const store = useCampaignWizardStore.getState()
      if (
        store.step3.name.trim() === '' ||
        store.step3.description.trim() === '' ||
        !isValidTargetUrl(store.step3.target_url.trim()) ||
        store.step3.imageS3Key === null
      ) {
        return
      }
      store.markStepCompleted(3)
      track('campaign_wizard_step_completed', { step_number: 3 })
      void router.navigate({ to: '/campaigns/new', search: { step: 4 } })
      return
    }

    if (step === 4) {
      const store = useCampaignWizardStore.getState()
      if (
        store.step4.platforms.length === 0 ||
        store.step4.interests.length === 0 ||
        store.step4.creator_country === null ||
        store.step4.min_creator_tier_slug === null
      ) {
        return
      }
      store.markStepCompleted(4)
      track('campaign_wizard_step_completed', { step_number: 4 })
      void router.navigate({ to: '/campaigns/new', search: { step: 5 } })
      return
    }

    if (step === 5) {
      const store = useCampaignWizardStore.getState()
      if (store.step5.compensation_type === null) {
        return
      }
      store.markStepCompleted(5)
      track('campaign_wizard_step_completed', { step_number: 5 })
      void router.navigate({ to: '/campaigns/new', search: { step: 6 } })
      return
    }

    if (step === 6) {
      const store = useCampaignWizardStore.getState()
      if (store.step6.content_guidelines.trim().length < 50) {
        return
      }
      store.markStepCompleted(6)
      track('campaign_wizard_step_completed', { step_number: 6 })
      void router.navigate({ to: '/campaigns/new', search: { step: 7 } })
      return
    }

    if (step === 7) {
      submitCampaignWizard({
        state: useCampaignWizardStore.getState(),
        mutate: createCampaignMutation.mutate,
        reset: useCampaignWizardStore.getState().reset,
        setSubmitError,
        navigateToCampaign: (campaignId) => {
          void router.navigate({
            to: '/campaigns/$campaignId',
            params: { campaignId },
            search: { tab: 'overview' },
          })
        },
      })
    }
  }, [createCampaignMutation, router, step])

  const nextDisabled =
    step === 1
      ? step1ContentType === null
      : step === 2
        ? step2PricingModel === null
        : step === 3
          ? step3.name.trim() === '' ||
            step3.description.trim() === '' ||
            !isValidTargetUrl(step3.target_url.trim()) ||
            step3.imageS3Key === null
          : step === 4
            ? step4.platforms.length === 0 ||
              step4.interests.length === 0 ||
              step4.creator_country === null ||
              step4.min_creator_tier_slug === null
            : step === 5
              ? step5CompensationType === null
              : step === 6
                ? step6ContentGuidelines.trim().length < 50
                : step === 7
                  ? buildCreateCampaignRequest(wizardState) === null ||
                    createCampaignMutation.isPending
                  : true

  return (
    <WizardLayout
      step={step}
      totalSteps={7}
      completedSteps={completedSteps}
      onBack={handleBack}
      onCancel={handleExit}
      onNext={handleNext}
      nextDisabled={nextDisabled}
      nextLabel={step === 7 ? <Trans>Crear campaña</Trans> : undefined}
    >
      {step === 1 ? <WizardStep1ContentType /> : null}
      {step === 2 ? <WizardStep2PricingModel /> : null}
      {step === 3 ? <WizardStep3Brief /> : null}
      {step === 4 ? <WizardStep4Audience /> : null}
      {step === 5 ? <WizardStep5Compensation /> : null}
      {step === 6 ? <WizardStep6Content /> : null}
      {step === 7 ? (
        <div className="flex flex-col gap-6">
          {submitError ? (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {submitError}
            </div>
          ) : null}
          <WizardStep7Review onEditStep={handleEditStep} />
        </div>
      ) : null}
    </WizardLayout>
  )
}

export function submitCampaignWizard({
  state,
  mutate,
  navigateToCampaign,
  reset,
  setSubmitError,
}: SubmitCampaignWizardOptions): boolean {
  const request = buildCreateCampaignRequest(state)
  if (request === null) {
    setSubmitError(t`Completá los datos requeridos antes de crear la campaña.`)
    return false
  }

  setSubmitError(null)
  track('campaign_wizard_submitted', { completed_steps: state.completedSteps })
  mutate(
    { data: request },
    {
      onSuccess: (response: createCampaignResponse) => {
        if (response.status !== 201) {
          const message = getCreateCampaignErrorMessage(response.data)
          track('campaign_wizard_failed', { reason: message })
          setSubmitError(message)
          return
        }

        track('campaign_wizard_created', { campaign_id: response.data.id })
        reset()
        navigateToCampaign(response.data.id)
      },
      onError: (error) => {
        const message = getCreateCampaignErrorMessage(error)
        track('campaign_wizard_failed', { reason: message })
        setSubmitError(message)
      },
    },
  )
  return true
}

export function getCreateCampaignErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 422) {
      const fieldErrors = error.details?.field_errors
      const firstFieldError = fieldErrors
        ? Object.values(fieldErrors).flat().find(Boolean)
        : null

      const errorMessage = error.message
      return firstFieldError
        ? t`Revisá los datos de la campaña: ${firstFieldError}`
        : t`Revisá los datos de la campaña: ${errorMessage}`
    }

    return error.message || t`No pudimos crear la campaña. Intentá de nuevo.`
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof error.error === 'object' &&
    error.error !== null &&
    'message' in error.error &&
    typeof error.error.message === 'string'
  ) {
    return error.error.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return t`No pudimos crear la campaña. Intentá de nuevo.`
}

function CampaignsNewPending() {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      <div className="flex h-14 items-center justify-between border-b px-6">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-8 w-20 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-1 w-full bg-muted" />
      <main className="flex flex-1 flex-col items-center justify-center px-24 py-12">
        <div className="flex w-full max-w-lg flex-col items-center gap-6">
          <div className="h-6 w-48 animate-pulse rounded bg-muted" />
          <div className="h-32 w-full animate-pulse rounded-lg bg-muted" />
        </div>
      </main>
    </div>
  )
}

function CampaignsNewError({ error, reset }: ErrorComponentProps) {
  const router = useRouter()

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-background">
      <h2 className="text-lg font-semibold text-foreground">
        <Trans>Algo salió mal</Trans>
      </h2>
      <p className="text-sm text-muted-foreground">
        {error instanceof Error ? error.message : t`Error inesperado`}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={reset}>
          <Trans>Reintentar</Trans>
        </Button>
        <Button
          variant="ghost"
          onClick={() => void router.navigate({ to: '/campaigns' })}
        >
          <Trans>Volver a campañas</Trans>
        </Button>
      </div>
    </div>
  )
}
