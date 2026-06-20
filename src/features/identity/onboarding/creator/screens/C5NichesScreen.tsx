import { t } from '@lingui/core/macro'
import { OnboardingOptionChip } from '#/features/identity/onboarding/shared/components'
import { useListInterests } from '#/shared/api/generated/lookups/lookups'
import { useCreatorOnboardingStore } from '../store'

export function C5NichesScreen() {
  const store = useCreatorOnboardingStore()
  const selected = store.niches ?? []
  const interestsQuery = useListInterests()
  const options =
    interestsQuery.data?.status === 200
      ? interestsQuery.data.data.items.map((interest) => ({
          value: interest.slug,
          label: interest.label_es,
        }))
      : []

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      store.setField(
        'niches',
        selected.filter((v) => v !== value),
      )
    } else if (selected.length < 5) {
      store.setField('niches', [...selected, value])
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex w-full max-w-[600px] flex-col items-center gap-2.5">
        <h1 className="text-center text-[28px] font-semibold leading-tight tracking-[-0.02em] text-foreground">
          {t`¿En qué nichos te especializás?`}
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          {t`Nos sirve para mostrarte las ofertas que matchean con tu perfil.`}
        </p>
      </div>
      <div className="flex max-w-[720px] flex-wrap justify-center gap-2">
        {options.map((o) => (
          <OnboardingOptionChip
            key={o.value}
            label={o.label}
            selected={selected.includes(o.value)}
            onToggle={() => toggle(o.value)}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {(() => {
          const n = selected.length
          return t`${n} de 5 seleccionados`
        })()}
      </p>
    </div>
  )
}
