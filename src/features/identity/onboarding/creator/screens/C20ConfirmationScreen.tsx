import { useEffect, useState } from 'react'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  Check,
  ArrowRight,
  Loader2,
  Instagram,
  Youtube,
  MapPin,
  Sparkles,
} from 'lucide-react'
import { Flag } from '#/shared/ui/Flag'
import {
  useListContentTypes,
  useListInterests,
} from '#/shared/api/generated/lookups/lookups'
import { useSubmitCreatorOnboarding } from '../useSubmitCreatorOnboarding'
import { useCreatorOnboardingStore } from '../store'
import { getStepId, getStepIndex } from '../steps'
import { COUNTRIES } from '../countries'

/* eslint-disable lingui/no-unlocalized-strings */
const AVATAR_PREVIEW_KEY = 'marz-creator-onboarding-avatar-preview'

const PLATFORM_LABELS: Record<string, () => string> = {
  instagram: () => 'Instagram',
  tiktok: () => 'TikTok',
  youtube: () => 'YouTube',
}

const FORMAT_LABELS: Record<string, () => string> = {
  ig_reel: () => 'Reel',
  tiktok_video: () => 'Video',
  yt_short: () => 'Short',
}
/* eslint-enable lingui/no-unlocalized-strings */

const TIER_LABELS: Record<string, () => string> = {
  nano: () => t`Nano`,
  micro: () => t`Micro`,
  mid: () => t`Mid`,
  macro: () => t`Macro`,
}

