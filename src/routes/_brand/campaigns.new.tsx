import { useCallback } from 'react'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { z } from 'zod'

import { Button } from '#/components/ui/button'
import { WizardLayout } from '#/features/campaigns/wizard/WizardLayout'
import { WizardStep1ContentType } from '#/features/campaigns/wizard/WizardStep1ContentType'
import { useCampaignWizardStore } from '#/features/campaigns/wizard/store'

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
  const step1ContentType = useCampaignWizardStore(
    (state) => state.step1.content_type,
  )
  const completedSteps = useCampaignWizardStore((state) => state.completedSteps)

  const handleExit = useCallback(() => {
    useCampaignWizardStore.getState().reset()
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

  const handleNext = useCallback(() => {
    if (step === 1) {
      const store = useCampaignWizardStore.getState()
      if (store.step1.content_type === null) {
        return
      }
      store.markStepCompleted(1)
      void router.navigate({ to: '/campaigns/new', search: { step: 2 } })
    }
  }, [router, step])

  const nextDisabled = step === 1 ? step1ContentType === null : true

  return (
    <WizardLayout
      step={step}
      totalSteps={7}
      completedSteps={completedSteps}
      onBack={handleBack}
      onCancel={handleExit}
      onNext={handleNext}
      nextDisabled={nextDisabled}
    >
      {step === 1 ? <WizardStep1ContentType /> : null}
    </WizardLayout>
  )
}

function CampaignsNewPending() {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
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
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
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
