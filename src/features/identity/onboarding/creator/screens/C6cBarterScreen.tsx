import { t } from '@lingui/core/macro'
import { OnboardingOptionChip } from '#/features/identity/onboarding/shared/components'
import { useCreatorOnboardingStore } from '../store'

const BARTER_OPTIONS: { value: boolean; label: () => string }[] = [
  { value: true, label: () => t`Sí` },
  { value: false, label: () => t`No` },
]

export function C6cBarterScreen() {
  const store = useCreatorOnboardingStore()
  const current = store.barter_preference

  return (
    <div className="flex w-full flex-col items-center gap-9 max-sm:gap-6">
      <div className="flex w-full max-w-[600px] flex-col items-center gap-2.5">
        <h1 className="text-center text-[28px] font-semibold leading-tight tracking-[-0.02em] text-foreground max-sm:text-[22px]">
          {t`¿Aceptás colaboraciones por canje?`}
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          {t`Algunas marcas ofrecen producto en lugar de pago. Opcional.`}
        </p>
      </div>
      <div
        className="flex flex-wrap justify-center gap-2.5"
        role="radiogroup"
        aria-label={t`Canje`}
      >
        {BARTER_OPTIONS.map((o) => (
          <OnboardingOptionChip
            key={String(o.value)}
            label={o.label()}
            role="radio"
            selected={current === o.value}
            aria-checked={current === o.value}
            onToggle={() => store.setField('barter_preference', o.value)}
          />
        ))}
      </div>
    </div>
  )
}
