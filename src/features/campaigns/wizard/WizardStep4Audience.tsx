import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { Instagram, Music2, Youtube } from 'lucide-react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { cn } from '#/lib/utils'
import { MatchLiveBlock } from './MatchLiveBlock'
import {
  useCountriesQuery,
  useCreatorTiersQuery,
  useInterestsQuery,
} from './queries'
import { useCampaignWizardStore } from './store'
import type { SocialPlatform } from './store'

const platformOptions: Array<{
  value: SocialPlatform
  label: string
  Icon: typeof Instagram
}> = [
  { value: 'tiktok', label: 'TikTok', Icon: Music2 },
  { value: 'instagram', label: 'Instagram', Icon: Instagram },
  { value: 'youtube', label: 'YouTube', Icon: Youtube },
]

const tierFollowersFormatter = new Intl.NumberFormat('es-AR', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function WizardStep4Audience() {
  const step4 = useCampaignWizardStore((state) => state.step4)
  const setStep4 = useCampaignWizardStore((state) => state.setStep4)
  const interestsQuery = useInterestsQuery()
  const countriesQuery = useCountriesQuery({ active: true })
  const creatorTiersQuery = useCreatorTiersQuery()
  const interests =
    interestsQuery.data?.status === 200 ? interestsQuery.data.data.items : []
  const countries =
    countriesQuery.data?.status === 200 ? countriesQuery.data.data.items : []
  const creatorTiers =
    creatorTiersQuery.data?.status === 200
      ? creatorTiersQuery.data.data.items
      : []

  const togglePlatform = (platform: SocialPlatform) => {
    const platforms = step4.platforms.includes(platform)
      ? step4.platforms.filter((value) => value !== platform)
      : [...step4.platforms, platform]

    setStep4({ platforms })
  }

  const toggleInterest = (interest: string) => {
    const interests = step4.interests.includes(interest)
      ? step4.interests.filter((value) => value !== interest)
      : [...step4.interests, interest]

    setStep4({ interests })
  }

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">
          <Trans>Definí la audiencia</Trans>
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          <Trans>Elegí los filtros para encontrar creators compatibles.</Trans>
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6">
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-foreground">
              <Trans>Plataformas</Trans>
            </h2>
            <div
              role="group"
              aria-label={t`Plataformas`}
              className="flex flex-wrap gap-2"
            >
              {platformOptions.map(({ value, label, Icon }) => {
                const selected = step4.platforms.includes(value)

                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => togglePlatform(value)}
                    className={cn(
                      'inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors',
                      selected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-foreground hover:bg-surface-hover',
                    )}
                  >
                    <Icon aria-hidden="true" className="size-4" />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-foreground">
              <Trans>Intereses</Trans>
            </h2>
            <div
              role="group"
              aria-label={t`Intereses`}
              className="flex flex-wrap gap-2"
            >
              {interests.map((interest) => {
                const selected = step4.interests.includes(interest.slug)

                return (
                  <button
                    key={interest.slug}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleInterest(interest.slug)}
                    className={cn(
                      'inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium transition-colors',
                      selected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-foreground hover:bg-surface-hover',
                    )}
                  >
                    {interest.label_es}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-foreground">
                <Trans>País</Trans>
              </h2>
              <Select
                value={step4.creator_country ?? undefined}
                onValueChange={(creator_country) =>
                  setStep4({ creator_country })
                }
              >
                <SelectTrigger
                  aria-label={t`País`}
                  className="w-full justify-between"
                >
                  <SelectValue placeholder={t`Seleccioná un país`} />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.label_es}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-foreground">
                <Trans>Tier mínimo de seguidores</Trans>
              </h2>
              <div
                role="radiogroup"
                aria-label={t`Tier mínimo de seguidores`}
                className="flex flex-wrap gap-2"
              >
                {creatorTiers.map((tier) => {
                  const selected = step4.min_creator_tier_slug === tier.slug

                  return (
                    <button
                      key={tier.slug}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() =>
                        setStep4({ min_creator_tier_slug: tier.slug })
                      }
                      className={cn(
                        'inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors',
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card text-foreground hover:bg-surface-hover',
                      )}
                    >
                      <span>{tier.label_es}</span>
                      <span className="text-xs opacity-70">
                        {tierFollowersFormatter.format(tier.followers_min)}+{' '}
                        <Trans>seguidores</Trans>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <MatchLiveBlock
          platforms={step4.platforms}
          interests={step4.interests}
          creator_country={step4.creator_country}
          min_creator_tier_slug={step4.min_creator_tier_slug}
        />
      </div>
    </section>
  )
}
