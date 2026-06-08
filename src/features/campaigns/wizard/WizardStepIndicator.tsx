import { t } from '@lingui/core/macro'
import { Check } from 'lucide-react'

import { cn } from '#/lib/utils'

interface WizardStepIndicatorProps {
  step: number
  totalSteps: number
  completedSteps?: number[]
}

export function WizardStepIndicator({
  step,
  totalSteps,
  completedSteps = [],
}: WizardStepIndicatorProps) {
  return (
    <div
      className="flex w-full items-center gap-2"
      role="progressbar"
      aria-label={t`Progreso del wizard`}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-valuenow={step}
    >
      {Array.from({ length: totalSteps }, (_, index) => {
        const segmentStep = index + 1
        const isCompleted = completedSteps.includes(segmentStep)
        const isActive = segmentStep === step

        return (
          <div
            key={segmentStep}
            className={cn(
              'flex h-2 flex-1 items-center justify-center rounded-full transition-colors',
              isCompleted || isActive ? 'bg-primary' : 'bg-muted',
            )}
            aria-label={t`Paso ${segmentStep}`}
          >
            {isCompleted && (
              <Check
                className="size-3 text-primary-foreground"
                aria-hidden="true"
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
