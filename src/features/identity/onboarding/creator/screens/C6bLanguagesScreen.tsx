import { t } from '@lingui/core/macro'
import { OnboardingOptionChip } from '#/features/identity/onboarding/shared/components'
import { CreatorOnboardingPayloadLanguagesItem } from '#/shared/api/generated/model/creatorOnboardingPayloadLanguagesItem'
import { useCreatorOnboardingStore } from '../store'

const LANGUAGE_OPTIONS: { value: string; label: () => string }[] = [
  { value: CreatorOnboardingPayloadLanguagesItem.es, label: () => t`Español` },
  { value: CreatorOnboardingPayloadLanguagesItem.en, label: () => t`Inglés` },
  {
    value: CreatorOnboardingPayloadLanguagesItem.pt,
    label: () => t`Portugués`,
  },
  { value: CreatorOnboardingPayloadLanguagesItem.zh, label: () => t`Chino` },
  { value: CreatorOnboardingPayloadLanguagesItem.ja, label: () => t`Japonés` },
  { value: CreatorOnboardingPayloadLanguagesItem.fr, label: () => t`Francés` },
  { value: CreatorOnboardingPayloadLanguagesItem.it, label: () => t`Italiano` },
]

export function C6bLanguagesScreen() {
  const store = useCreatorOnboardingStore()
  const selected = store.languages ?? []

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      store.setField(
        'languages',
        selected.filter((v) => v !== value),
      )
    } else {
      store.setField('languages', [...selected, value])
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-8 max-sm:gap-5">
      <div className="flex w-full max-w-[600px] flex-col items-center gap-2.5">
        <h1 className="text-center text-[28px] font-semibold leading-tight tracking-[-0.02em] text-foreground max-sm:text-[22px]">
          {t`¿En qué idiomas creás contenido?`}
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          {t`Las marcas filtran por idioma. Marcá todos los que usás.`}
        </p>
      </div>
      <div className="flex max-w-[720px] flex-wrap justify-center gap-2">
        {LANGUAGE_OPTIONS.map((o) => (
          <OnboardingOptionChip
            key={o.value}
            label={o.label()}
            selected={selected.includes(o.value)}
            onToggle={() => toggle(o.value)}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {(() => {
          const n = selected.length
          return t`${n} seleccionados`
        })()}
      </p>
    </div>
  )
}
