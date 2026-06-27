import { t } from '@lingui/core/macro'
import { useNavigate } from '@tanstack/react-router'
import {
  AlertCircle,
  ChevronRight,
  Compass,
  Ellipsis,
  Instagram,
  MessageSquare,
  Music,
  Search,
  UserPlus,
  Youtube,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { useCreatorProfileSheet } from '#/features/discovery/network/components/CreatorProfileSheetProvider'
import { cn } from '#/lib/utils'
import type {
  CampaignParticipantListItem,
  ListCreatorsStatus,
  SocialPlatform,
} from '#/shared/api/generated/model'
import { ApiError } from '#/shared/api/mutator'
import { formatRelativeTime, initials } from '#/shared/utils/format'

import { useCampaignParticipantsQuery } from './creators/useCampaignParticipantsQuery'
import type { CampaignParticipantsParams } from './creators/useCampaignParticipantsQuery'

export type CampaignCreatorsTableScope =
  | { type: 'campaign'; campaignId: string }
  | { type: 'global' }

interface CampaignCreatorsTableProps {
  scope: CampaignCreatorsTableScope
  params: CampaignParticipantsParams
  onParamsChange: (params: CampaignParticipantsParams) => void
  hasActiveFilters: boolean
  onClearFilters: () => void
  onFindCreators: () => void
}

function getStatusLabel(status: ListCreatorsStatus) {
  const labels: Record<ListCreatorsStatus, () => string> = {
    invited: () => t`Invitado`,
    active: () => t`Activo`,
    in_review: () => t`En revisión`,
    approved: () => t`Aprobado`,
    paid: () => t`Pagado`,
  }
  return labels[status]()
}

/* eslint-disable lingui/no-unlocalized-strings -- Static class names and platform brand names are not translatable UI copy. */
const statusClassNames: Record<ListCreatorsStatus, string> = {
  invited: 'border-border bg-background text-muted-foreground',
  active: 'bg-primary text-primary-foreground',
  in_review: 'bg-success text-success-foreground',
  approved: 'bg-secondary text-secondary-foreground',
  paid: 'bg-accent text-accent-foreground',
}

const platformMeta: Record<
  SocialPlatform,
  { label: string; icon: LucideIcon }
> = {
  youtube: { label: 'YouTube', icon: Youtube },
  instagram: { label: 'Instagram', icon: Instagram },
  tiktok: { label: 'TikTok', icon: Music },
}
/* eslint-enable lingui/no-unlocalized-strings */

export function CampaignCreatorsTable({
  scope,
  params,
  onParamsChange,
  hasActiveFilters,
  onClearFilters,
  onFindCreators,
}: CampaignCreatorsTableProps) {
  const campaignIdForQuery =
    scope.type === 'campaign' ? scope.campaignId : undefined
  const participantsQuery = useCampaignParticipantsQuery(
    campaignIdForQuery,
    params,
  )
  const participants = participantsQuery.data?.data ?? []
  const totalVisible = participantsQuery.data?.total_visible ?? 0

  if (participantsQuery.isPending) {
    return (
      <TableFrame>
        <TableSkeleton />
      </TableFrame>
    )
  }

  if (participantsQuery.error) {
    return (
      <TableFrame>
        <ErrorState error={participantsQuery.error} />
      </TableFrame>
    )
  }

  if (totalVisible === 0) {
    return (
      <TableFrame>
        <EmptyTableState
          icon={hasActiveFilters ? Search : UserPlus}
          title={
            hasActiveFilters
              ? t`No encontramos creadores con esos filtros`
              : t`Todavía no hay creadores en esta campaña`
          }
          description={
            hasActiveFilters
              ? t`Probá con otra búsqueda, estado o plataforma.`
              : t`Cuando invites creadores desde Discovery o agregues uno manualmente, aparecerán acá con su estado y entregables.`
          }
          action={
            hasActiveFilters ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={onClearFilters}
              >
                {t`Limpiar filtros`}
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={onFindCreators}
              >
                <Compass className="size-4" aria-hidden />
                {t`Buscar creadores`}
              </Button>
            )
          }
        />
      </TableFrame>
    )
  }

  return (
    <TableFrame>
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          <HeaderRow />
          <div className="divide-y divide-border">
            {participants.map((participant) => (
              <CreatorRow
                key={participant.participant_id}
                participant={participant}
                campaignId={campaignIdForQuery}
              />
            ))}
          </div>
        </div>
      </div>
      {participantsQuery.data.next_cursor ? (
        <div className="flex justify-center border-t border-border px-5 py-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() =>
              onParamsChange({
                ...params,
                cursor: participantsQuery.data.next_cursor ?? undefined,
              })
            }
          >
            {t`Cargar más`}
            <ChevronRight className="size-3.5" aria-hidden />
          </Button>
        </div>
      ) : null}
    </TableFrame>
  )
}

