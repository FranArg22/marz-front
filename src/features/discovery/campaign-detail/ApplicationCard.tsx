import { t } from '@lingui/core/macro'
import { useNavigate } from '@tanstack/react-router'
import { Check, Loader2, X } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { useCreatorProfileSheet } from '#/features/discovery/network/components/CreatorProfileSheetProvider'
import type { CampaignApplicationListItem } from '#/shared/api/generated/model'

import { useAcceptApplication, useRejectApplication } from './mutations'
import { formatDate, initials } from './utils'

interface ApplicationCardProps {
  campaignId: string
  application: CampaignApplicationListItem
}

export function ApplicationCard({
  campaignId,
  application,
}: ApplicationCardProps) {
  const navigate = useNavigate()
  const acceptApplication = useAcceptApplication(campaignId, {
    onConversationReady: (conversationId) => {
      void navigate({
        to: '/workspace/conversations/$conversationId',
        params: { conversationId },
      })
    },
  })
  const rejectApplication = useRejectApplication(campaignId)
  const openCreatorProfile = useCreatorProfileSheet()
  const creator = application.creator
  const creatorName = creator.display_name
  const isAccepting = acceptApplication.isPending
  const isRejecting = rejectApplication.isPending

  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
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
          className="-m-1.5 flex min-w-0 items-start gap-3 rounded-xl p-1.5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar className="size-11">
            {creator.avatar_url ? (
              <AvatarImage src={creator.avatar_url} alt="" />
            ) : null}
            <AvatarFallback>{initials(creator.display_name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-foreground">
              {creator.display_name}
            </h3>
            <p className="truncate text-xs text-muted-foreground">
              @{creator.handle}
            </p>
          </div>
        </button>
        <Badge variant="outline">{formatStatus(application.status)}</Badge>
      </div>
      <p className="mt-4 line-clamp-3 text-sm text-foreground">
        {application.message}
      </p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span>{formatDate(application.created_at)}</span>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() =>
            rejectApplication.mutate({
              applicationId: application.application_id,
            })
          }
          disabled={!application.can_reject || isAccepting || isRejecting}
        >
          {isRejecting ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <X className="size-3.5" aria-hidden />
          )}
          {t`Reject`}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() =>
            acceptApplication.mutate({
              applicationId: application.application_id,
            })
          }
          disabled={!application.can_accept || isAccepting || isRejecting}
        >
          {isAccepting ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <Check className="size-3.5" aria-hidden />
          )}
          {t`Accept`}
        </Button>
      </div>
    </article>
  )
}

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    pending: t`Pendiente`,
    accepted: t`Aceptada`,
    rejected: t`Rechazada`,
  }

  return labels[status] ?? status
}
