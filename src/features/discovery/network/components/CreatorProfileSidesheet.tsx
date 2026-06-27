import { t } from '@lingui/core/macro'
import { useNavigate } from '@tanstack/react-router'
import {
  ExternalLink,
  Heart,
  Instagram,
  MessageCircle,
  Music2,
  Send,
  Tag,
  Users,
  X,
  Youtube,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Button } from '#/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '#/components/ui/sheet'
import { cn } from '#/lib/utils'
import { Flag } from '#/shared/ui/Flag'
import type {
  DiscoveryCreatorCard,
  DiscoveryCreatorPlatformStats,
} from '#/shared/api/generated/model'
import {
  CreatorOnboardingPayloadCreatorKindsItem,
  CreatorOnboardingPayloadExperienceLevel,
  CreatorOnboardingPayloadGender,
  DiscoveryCreatePairKindEnum,
} from '#/shared/api/generated/model'

import type { CreatorDetailProfile } from '../mocks/creatorDetailProfile'

const Intl_NumberFormat_compact = new Intl.NumberFormat('es-AR', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const Intl_NumberFormat_pct = new Intl.NumberFormat('es-AR', {
  style: 'percent',
  maximumFractionDigits: 1,
})

const DASH = '-'

const PLATFORM_ICONS: Record<string, LucideIcon> = {
  instagram: Instagram,
  tiktok: Music2,
  youtube: Youtube,
}

const PLATFORM_CODES: Record<string, string> = {
  /* eslint-disable lingui/no-unlocalized-strings -- platform short codes */
  instagram: 'IG',
  tiktok: 'TT',
  youtube: 'YT',
  x: 'X',
  twitch: 'TW',
  /* eslint-enable lingui/no-unlocalized-strings */
}

const PLATFORM_PROFILE_URLS: Record<string, (handle: string) => string> = {
  instagram: (handle) => `https://instagram.com/${handle}`,
  tiktok: (handle) => `https://www.tiktok.com/@${handle}`,
  youtube: (handle) => `https://youtube.com/@${handle}`,
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  ARS: '$',
  EUR: '€',
}

function currencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency.toUpperCase()] ?? `${currency} `
}

function platformCode(platform: string): string {
  return (
    PLATFORM_CODES[platform.toLowerCase()] ?? platform.slice(0, 2).toUpperCase()
  )
}

function platformProfileUrl(platform: string, handle: string): string | null {
  const build = PLATFORM_PROFILE_URLS[platform.toLowerCase()]
  if (!build) return null
  const normalized = handle.replace(/^@/, '').trim()
  return normalized ? build(normalized) : null
}

