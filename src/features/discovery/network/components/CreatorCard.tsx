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
  const flag = countryFlag(card.country)
  const visibleTags = card.tags.slice(0, 3)
  const hiddenTagCount = card.tags.length - visibleTags.length
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
        disabled={!canInvite}
        aria-pressed={selected}
        aria-label={t`Seleccionar ${name}`}
        onClick={() => {
          if (canInvite) {
            onToggleSelect?.(card.account_id)
          }
        }}
        className={cn(
          'relative block aspect-[316/286] w-full overflow-hidden rounded-[28px] text-left',
          'disabled:cursor-not-allowed disabled:opacity-60',
          selected ? 'ring-2 ring-primary' : 'ring-1 ring-border',
        )}
      >
        <CardMedia card={card} />
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
        <CardOverlayContent
          name={name}
          flag={flag}
          age={age}
          visibleTags={visibleTags}
          hiddenTagCount={hiddenTagCount}
          platforms={card.platforms}
        />
      </button>
    )
  }

  return (
    <div className="relative aspect-[316/286] w-full overflow-hidden rounded-[28px] ring-1 ring-border">
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
        flag={flag}
        age={age}
        visibleTags={visibleTags}
        hiddenTagCount={hiddenTagCount}
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
  flag,
  age,
  visibleTags,
  hiddenTagCount,
  platforms,
}: {
  name: string
  flag: string
  age: number
  visibleTags: string[]
  hiddenTagCount: number
  platforms: DiscoveryCreatorPlatformStats[]
}) {
  return (
    <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-4">
      <p className="text-[15px] font-extrabold leading-tight text-white">
        {name} {flag} <span aria-hidden>·</span> {age}
      </p>

      {visibleTags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex h-[18px] items-center rounded-full bg-white/15 px-1.5 text-[11px] font-[650] leading-none text-white"
            >
              {tag}
            </span>
          ))}
          {hiddenTagCount > 0 ? (
            <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[11px] font-[650] leading-none text-white">
              {t`+${hiddenTagCount}`}
            </span>
          ) : null}
        </div>
      ) : null}

      {platforms.length > 0 ? (
        <PlatformStatsTable platforms={platforms} />
      ) : null}
    </div>
  )
}

function PlatformStatsTable({
  platforms,
}: {
  platforms: DiscoveryCreatorPlatformStats[]
}) {
  return (
    <div className="flex flex-col gap-0.5 font-mono text-[11px] tabular-nums">
      <div className="grid grid-cols-5 items-center px-2.5 font-bold text-white/60">
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
        return (
          <div
            key={`${stats.platform}-${stats.handle}`}
            className="grid grid-cols-5 items-center rounded-sm bg-[#101010]/45 px-2.5 py-0.5"
          >
            <span className="flex items-center gap-1 font-[850] text-white">
              {PlatformIcon ? (
                <PlatformIcon className="size-2.5 shrink-0" aria-hidden />
              ) : null}
              {platformCode(stats.platform)}
            </span>
            <span className="text-center font-[750] text-white">
              {Intl_NumberFormat_compact.format(stats.followers)}
            </span>
            <span className="text-center font-[750] text-white">
              {Intl_NumberFormat_pct.format(stats.engagement_rate)}
            </span>
            <span className="text-center font-[750] text-white/80">
              {currencySymbol(stats.cpm_currency)}
              {stats.cpm_amount}
            </span>
            <span className="text-right font-[750] text-[#3ECF8E]">
              {currencySymbol(stats.price_currency)}
              {stats.min_price_amount}
            </span>
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

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  ARS: '$',
  EUR: '€',
}

function currencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency.toUpperCase()] ?? `${currency} `
}

function countryFlag(country: string): string {
  const code = country.trim().toUpperCase()
  if (code.length !== 2 || !/^[A-Z]{2}$/.test(code)) {
    return ''
  }
  const base = 0x1f1e6
  // eslint-disable-next-line lingui/no-unlocalized-strings -- ISO letter offset, not UI copy
  const offset = 'A'.charCodeAt(0)
  return String.fromCodePoint(
    base + (code.charCodeAt(0) - offset),
    base + (code.charCodeAt(1) - offset),
  )
}
