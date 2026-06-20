import { useRef  } from 'react'
import type {ReactNode} from 'react';

interface WizardStepTransitionProps {
  /** Stable id of the current step. Drives the remount that replays the animation. */
  stepKey: string
  /** Linear index of the current step. Used to derive forward/back direction. */
  index: number
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
  children,
}: WizardStepTransitionProps) {
  const prevIndex = useRef(index)
  const direction = index < prevIndex.current ? 'back' : 'forward'
  prevIndex.current = index

  return (
    <div
      key={stepKey}
      data-direction={direction}
      className="wizard-step flex w-full flex-col items-center"
    >
      {children}
    </div>
  )
}
