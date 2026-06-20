import { t } from '@lingui/core/macro'
import { useNavigate } from '@tanstack/react-router'
import {
  AlertTriangle,
  Check,
  Heart,
  Instagram,
  MessageCircle,
  Music2,
  Send,
  Tag,
  Users,
  Youtube,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { cn } from '#/lib/utils'
import { Flag } from '#/shared/ui/Flag'
import type {
  DiscoveryCreatorCard,
  DiscoveryCreatorPlatformStats,
} from '#/shared/api/generated/model'
import { DiscoveryCreatePairKindEnum } from '#/shared/api/generated/model'

const Intl_NumberFormat_compact = new Intl.NumberFormat('es-AR', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const Intl_NumberFormat_pct = new Intl.NumberFormat('es-AR', {
  style: 'percent',
  maximumFractionDigits: 1,
})

const NIL_UUID = '00000000-0000-0000-0000-000000000000'

/* eslint-disable lingui/no-unlocalized-strings -- platform short codes, not translatable */
const PLATFORM_CODES: Record<string, string> = {
  instagram: 'IG',
  tiktok: 'TT',
  youtube: 'YT',
  x: 'X',
  twitch: 'TW',
}
/* eslint-enable lingui/no-unlocalized-strings */

const PLATFORM_ICONS: Record<string, LucideIcon> = {
  instagram: Instagram,
  tiktok: Music2,
  youtube: Youtube,
}

const PLATFORM_PROFILE_URLS: Record<string, (handle: string) => string> = {
  instagram: (handle) => `https://instagram.com/${handle}`,
  tiktok: (handle) => `https://www.tiktok.com/@${handle}`,
  youtube: (handle) => `https://youtube.com/@${handle}`,
}

function platformProfileUrl(platform: string, handle: string): string | null {
  const build = PLATFORM_PROFILE_URLS[platform.toLowerCase()]
  if (!build) {
    return null
  }
  const normalized = handle.replace(/^@/, '').trim()
  return normalized ? build(normalized) : null
}

interface CreatorCardProps {
  card: DiscoveryCreatorCard
  onInvite: (card: DiscoveryCreatorCard) => void
  selected?: boolean
  selectionMode?: boolean
  onToggleSelect?: (accountId: string) => void
}

export function CreatorCard({
  card,
  onInvite,
  selected = false,
  selectionMode = false,
  onToggleSelect,
}: CreatorCardProps) {
  const navigate = useNavigate()
  const { kind, conversation_id } = card.pair_state
  const name = card.display_name
  const age = card.age
  const visibleTags = card.tags.slice(0, card.tags.length > 3 ? 2 : 3)
  const hiddenTags = card.tags.slice(visibleTags.length)
  const canInvite =
    kind === DiscoveryCreatePairKindEnum.no_contact ||
    kind === DiscoveryCreatePairKindEnum.connection_rejected ||
    kind === DiscoveryCreatePairKindEnum.connection_expired
  const hasChatCta =
    kind === DiscoveryCreatePairKindEnum.open_conversation ||
    kind === DiscoveryCreatePairKindEnum.active_collaboration
  const inviteLabel = getInviteLabel(kind)
  const showReinviteWarning =
    kind === DiscoveryCreatePairKindEnum.connection_rejected ||
    kind === DiscoveryCreatePairKindEnum.connection_expired
  const hasClaimedAccount = card.account_id !== NIL_UUID

  function handleGoToChat() {
    if (conversation_id) {
      void navigate({
        to: '/workspace/conversations/$conversationId',
        params: { conversationId: conversation_id },
      })
    }
  }

  if (selectionMode) {
    return (
      <button
        type="button"
        disabled={!canInvite || !hasClaimedAccount}
        aria-pressed={selected}
        aria-label={t`Seleccionar ${name}`}
        onClick={() => {
          if (canInvite && hasClaimedAccount) {
            onToggleSelect?.(card.account_id)
          }
        }}
        className={cn(
          'relative block aspect-[316/286] w-full overflow-hidden rounded-2xl text-left shadow-[0_18px_36px_-12px_rgba(0,0,0,0.22)]',
          'disabled:cursor-not-allowed',
          selected ? 'ring-2 ring-primary' : 'ring-1 ring-border',
        )}
      >
        <CardMedia card={card} />
        {canInvite ? (
          <span
            className={cn(
              'absolute top-3 right-3 flex size-6 items-center justify-center rounded-full border',
              selected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-white/70 bg-black/30 text-transparent',
            )}
            aria-hidden
          >
            <Check className="size-4" />
          </span>
        ) : (
          <PairStateBadge kind={kind} />
        )}
        <CardOverlayContent
          name={name}
          country={card.country}
          age={age}
          visibleTags={visibleTags}
          hiddenTags={hiddenTags}
          platforms={card.platforms}
          platformsLinkable={false}
        />
      </button>
    )
  }

  return (
    <div className="relative aspect-[316/286] w-full overflow-hidden rounded-2xl ring-1 ring-border shadow-[0_18px_36px_-12px_rgba(0,0,0,0.22)]">
      <CardMedia card={card} />

      {canInvite ? (
        <InvitePill
          label={inviteLabel}
          showWarning={showReinviteWarning}
          onClick={() => onInvite(card)}
        />
      ) : (
        <PairStateBadge kind={kind} />
      )}

      {hasChatCta && conversation_id ? (
        <button
          type="button"
          onClick={handleGoToChat}
          aria-label={t`Ir al chat`}
          className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/60"
        >
          <MessageCircle className="size-3.5" aria-hidden />
          {t`Chat`}
        </button>
      ) : null}

      <CardOverlayContent
        name={name}
        country={card.country}
        age={age}
        visibleTags={visibleTags}
        hiddenTags={hiddenTags}
        platforms={card.platforms}
      />
    </div>
  )
}

function CardMedia({ card }: { card: DiscoveryCreatorCard }) {
  return (
    <>
      <img
        src={card.avatar_url}
        alt={card.display_name}
        className="absolute inset-0 size-full object-cover"
        loading="lazy"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent"
        aria-hidden
      />
    </>
  )
}

function CardOverlayContent({
  name,
  country,
  age,
  visibleTags,
  hiddenTags,
  platforms,
  platformsLinkable = true,
}: {
  name: string
  country: string
  age: number
  visibleTags: string[]
  hiddenTags: string[]
  platforms: DiscoveryCreatorPlatformStats[]
  platformsLinkable?: boolean
}) {
  return (
    <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-4">
      <p className="text-[15px] font-semibold leading-tight text-white">
        {name} <Flag country={country} className="rounded-[2px]" />{' '}
        <span aria-hidden>·</span> {age}
      </p>

      {visibleTags.length > 0 ? (
        <div className="flex items-center gap-1.5">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex h-[18px] shrink-0 items-center whitespace-nowrap rounded-full bg-white/15 px-1.5 text-[11px] font-medium leading-none text-white"
            >
              {prettifyTag(tag)}
            </span>
          ))}
          {hiddenTags.length > 0 ? (
            <span
              title={hiddenTags.map(prettifyTag).join(', ')}
              className="shrink-0 cursor-default rounded-full bg-white/15 px-1.5 py-0.5 text-[11px] font-medium leading-none text-white"
            >
              {t`+${hiddenTags.length}`}
            </span>
          ) : null}
        </div>
      ) : null}

      {platforms.length > 0 ? (
        <PlatformStatsTable
          platforms={platforms}
          linkable={platformsLinkable}
        />
      ) : null}
    </div>
  )
}