function prettifyTag(tag: string): string {
  const text = tag.replace(/_/g, ' ').trim()
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function genderLabel(gender: CreatorOnboardingPayloadGender): string | null {
  switch (gender) {
    case CreatorOnboardingPayloadGender.female:
      return t`Mujer`
    case CreatorOnboardingPayloadGender.male:
      return t`Hombre`
    case CreatorOnboardingPayloadGender.non_binary:
      return t`No binario`
    default:
      return null
  }
}

function kindLabel(kind: CreatorOnboardingPayloadCreatorKindsItem): string {
  return kind === CreatorOnboardingPayloadCreatorKindsItem.ugc
    ? t`UGC`
    : t`Influencer`
}

function experienceLabel(
  level: CreatorOnboardingPayloadExperienceLevel | null,
): string | null {
  switch (level) {
    case CreatorOnboardingPayloadExperienceLevel.none:
      return t`Sin campañas previas`
    case CreatorOnboardingPayloadExperienceLevel['1_to_5']:
      return t`1 a 5 campañas`
    case CreatorOnboardingPayloadExperienceLevel['6_to_20']:
      return t`6 a 20 campañas`
    case CreatorOnboardingPayloadExperienceLevel['20_plus_primary']:
      return t`Más de 20 campañas`
    default:
      return null
  }
}

interface CreatorProfileSidesheetProps {
  /** Perfil ya construido por el caller (`buildMockCreatorDetailProfile`). */
  profile: CreatorDetailProfile | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Acción extra del footer (ej. invitar/ir al chat). A la derecha de "Cerrar". */
  footerAction?: React.ReactNode
}

export function CreatorProfileSidesheet({
  profile,
  open,
  onOpenChange,
  footerAction,
}: CreatorProfileSidesheetProps) {
  const creatorName = profile?.displayName

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full gap-0 overflow-hidden border-border bg-card p-0 sm:max-w-[560px] sm:rounded-l-2xl"
      >
        <SheetTitle className="sr-only">
          {creatorName ? t`Perfil de ${creatorName}` : t`Perfil del creador`}
        </SheetTitle>
        <SheetDescription className="sr-only">
          {t`Información del creador disponible en Marz.`}
        </SheetDescription>

        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="text-[length:var(--font-size-lg)] font-semibold tracking-tight text-card-foreground">
            {t`Perfil del creador`}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t`Cerrar`}
            onClick={() => onOpenChange(false)}
            className="rounded-full"
          >
            <X className="size-4" />
          </Button>
        </header>

        {profile ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <ProfileBody profile={profile} />
            <footer className="flex justify-end gap-2 border-t border-border p-5">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => onOpenChange(false)}
              >
                {t`Cerrar`}
              </Button>
              {footerAction}
            </footer>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

/**
 * Footer de invitación para Explorar: muestra "Invitar" / "Invitación enviada"
 * / "Ir al chat" según el estado del par marca-creador.
 */
export function CreatorProfileInviteFooter({
  card,
  onInvite,
}: {
  card: DiscoveryCreatorCard
  onInvite: () => void
}) {
  const navigate = useNavigate()
  const { kind, conversation_id } = card.pair_state

  if (
    conversation_id &&
    (kind === DiscoveryCreatePairKindEnum.open_conversation ||
      kind === DiscoveryCreatePairKindEnum.active_collaboration)
  ) {
    return (
      <Button
        type="button"
        className="rounded-xl"
        onClick={() => {
          void navigate({
            to: '/workspace/conversations/$conversationId',
            params: { conversationId: conversation_id },
          })
        }}
      >
        <MessageCircle className="size-4" aria-hidden />
        {t`Ir al chat`}
      </Button>
    )
  }

  if (kind === DiscoveryCreatePairKindEnum.connection_pending) {
    return (
      <Button type="button" className="rounded-xl" disabled>
        {t`Invitación enviada`}
      </Button>
    )
  }

  return (
    <Button type="button" className="rounded-xl" onClick={onInvite}>
      <Send className="size-4" aria-hidden />
      {t`Invitar`}
    </Button>
  )
}

function ProfileBody({ profile }: { profile: CreatorDetailProfile }) {
  const age = profile.age
  const identityFacts = [
    age === null ? null : t`${age} años`,
    genderLabel(profile.gender),
    profile.city,
  ].filter((value): value is string => Boolean(value))

  const ugcRate =
    profile.ugcRateAmount && profile.ugcRateAmount.trim()
      ? `${currencySymbol(profile.ugcRateCurrency)}${profile.ugcRateAmount} ${profile.ugcRateCurrency}`
      : DASH

  const avatarFallback = profile.displayName.charAt(0).toUpperCase()

  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
      {/* Hero */}
      <section className="flex items-start gap-4">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt={profile.displayName}
            className="size-20 shrink-0 rounded-2xl object-cover ring-1 ring-border"
            loading="lazy"
          />
        ) : (
          <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-primary text-[length:var(--font-size-2xl)] font-semibold text-primary-foreground ring-1 ring-border">
            {avatarFallback}
          </div>
        )}
        <div className="min-w-0 space-y-1.5">
          <h3 className="text-[length:var(--font-size-xl)] font-semibold leading-tight tracking-tight text-card-foreground">
            {profile.displayName}{' '}
            <Flag country={profile.country} className="rounded-[2px]" />
          </h3>
          <p className="text-[length:var(--font-size-sm)] text-muted-foreground">
            {identityFacts.length > 0 ? identityFacts.join(' · ') : DASH}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {profile.creatorKinds.map((creatorKind) => (
              <span
                key={creatorKind}
                className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[length:var(--font-size-xs)] font-medium text-primary-foreground"
              >
                {kindLabel(creatorKind)}
              </span>
            ))}
            <CollaborationBadge accepts={profile.acceptsCollaborations} />
          </div>
        </div>
      </section>

      {/* Métricas y precios */}
      <SheetSection title={t`Métricas y precios`}>
        {profile.platforms.length > 0 ? (
          <MetricsTable platforms={profile.platforms} />
        ) : (
          <EmptyValue />
        )}
      </SheetSection>

      {/* Redes */}
      <SheetSection title={t`Redes`}>
        <SocialLinks platforms={profile.platforms} />
      </SheetSection>

      {/* Datos del creador */}
      <SheetSection title={t`Sobre el creador`}>
        <dl className="divide-y divide-border">
          <InfoRow label={t`Intereses`}>
            <ChipList items={profile.interests} />
          </InfoRow>
          <InfoRow label={t`Tipo de contenido`}>
            <ChipList items={profile.contentTypes} />
          </InfoRow>
          <InfoRow label={t`Idiomas`}>
            {textOrDash(profile.languages.join(', '))}
          </InfoRow>
          <InfoRow label={t`País`}>
            {profile.country ? (
              <span className="inline-flex items-center gap-1.5">
                <Flag country={profile.country} className="rounded-[2px]" />
                {profile.country}
              </span>
            ) : (
              DASH
            )}
          </InfoRow>
          <InfoRow label={t`Ciudad`}>{textOrDash(profile.city)}</InfoRow>
          <InfoRow label={t`Tipo de creador`}>
            {textOrDash(
              profile.creatorKinds.map(kindLabel).join(' · ') || null,
            )}
          </InfoRow>
          <InfoRow label={t`Tarifa UGC`}>
            <span className="font-mono tabular-nums">{ugcRate}</span>
          </InfoRow>
          <InfoRow label={t`Experiencia en campañas`}>
            {textOrDash(experienceLabel(profile.experienceLevel))}
          </InfoRow>
          <InfoRow label={t`Acepta colaboraciones`}>
            {profile.acceptsCollaborations === null
              ? DASH
              : profile.acceptsCollaborations
                ? t`Sí`
                : t`No`}
          </InfoRow>
        </dl>
      </SheetSection>

      {/* Top videos */}
      <SheetSection title={t`Top videos del portfolio`}>
        {profile.bestVideoUrls.length > 0 ? (
          <ul className="space-y-2">
            {profile.bestVideoUrls.map((url, index) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-[length:var(--font-size-sm)] text-foreground transition-colors hover:bg-muted"
                >
                  <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-lg bg-muted text-[length:var(--font-size-xs)] font-semibold text-muted-foreground">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-mono text-[length:var(--font-size-xs)] text-muted-foreground">
                    {url}
                  </span>
                  <ExternalLink
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyValue />
        )}
      </SheetSection>
    </div>
  )
}