function TableFrame({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {children}
    </div>
  )
}

function HeaderRow() {
  return (
    <div className="grid grid-cols-[minmax(260px,1fr)_140px_140px_180px_160px_72px] items-center gap-3 border-b border-border bg-muted px-5 py-3">
      <HeaderCell>{t`Creador`}</HeaderCell>
      <HeaderCell>{t`Plataforma`}</HeaderCell>
      <HeaderCell>{t`Estado`}</HeaderCell>
      <HeaderCell>{t`Entregables`}</HeaderCell>
      <HeaderCell>{t`Última actividad`}</HeaderCell>
      <span className="sr-only">{t`Acciones`}</span>
    </div>
  )
}

function HeaderCell({ children }: { children: ReactNode }) {
  return (
    <div className="font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
      {children}
    </div>
  )
}

function CreatorRow({
  participant,
  campaignId,
}: {
  participant: CampaignParticipantListItem
  campaignId: string | undefined
}) {
  const navigate = useNavigate()
  const primaryPlatform = getPrimaryPlatform(participant)

  return (
    <div className="grid grid-cols-[minmax(260px,1fr)_140px_140px_180px_160px_72px] items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-hover/70">
      <CreatorCell participant={participant} />
      <PlatformCell platform={primaryPlatform} />
      <StatusBadge status={participant.status} />
      <DeliverablesCell deliverables={participant.net_deliverables} />
      <span className="text-xs text-muted-foreground">
        {formatRelativeTime(
          participant.last_activity_at,
          t`Respuesta pendiente`,
        )}
      </span>
      <div className="flex justify-end gap-1">
        {participant.actions.open_workspace ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={t`Abrir conversación`}
            onClick={() => {
              if (participant.conversation_id) {
                void navigate({
                  to: '/workspace/conversations/$conversationId',
                  params: { conversationId: participant.conversation_id },
                  search: { filter: 'all', campaign_id: campaignId },
                })
                return
              }
              void navigate({
                to: '/workspace',
                search: { filter: 'all', campaign_id: campaignId },
              })
            }}
          >
            <MessageSquare className="size-3.5" aria-hidden />
          </Button>
        ) : null}
        {!participant.actions.open_workspace ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={t`Acciones del creador`}
            disabled
          >
            <Ellipsis className="size-3.5" aria-hidden />
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function CreatorCell({
  participant,
}: {
  participant: CampaignParticipantListItem
}) {
  const creator = participant.creator
  const openCreatorProfile = useCreatorProfileSheet()
  const creatorName = creator.display_name

  return (
    <button
      type="button"
      onClick={() =>
        openCreatorProfile({
          creatorId: creator.account_id,
          accountId: creator.account_id,
          displayName: creator.display_name,
          avatarUrl: creator.avatar_url,
          handle: creator.handle,
          interests: creator.niche ? [creator.niche] : undefined,
        })
      }
      aria-label={t`Ver perfil de ${creatorName}`}
      className="-mx-1.5 flex min-w-0 items-center gap-3 rounded-xl px-1.5 py-1 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Avatar className="size-10">
        {creator.avatar_url ? (
          <AvatarImage src={creator.avatar_url} alt={creator.display_name} />
        ) : null}
        <AvatarFallback>{initials(creator.display_name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">
          {creator.display_name}
        </p>
        <p className="truncate font-mono text-[11px] text-muted-foreground">
          @{creator.handle}
        </p>
      </div>
    </button>
  )
}

function PlatformCell({ platform }: { platform: SocialPlatform | undefined }) {
  if (!platform) {
    return <span className="text-xs text-muted-foreground">{t`None`}</span>
  }

  const meta = platformMeta[platform]
  const Icon = meta.icon

  return (
    <div className="flex items-center gap-1.5 text-xs text-foreground">
      <Icon className="size-3.5 text-muted-foreground" aria-hidden />
      <span>{meta.label}</span>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (isParticipantStatus(status)) {
    return (
      <Badge className={cn('rounded-full', statusClassNames[status])}>
        {getStatusLabel(status)}
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="rounded-full">
      {status}
    </Badge>
  )
}

function DeliverablesCell({
  deliverables,
}: {
  deliverables: CampaignParticipantListItem['net_deliverables']
}) {
  const expected = deliverables.expected
  const completed = deliverables.completed
  const percent = expected > 0 ? Math.min(100, (completed / expected) * 100) : 0

  return (
    <div className="space-y-1">
      <p
        className={cn(
          'text-xs',
          completed > 0 ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {t`${completed} de ${expected} entregados`}
      </p>
      <div className="h-1.5 w-[140px] overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

function EmptyTableState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description: string
  action: ReactNode
}) {
  return (
    <div className="flex min-h-[520px] flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex size-24 items-center justify-center rounded-full bg-muted">
        <Icon className="size-12 text-muted-foreground" aria-hidden />
      </div>
      <h2 className="mt-6 text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}

function ErrorState({ error }: { error: Error }) {
  const isNotFound = error instanceof ApiError && error.status === 404

  return (
    <EmptyTableState
      icon={AlertCircle}
      title={
        isNotFound
          ? t`No encontramos los creadores`
          : t`No pudimos cargar los creadores`
      }
      description={
        isNotFound
          ? t`Puede que la campaña no exista o que no pertenezca a este espacio de trabajo.`
          : t`Reintentá en unos minutos.`
      }
      action={null}
    />
  )
}

function TableSkeleton() {
  return (
    <div role="status" aria-label={t`Cargando creadores`}>
      <div className="h-11 border-b border-border bg-muted" />
      {[0, 1, 2, 3].map((item) => (
        <div
          key={item}
          className="grid grid-cols-[minmax(260px,1fr)_140px_140px_180px_160px_72px] items-center gap-3 border-b border-border px-5 py-3 last:border-b-0"
        >
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-muted" />
            <div className="space-y-2">
              <div className="h-3 w-32 rounded-full bg-muted" />
              <div className="h-2.5 w-24 rounded-full bg-muted" />
            </div>
          </div>
          <div className="h-3 w-16 rounded-full bg-muted" />
          <div className="h-5 w-20 rounded-full bg-muted" />
          <div className="space-y-2">
            <div className="h-3 w-24 rounded-full bg-muted" />
            <div className="h-1.5 w-32 rounded-full bg-muted" />
          </div>
          <div className="h-3 w-20 rounded-full bg-muted" />
          <div className="ml-auto size-6 rounded-md bg-muted" />
        </div>
      ))}
    </div>
  )
}

function getPrimaryPlatform(participant: CampaignParticipantListItem) {
  for (const platform of participant.platforms) {
    if (isParticipantPlatform(platform)) return platform
  }

  for (const platform of participant.creator.platforms) {
    if (isParticipantPlatform(platform.platform)) return platform.platform
  }

  return undefined
}

function isParticipantStatus(status: string): status is ListCreatorsStatus {
  return Object.hasOwn(statusClassNames, status)
}

function isParticipantPlatform(platform: string): platform is SocialPlatform {
  return Object.hasOwn(platformMeta, platform)
}
