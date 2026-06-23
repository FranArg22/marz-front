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
  Mic2,
  Laugh,
  Sun,
  Clapperboard,
  ShoppingBag,
  Wand2,
  ArrowLeftRight,
  ChefHat,
  Video,
  Camera,
  Film,
  Music,
  Heart,
  Flame,
  Compass,
  Lightbulb,
  Smile,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { OnboardingContentTypeChip } from '#/features/identity/onboarding/shared/components'
import { useListContentTypes } from '#/shared/api/generated/lookups/lookups'
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
  hauls: ShoppingBag,
  grwm: Wand2,
  voice_over: Mic2,
  before_after: ArrowLeftRight,
  recipes: ChefHat,
  vlogs: Video,
}

// Pool de respaldo para slugs que el backend agregue y todavía no tengan icono
// propio: un hash estable del slug los reparte en iconos distintos en vez de
// caer todos en el mismo (se veían repetidos en la grilla).
const FALLBACK_ICONS: LucideIcon[] = [
  Camera,
  Film,
  Music,
  Heart,
  Flame,
  Compass,
  Lightbulb,
  Smile,
]

function iconForContentType(slug: string): LucideIcon {
  const mapped = CONTENT_TYPE_ICONS[slug]
  if (mapped) return mapped
  let hash = 0
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0
  }
  return FALLBACK_ICONS[hash % FALLBACK_ICONS.length]!
}

export function C6ContentTypesScreen() {
  const store = useCreatorOnboardingStore()
  const selected = store.content_types ?? []
  const contentTypesQuery = useListContentTypes()
  const options =
    contentTypesQuery.data?.status === 200
      ? contentTypesQuery.data.data.items.map((contentType) => ({
          value: contentType.slug,
          label: contentType.label_es,
          icon: iconForContentType(contentType.slug),
        }))
      : []

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
    <div className="flex w-full flex-col items-center gap-9 max-sm:gap-6">
      <div className="flex w-full max-w-[600px] flex-col items-center gap-2.5">
        <h1 className="text-center text-[28px] font-semibold leading-tight tracking-[-0.02em] text-foreground max-sm:text-[22px]">
          {t`¿Qué tipo de contenido hacés?`}
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          {t`Las marcas buscan tipos específicos. Marcá los que te salen bien.`}
        </p>
      </div>
      <div className="flex max-w-[800px] flex-wrap justify-center gap-2.5">
        {options.map((o) => (
          <OnboardingContentTypeChip
            key={o.value}
            label={o.label}
            icon={o.icon}
            selected={selected.includes(o.value)}
            onToggle={() => toggle(o.value)}
          />
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground" aria-live="polite">
        {(() => {
          const n = selected.length
          const total = options.length
          return t`${n} de ${total} seleccionados`
        })()}
      </p>
    </div>
  )
}