function CollaborationBadge({ accepts }: { accepts: boolean | null }) {
  if (accepts === null) return null
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[length:var(--font-size-xs)] font-medium',
        accepts
          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
          : 'bg-muted text-muted-foreground',
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          accepts ? 'bg-emerald-500' : 'bg-muted-foreground',
        )}
        aria-hidden
      />
      {accepts ? t`Acepta colaboraciones` : t`No colabora`}
    </span>
  )
}

function SheetSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3 rounded-2xl border border-border bg-muted p-4">
      <h4 className="text-[length:var(--font-size-sm)] font-semibold text-card-foreground">
        {title}
      </h4>
      {children}
    </section>
  )
}

function MetricsTable({
  platforms,
}: {
  platforms: DiscoveryCreatorPlatformStats[]
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border text-[length:var(--font-size-xs)] font-medium text-muted-foreground">
            <th scope="col" className="py-2 pl-3 pr-2 text-left font-medium">
              {t`Red`}
            </th>
            <th scope="col" className="px-2 py-2 text-right font-medium">
              <Users className="ml-auto size-3.5" aria-label={t`Alcance`} />
            </th>
            <th scope="col" className="px-2 py-2 text-right font-medium">
              <Heart className="ml-auto size-3.5" aria-label={t`Engagement`} />
            </th>
            <th scope="col" className="px-2 py-2 text-right font-medium">
              {t`CPM`}
            </th>
            <th scope="col" className="py-2 pl-2 pr-3 text-right font-medium">
              <Tag
                className="ml-auto size-3.5 text-primary"
                aria-label={t`Precio`}
              />
            </th>
          </tr>
        </thead>
        <tbody className="font-mono text-[length:var(--font-size-sm)] tabular-nums">
          {platforms.map((stats) => {
            const PlatformIcon = PLATFORM_ICONS[stats.platform.toLowerCase()]
            const priceAmount = stats.min_price_amount.trim()
            return (
              <tr
                key={`${stats.platform}-${stats.handle}`}
                className="border-b border-border last:border-b-0"
              >
                <td className="py-2 pl-3 pr-2 text-left">
                  <span className="flex items-center gap-1.5 font-sans font-medium text-card-foreground">
                    {PlatformIcon ? (
                      <PlatformIcon className="size-3.5 shrink-0" aria-hidden />
                    ) : null}
                    {platformCode(stats.platform)}
                  </span>
                </td>
                <td className="px-2 py-2 text-right text-card-foreground">
                  {Intl_NumberFormat_compact.format(stats.followers)}
                </td>
                <td className="px-2 py-2 text-right text-card-foreground">
                  {Intl_NumberFormat_pct.format(stats.engagement_rate)}
                </td>
                <td className="px-2 py-2 text-right text-muted-foreground">
                  {currencySymbol(stats.cpm_currency)}
                  {stats.cpm_amount}
                </td>
                <td className="py-2 pl-2 pr-3 text-right font-medium text-primary">
                  {priceAmount ? (
                    <>
                      {currencySymbol(stats.price_currency)}
                      {priceAmount}
                    </>
                  ) : (
                    DASH
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function SocialLinks({
  platforms,
}: {
  platforms: DiscoveryCreatorPlatformStats[]
}) {
  const links = platforms
    .map((stats) => ({
      platform: stats.platform,
      handle: stats.handle,
      url: platformProfileUrl(stats.platform, stats.handle),
    }))
    .filter((link) => link.url)

  if (links.length === 0) return <EmptyValue />

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => {
        const PlatformIcon = PLATFORM_ICONS[link.platform.toLowerCase()]
        return (
          <a
            key={`${link.platform}-${link.handle}`}
            href={link.url ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-[length:var(--font-size-sm)] font-medium text-foreground transition-colors hover:bg-muted"
          >
            {PlatformIcon ? (
              <PlatformIcon className="size-4" aria-hidden />
            ) : null}
            @{link.handle.replace(/^@/, '')}
            <ExternalLink
              className="size-3.5 text-muted-foreground"
              aria-hidden
            />
          </a>
        )
      })}
    </div>
  )
}

function InfoRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] items-start gap-3 py-2.5 first:pt-0 last:pb-0">
      <dt className="text-[length:var(--font-size-sm)] text-muted-foreground">
        {label}
      </dt>
      <dd className="text-[length:var(--font-size-sm)] text-card-foreground">
        {children}
      </dd>
    </div>
  )
}

function ChipList({ items }: { items: string[] }) {
  if (items.length === 0) return <EmptyValue />
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="inline-flex items-center rounded-full bg-background px-2 py-0.5 text-[length:var(--font-size-xs)] font-medium text-card-foreground ring-1 ring-border"
        >
          {prettifyTag(item)}
        </span>
      ))}
    </div>
  )
}

function EmptyValue() {
  return <span className="text-muted-foreground">{DASH}</span>
}

function textOrDash(value: string | null | undefined): React.ReactNode {
  return value && value.trim() ? value : <EmptyValue />
}
