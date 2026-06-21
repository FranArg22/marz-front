import { useRef } from 'react'
import type { ReactNode } from 'react'

import { cn } from '#/lib/utils'

interface WizardStepTransitionProps {
  /** Stable id of the current step. Drives the remount that replays the animation. */
  stepKey: string
  /** Linear index of the current step. Used to derive forward/back direction. */
  index: number
  /**
   * Overrides the content wrapper alignment. Defaults to centered, which suits
   * onboarding's narrow cards. Full-width forms pass `items-stretch`.
   */
  contentClassName?: string
  children: ReactNode
}

/**
 * Wraps wizard step content with a direction-aware enter animation.
 *
 * The component instance stays mounted across steps so the previous-index ref
 * survives; the inner keyed element remounts on each step change, replaying the
 * CSS keyframes. Forward navigation slides in from the right, back from the
 * left. Reduced motion collapses to a plain fade (handled in CSS).
 */
export function WizardStepTransition({
  stepKey,
  index,
  contentClassName,
  children,
}: WizardStepTransitionProps) {
  const prevIndex = useRef(index)
  const direction = index < prevIndex.current ? 'back' : 'forward'
  prevIndex.current = index

  return (
    <div
      key={stepKey}
      data-direction={direction}
      className={cn(
        'wizard-step flex w-full flex-col items-center',
        contentClassName,
      )}
    >
      {children}
    </div>
  )
}
