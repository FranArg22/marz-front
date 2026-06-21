import { t } from '@lingui/core/macro'
import { Input } from '#/components/ui/input'
import { OnboardingOptionChip } from '#/features/identity/onboarding/shared/components'
import { useCreatorOnboardingStore } from '../store'

export function C7bUgcScreen() {
  const store = useCreatorOnboardingStore()
  const kinds = store.creator_kinds ?? []
  const ugcOn = kinds.includes('ugc')
  const answered = store.creator_kinds !== undefined

  const setUgc = (on: boolean) => {
    store.setField('creator_kinds', on ? ['influencer', 'ugc'] : ['influencer'])
    if (!on) store.setField('ugc_rate_amount', undefined)
  }

  return (
    <div className="flex w-full flex-col items-center gap-9">
      <div className="flex w-full max-w-[600px] flex-col items-center gap-2.5">
        <h1 className="text-center text-[28px] font-semibold leading-tight tracking-[-0.02em] text-foreground">
          {t`¿Hacés contenido UGC?`}
        </h1>
        <p className="text-center text-sm leading-[1.5] text-muted-foreground">
          {t`El UGC es contenido que creás para que la marca lo publique en sus propios canales. No se sube a tus redes. Si lo ofrecés, podés cobrar una tarifa aparte de tus redes.`}
        </p>
      </div>

      <div className="flex gap-2.5" role="radiogroup">
        <OnboardingOptionChip
          role="radio"
          aria-checked={ugcOn}
          label={t`Sí, hago UGC`}
          selected={ugcOn}
          onToggle={() => setUgc(true)}
        />
        <OnboardingOptionChip
          role="radio"
          aria-checked={answered && !ugcOn}
          label={t`No por ahora`}
          selected={answered && !ugcOn}
          onToggle={() => setUgc(false)}
        />
      </div>

      {ugcOn && (
        <div className="flex w-full max-w-[360px] flex-col gap-1.5">
          <span className="text-[length:var(--font-size-sm)] font-medium text-foreground">
            {t`Tu tarifa por video UGC`}
          </span>
          <div className="flex items-end gap-2">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={store.ugc_rate_amount ?? ''}
              onChange={(e) =>
                store.setField('ugc_rate_amount', e.target.value || undefined)
              }
              placeholder="0.00"
              maxLength={50}
            />
            <span className="flex h-9 w-[80px] items-center justify-center rounded-md border border-border bg-muted text-sm text-muted-foreground">
              {t`USD`}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
