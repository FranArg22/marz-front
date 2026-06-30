import { useState } from 'react'
import type { ReactNode } from 'react'
import { Trans } from '@lingui/react/macro'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { WizardStepTransition } from '#/shared/ui/wizard'
import { track } from '#/shared/analytics/track'
import { CancelWizardModal } from './CancelWizardModal'
import { WizardStepIndicator } from './WizardStepIndicator'
import { useCampaignWizardStore } from './store'

interface WizardLayoutProps {
  step: number
  totalSteps: 7
  completedSteps?: number[]
  onBack: () => void
  onCancel: () => void
  onNext: () => void
  nextDisabled?: boolean
  nextLabel?: ReactNode
  headerActions?: ReactNode
  children: ReactNode
}

export function WizardLayout({
  step,
  totalSteps,
  completedSteps,
  onBack,
  onCancel,
  onNext,
  nextDisabled = false,
  nextLabel,
  headerActions,
  children,
}: WizardLayoutProps) {
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const isDirty = useCampaignWizardStore((state) => state.isDirty)

  function handleCancelClick() {
    if (!isDirty) {
      track('campaign_wizard_cancelled', {
        step_number_at_cancel: step,
        had_inputs: false,
      })
      onCancel()
      return
    }

    setCancelModalOpen(true)
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background text-foreground">
      <header className="flex shrink-0 flex-col gap-4 border-b border-border bg-background px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-muted-foreground">
            <Trans>
              Paso {step} de {totalSteps}
            </Trans>
          </span>
          <div className="flex items-center gap-2">
            {headerActions}
            <Button variant="outline" size="sm" onClick={handleCancelClick}>
              <X aria-hidden="true" />
              <Trans>Cancelar</Trans>
            </Button>
          </div>
        </div>
        <WizardStepIndicator
          step={step}
          totalSteps={totalSteps}
          completedSteps={completedSteps}
        />
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-10">
        <div className="mx-auto w-full max-w-4xl">
          <WizardStepTransition
            stepKey={String(step)}
            index={step}
            contentClassName="items-stretch"
          >
            {children}
          </WizardStepTransition>
        </div>
      </main>

      <footer className="flex shrink-0 items-center justify-between border-t border-border bg-background px-6 pt-4 pb-4 max-sm:pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={step === 1}
          aria-disabled={step === 1}
        >
          <ArrowLeft aria-hidden="true" />
          <Trans>Atrás</Trans>
        </Button>
        <Button onClick={onNext} disabled={nextDisabled}>
          {nextLabel ?? <Trans>Continuar</Trans>}
          <ArrowRight aria-hidden="true" />
        </Button>
      </footer>

      <CancelWizardModal
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        onExit={onCancel}
        step={step}
      />
    </div>
  )
}
