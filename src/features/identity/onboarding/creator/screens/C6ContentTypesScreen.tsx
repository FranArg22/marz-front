import { t } from '@lingui/core/macro'
import {
  PackageOpen,
  Star,
  LayoutTemplate,
  Sparkles,
  BookOpen,
  Megaphone,
  Scissors,
  GraduationCap,
  Mic,
  Laugh,
  Sun,
  Clapperboard,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { OnboardingContentTypeChip } from '#/features/identity/onboarding/shared/components'
import { CONTENT_TYPE_OPTIONS as SHARED_CONTENT_TYPE_OPTIONS } from '#/shared/catalog/creatorTaxonomy'
import { useCreatorOnboardingStore } from '../store'

const CONTENT_TYPE_ICONS: Record<string, LucideIcon> = {
  unboxing: PackageOpen,
  reviews: Star,
  product_demos: LayoutTemplate,
  lifestyle: Sparkles,
  storytelling: BookOpen,
  video_ads: Megaphone,
  faceless_clipping: Scissors,
  tutorials: GraduationCap,
  interviews: Mic,
  humor_sketches: Laugh,
  day_in_the_life: Sun,
  behind_the_scenes: Clapperboard,
}

const CONTENT_TYPE_OPTIONS: {
  value: string
  label: () => string
  icon: LucideIcon
}[] = SHARED_CONTENT_TYPE_OPTIONS.flatMap((option) => {
  const icon = CONTENT_TYPE_ICONS[option.value]
  return icon ? [{ ...option, icon }] : []
})

export function C6ContentTypesScreen() {
  const store = useCreatorOnboardingStore()
  const selected = store.content_types ?? []

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      store.setField(
        'content_types',
        selected.filter((v) => v !== value),
      )
    } else {
      store.setField('content_types', [...selected, value])
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-9">
      <div className="flex w-full max-w-[600px] flex-col items-center gap-2.5">
        <h1 className="text-center text-[28px] font-semibold leading-tight tracking-[-0.02em] text-foreground">
          {t`¿Qué tipo de contenido hacés?`}
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          {t`Las marcas buscan tipos específicos. Marcá los que te salen bien.`}
        </p>
      </div>
      <div className="flex max-w-[800px] flex-wrap justify-center gap-2.5">
        {CONTENT_TYPE_OPTIONS.map((o) => (
          <OnboardingContentTypeChip
            key={o.value}
            label={o.label()}
            icon={o.icon}
            selected={selected.includes(o.value)}
            onToggle={() => toggle(o.value)}
          />
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground" aria-live="polite">
        {(() => {
          const n = selected.length
          const total = CONTENT_TYPE_OPTIONS.length
          return t`${n} de ${total} seleccionados`
        })()}
      </p>
    </div>
  )
}
