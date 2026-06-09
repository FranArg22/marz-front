import { t } from '@lingui/core/macro'
import { useNavigate } from '@tanstack/react-router'
import { AlertTriangle, MapPin } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip'
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

  return (
    <div
      className={cn(
        'relative space-y-3 rounded-2xl border bg-card p-4',
        selected ? 'border-primary ring-2 ring-primary' : 'border-border',
      )}
    >
      {selectionMode ? (
        <input
          type="checkbox"
          className="absolute top-3 right-3 size-4"
          checked={selected}
          disabled={!canInvite}
          onChange={() => {
            if (canInvite) {
              onToggleSelect?.(card.account_id)
            }
          }}
          aria-label={t`Seleccionar ${name}`}
        />
      ) : null}

      <div className="flex items-center gap-3">
        <Avatar className="size-10 shrink-0">
          <AvatarImage src={card.avatar_url} alt={card.display_name} />
          <AvatarFallback>
            {card.display_name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {card.display_name}
          </p>
          <Badge variant="outline" className="mt-1 max-w-full gap-1 text-xs">
            <MapPin className="size-3 shrink-0" aria-hidden />
            <span>{card.country}</span>
            <span aria-hidden>·</span>
            <span>{t`${age} años`}</span>
          </Badge>
        </div>
      </div>

      {visibleTags.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {visibleTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {hiddenTagCount > 0 ? (
            <Badge variant="outline" className="text-xs">
              {t`+${hiddenTagCount} más`}
            </Badge>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-3">
        {card.platforms.map((platform) => (
          <PlatformStats
            key={`${platform.platform}-${platform.handle}`}
            stats={platform}
          />
        ))}
      </div>

      <PairStateIndicator kind={kind} />

      <div className="flex gap-2">
        <InviteButton
          canInvite={canInvite}
          disabled={!canInvite || selectionMode}
          label={inviteLabel}
          showWarning={showReinviteWarning}
          onClick={() => onInvite(card)}
        />
        {hasChatCta && conversation_id ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleGoToChat}
          >
            {t`Ir al chat`}
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function InviteButton({
  canInvite,
  disabled,
  label,
  showWarning,
  onClick,
}: {
  canInvite: boolean
  disabled: boolean
  label: string
  showWarning: boolean
  onClick: () => void
}) {
  const button = (
    <Button
      type="button"
      size="sm"
      className="flex-1"
      disabled={disabled}
      onClick={() => {
        if (canInvite) {
          onClick()
        }
      }}
      variant={canInvite ? 'default' : 'secondary'}
    >
      {showWarning ? <AlertTriangle className="size-3.5" aria-hidden /> : null}
      {label}
    </Button>
  )

  if (!showWarning) {
    return button
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>{t`Ya hubo una invitación antes`}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function PlatformStats({ stats }: { stats: DiscoveryCreatorPlatformStats }) {
  return (
    <div className="space-y-1 rounded-lg border border-border p-2">
      <p className="truncate text-xs font-medium text-muted-foreground">
        <span className="capitalize">{stats.platform}</span> · @{stats.handle}
      </p>
      <div className="grid grid-cols-4 gap-1 text-xs">
        <StatCell
          label={t`Alcance`}
          value={Intl_NumberFormat_compact.format(stats.followers)}
        />
        <StatCell
          label={t`ER`}
          value={Intl_NumberFormat_pct.format(stats.engagement_rate)}
        />
        <StatCell
          label={t`CPM`}
          value={`${stats.cpm_currency} ${stats.cpm_amount}`}
        />
        <StatCell
          label={t`Precio mínimo`}
          value={`${stats.price_currency} ${stats.min_price_amount}`}
        />
      </div>
    </div>
  )
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-muted-foreground">{label}</p>
      <p className="truncate font-medium text-foreground">{value}</p>
    </div>
  )
}

function PairStateIndicator({ kind }: { kind: DiscoveryCreatePairKindEnum }) {
  if (kind === DiscoveryCreatePairKindEnum.no_contact) {
    return null
  }

  const state = getPairStateUi(kind)
  if (!state) {
    return null
  }

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span
        className={cn('size-2 rounded-full', state.dotClassName)}
        aria-hidden
      />
      <span>{state.label}</span>
    </div>
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