function humanizeSlug(slug: string): string {
  const spaced = slug.replace(/_/g, ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

function PlatformIcon({ platform }: { platform: string }) {
  const cls = 'size-4 text-foreground' // eslint-disable-line lingui/no-unlocalized-strings
  if (platform === 'instagram') return <Instagram className={cls} />
  if (platform === 'youtube') return <Youtube className={cls} />
  if (platform === 'tiktok')
    return (
      <span
        aria-hidden
        className="text-[14px] font-bold leading-none text-foreground"
      >
        ♪
      </span>
    )
  return <span className="size-2 rounded-full bg-foreground" aria-hidden />
}

export function C20ConfirmationScreen() {
  const { submit, isPending } = useSubmitCreatorOnboarding()
  const store = useCreatorOnboardingStore()
  const navigate = useNavigate()
  const interestsQuery = useListInterests()
  const contentTypesQuery = useListContentTypes()
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const nicheLabelBySlug =
    interestsQuery.data?.status === 200
      ? new Map(interestsQuery.data.data.items.map((i) => [i.slug, i.label_es]))
      : new Map<string, string>()
  const contentTypeLabelBySlug =
    contentTypesQuery.data?.status === 200
      ? new Map(
          contentTypesQuery.data.data.items.map((c) => [c.slug, c.label_es]),
        )
      : new Map<string, string>()

  const goBack = () => {
    const prevIndex = Math.max(0, getStepIndex('confirmation') - 1)
    void navigate({
      to: '/onboarding/creator/$step',
      params: { step: getStepId(prevIndex) },
    })
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (store.avatar_s3_key) {
      setAvatarPreview(sessionStorage.getItem(AVATAR_PREVIEW_KEY))
    }
  }, [store.avatar_s3_key])

  const displayName = store.display_name?.trim() ?? ''
  const firstName = displayName.split(/\s+/)[0] ?? t`Creador`
  const handle = store.handle ? `@${store.handle}` : ''
  const initials =
    displayName
      .split(/\s+/)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase() ?? '')
      .join('') || firstName.slice(0, 2).toUpperCase()

  const tierLabel = store.tier
    ? (TIER_LABELS[store.tier]?.() ?? store.tier)
    : undefined
  const niches = store.niches ?? []
  const contentTypes = store.content_types ?? []
  const channels = store.channels ?? []
  const ugcOn = (store.creator_kinds ?? []).includes('ugc')
  const ugcAmount = Number(store.ugc_rate_amount)
  const ugcRateText =
    Number.isFinite(ugcAmount) && ugcAmount > 0
      ? `${ugcAmount.toLocaleString('es-AR')} USD`
      : null
  const city = store.city?.trim()
  const countryCode = store.country ?? ''
  const countryName = COUNTRIES.find((c) => c.code === countryCode)?.name

  return (
    <div className="relative flex w-full flex-col items-center gap-10 max-sm:gap-5">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-160px] h-[700px] w-[860px] -translate-x-1/2 opacity-80 wizard-glow-pulse"
        style={{
          background:
            'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(13, 166, 120, 0.28) 0%, rgba(13, 166, 120, 0) 100%)',
        }}
      />

      <div className="relative flex flex-col items-center gap-5 max-sm:gap-3">
        <div className="relative flex size-[72px] items-center justify-center rounded-full bg-primary/20 max-sm:size-14">
          <span
            aria-hidden
            className="wizard-tick-halo absolute inset-0 rounded-full bg-primary/40"
          />
          <div className="wizard-tick-beat flex size-11 items-center justify-center rounded-full bg-primary">
            <Check className="size-6 text-primary-foreground" strokeWidth={3} />
          </div>
        </div>
      </div>

      <div className="relative flex w-full max-w-[520px] flex-col overflow-hidden rounded-3xl border border-border bg-card">
        <div className="flex items-center gap-4 p-5">
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt={displayName || t`Avatar del creador`}
              className="size-16 rounded-full object-cover ring-2 ring-primary/30"
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-full bg-primary ring-2 ring-primary/30">
              <span className="text-base font-bold text-primary-foreground">
                {initials}
              </span>
            </div>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-base font-bold text-foreground">
                {displayName || <Trans>Tu nombre</Trans>}
              </span>
              {tierLabel && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  <Sparkles className="size-3" />
                  {tierLabel}
                </span>
              )}
            </div>
            {handle && (
              <span className="truncate text-[13px] text-muted-foreground">
                {handle}
              </span>
            )}
            {(city || countryName) && (
              <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <MapPin className="size-3" />
                <Flag country={countryCode} className="rounded-[2px]" />
                {[city, countryName].filter(Boolean).join(', ')}
              </span>
            )}
          </div>
        </div>

        {(niches.length > 0 || contentTypes.length > 0) && (
          <div className="flex flex-col gap-3 border-t border-border px-5 py-4">
            {niches.length > 0 && (
              <Section title={t`Nichos`}>
                {niches.map((n) => (
                  <Chip key={n}>
                    {nicheLabelBySlug.get(n) ?? humanizeSlug(n)}
                  </Chip>
                ))}
              </Section>
            )}
            {contentTypes.length > 0 && (
              <Section title={t`Formatos`}>
                {contentTypes.map((c) => (
                  <Chip key={c}>
                    {contentTypeLabelBySlug.get(c) ?? humanizeSlug(c)}
                  </Chip>
                ))}
              </Section>
            )}
          </div>
        )}

        {channels.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-border px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t`Canales`}
            </p>
            <div className="flex flex-col gap-3">
              {channels.map((c) => (
                <div key={c.platform} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <PlatformIcon platform={c.platform} />
                      <span className="text-[13px] font-medium text-foreground">
                        {PLATFORM_LABELS[c.platform]?.() ?? c.platform}
                      </span>
                      {c.is_primary && (
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {t`Principal`}
                        </span>
                      )}
                    </div>
                    <span className="truncate text-[12px] text-muted-foreground">
                      @{c.external_handle}
                    </span>
                  </div>
                  {c.rate_cards.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pl-6">
                      {c.rate_cards.map((rc) => {
                        const amount = Number(rc.rate_amount)
                        const valid = Number.isFinite(amount) && amount > 0
                        return (
                          <span
                            key={rc.format}
                            className="rounded-md border border-border bg-background px-2 py-1 text-[11px] text-foreground"
                          >
                            <span className="text-muted-foreground">
                              {FORMAT_LABELS[rc.format]?.() ?? rc.format}
                            </span>
                            {valid && (
                              <span className="ml-1.5 font-semibold">
                                {amount.toLocaleString('es-AR')}{' '}
                                {rc.rate_currency}
                              </span>
                            )}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {ugcOn && (
          <div className="flex flex-col gap-3 border-t border-border px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t`Formato UGC`}
            </p>
            <span className="text-[13px] text-foreground">
              {ugcRateText ? t`Tarifa: ${ugcRateText}` : t`Sin tarifa cargada`}
            </span>
          </div>
        )}
      </div>

      <div className="relative flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={goBack}
          disabled={isPending}
          className="flex h-12 items-center gap-2 rounded-xl border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70"
        >
          <ArrowLeft className="size-4" />
          {t`Atrás`}
        </button>
        <button
          type="button"
          data-testid="onboarding-start-btn"
          disabled={isPending}
          onClick={submit}
          className="flex h-12 items-center gap-2.5 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              {t`Ir a mi dashboard`}
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground">
      {children}
    </span>
  )
}