function PlatformStatsTable({
  platforms,
  linkable,
}: {
  platforms: DiscoveryCreatorPlatformStats[]
  linkable: boolean
}) {
  return (
    <div className="flex flex-col gap-0.5 font-mono text-[11px] tabular-nums">
      <div className="grid grid-cols-5 items-center px-2.5 font-medium text-white/60">
        <span>{t`Red`}</span>
        <Users className="mx-auto size-2.5" aria-label={t`Alcance`} />
        <Heart className="mx-auto size-2.5" aria-label={t`Engagement`} />
        <span className="text-center">{t`CPM`}</span>
        <Tag
          className="ml-auto size-2.5 text-[#3ECF8E]"
          aria-label={t`Precio`}
        />
      </div>
      {platforms.map((stats) => {
        const PlatformIcon = PLATFORM_ICONS[stats.platform.toLowerCase()]
        const profileUrl = linkable
          ? platformProfileUrl(stats.platform, stats.handle)
          : null
        const priceAmount = stats.min_price_amount.trim()
        const rowClassName =
          'grid grid-cols-5 items-center rounded-sm bg-[#101010]/45 px-2.5 py-0.5'
        const cells = (
          <>
            <span className="flex items-center gap-1 font-medium text-white">
              {PlatformIcon ? (
                <PlatformIcon className="size-2.5 shrink-0" aria-hidden />
              ) : null}
              {platformCode(stats.platform)}
            </span>
            <span className="text-center font-medium text-white">
              {Intl_NumberFormat_compact.format(stats.followers)}
            </span>
            <span className="text-center font-medium text-white">
              {Intl_NumberFormat_pct.format(stats.engagement_rate)}
            </span>
            <span className="text-center font-medium text-white/80">
              {currencySymbol(stats.cpm_currency)}
              {stats.cpm_amount}
            </span>
            <span className="text-right font-medium text-[#3ECF8E]">
              {priceAmount ? (
                <>
                  {currencySymbol(stats.price_currency)}
                  {priceAmount}
                </>
              ) : (
                '-'
              )}
            </span>
          </>
        )
        const key = `${stats.platform}-${stats.handle}`
        if (profileUrl) {
          return (
            <a
              key={key}
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t`Ver perfil en ${platformCode(stats.platform)}`}
              className={cn(
                rowClassName,
                'transition-colors hover:bg-[#101010]/75',
              )}
            >
              {cells}
            </a>
          )
        }
        return (
          <div key={key} className={rowClassName}>
            {cells}
          </div>
        )
      })}
    </div>
  )
}

