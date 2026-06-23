import { t } from '@lingui/core/macro'
import { Sprout, TrendingUp, Star, Crown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { OnboardingTierCard } from '#/features/identity/onboarding/shared/components'
import { useCreatorOnboardingStore } from '../store'
import type { CreatorOnboardingPayloadTier as Tier } from '#/shared/api/generated/model/creatorOnboardingPayloadTier'
import { CreatorOnboardingPayloadTier } from '#/shared/api/generated/model/creatorOnboardingPayloadTier'

const TIER_OPTIONS: {
  value: Tier
  label: () => string
  description: () => string
  icon: LucideIcon
}[] = [
  {
    value: CreatorOnboardingPayloadTier.nano,
    label: () => t`Nano`,
    description: () => t`1K–10K followers`,
    icon: Sprout,
  },
  {
    value: CreatorOnboardingPayloadTier.micro,
    label: () => t`Micro`,
    description: () => t`10K–100K followers`,
    icon: TrendingUp,
  },
  {
    value: CreatorOnboardingPayloadTier.mid,
    label: () => t`Mid`,
    description: () => t`100K–500K followers`,
    icon: Star,
  },
  {
    value: CreatorOnboardingPayloadTier.macro,
    label: () => t`Macro`,
    description: () => t`500K+ followers`,
    icon: Crown,
  },
]

export function C4TierScreen() {
  const store = useCreatorOnboardingStore()

  return (
    <div className="flex w-full flex-col items-center gap-9 max-sm:gap-6">
      <div className="flex w-full max-w-[640px] flex-col items-center gap-2.5">
        <h1 className="text-center text-[28px] font-semibold leading-tight tracking-[-0.02em] text-foreground max-sm:text-[22px]">
          {t`¿Cuántos seguidores tenés hoy?`}
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          {t`Usamos tu cantidad de seguidores para mostrarte ofertas acordes.`}
        </p>
      </div>
      <div
        className="flex w-full max-w-[460px] flex-wrap justify-center gap-3"
        role="radiogroup"
        aria-label={t`Tier`}
      >
        {TIER_OPTIONS.map((o) => (
          <OnboardingTierCard
            key={o.value}
            label={o.label()}
            description={o.description()}
            icon={o.icon}
            selected={store.tier === o.value}
            onToggle={() => store.setField('tier', o.value)}
          />
        ))}
      </div>
    </div>
  )
}
