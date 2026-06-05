import type { ReactNode } from 'react'
import { Trans } from '@lingui/react/macro'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { WizardStepIndicator } from './WizardStepIndicator'

interface WizardLayoutProps {
  step: number
  totalSteps: 7
  completedSteps?: number[]
  onBack: () => void
  onCancel: () => void
  onNext: () => void
  nextDisabled?: boolean
  nextLabel?: ReactNode
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
  children,
}: WizardLayoutProps) {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      <header className="flex shrink-0 flex-col gap-4 border-b border-border bg-background px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-muted-foreground">
            <Trans>
              Paso {step} de {totalSteps}
            </Trans>
          </span>
          <Button variant="outline" size="sm" onClick={onCancel}>
            <X aria-hidden="true" />
            <Trans>Cancelar</Trans>
          </Button>
        </div>
        <WizardStepIndicator
          step={step}
          totalSteps={totalSteps}
          completedSteps={completedSteps}
        />
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-10">
        <div className="mx-auto w-full max-w-4xl">{children}</div>
      </main>

      <footer className="flex shrink-0 items-center justify-between border-t border-border bg-background px-6 py-4">
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
    </div>
  )
}