function InvitePill({
  label,
  showWarning,
  onClick,
}: {
  label: string
  showWarning: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-[750] text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
    >
      {showWarning ? (
        <AlertTriangle className="size-3.5" aria-hidden />
      ) : (
        <Send className="size-3.5" aria-hidden />
      )}
      {label}
    </button>
  )
}

function PairStateBadge({ kind }: { kind: DiscoveryCreatePairKindEnum }) {
  const state = getPairStateUi(kind)
  if (!state) {
    return null
  }

  return (
    <span className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
      <span
        className={cn('size-2 rounded-full', state.dotClassName)}
        aria-hidden
      />
      {state.label}
    </span>
  )
}

function getPairStateUi(kind: DiscoveryCreatePairKindEnum) {
  switch (kind) {
    case DiscoveryCreatePairKindEnum.connection_pending:
      return {
        label: t`Invitación enviada`,
        dotClassName: 'bg-primary',
      }
    case DiscoveryCreatePairKindEnum.connection_rejected:
      return {
        label: t`Invitación rechazada`,
        dotClassName: 'bg-destructive',
      }
    case DiscoveryCreatePairKindEnum.connection_expired:
      return {
        label: t`Invitación vencida`,
        dotClassName: 'bg-amber-500',
      }
    case DiscoveryCreatePairKindEnum.open_conversation:
      return {
        label: t`Conversación abierta`,
        dotClassName: 'bg-emerald-500',
      }
    case DiscoveryCreatePairKindEnum.active_collaboration:
      return {
        label: t`Colaborando`,
        dotClassName: 'bg-emerald-500',
      }
    case DiscoveryCreatePairKindEnum.no_contact:
      return null
  }
}

function getInviteLabel(kind: DiscoveryCreatePairKindEnum): string {
  switch (kind) {
    case DiscoveryCreatePairKindEnum.no_contact:
      return t`Invitar`
    case DiscoveryCreatePairKindEnum.connection_pending:
      return t`Invitación enviada`
    case DiscoveryCreatePairKindEnum.connection_rejected:
    case DiscoveryCreatePairKindEnum.connection_expired:
      return t`Invitar de nuevo`
    case DiscoveryCreatePairKindEnum.open_conversation:
      return t`Conversación abierta`
    case DiscoveryCreatePairKindEnum.active_collaboration:
      return t`Colaborando`
  }
}

function platformCode(platform: string): string {
  return (
    PLATFORM_CODES[platform.toLowerCase()] ?? platform.slice(0, 2).toUpperCase()
  )
}

function prettifyTag(tag: string): string {
  const text = tag.replace(/_/g, ' ').trim()
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  ARS: '$',
  EUR: '€',
}

function currencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency.toUpperCase()] ?? `${currency} `
}
