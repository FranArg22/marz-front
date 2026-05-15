import { t } from '@lingui/core/macro'
import { Ban } from 'lucide-react'

import type { MessageItem } from '#/features/chat/types'
import { SystemEventCard } from '#/shared/ui/SystemEventCard'

import type { OfferCancelledPhase } from './offerEventCardUtils'
import {
  extractOfferSnapshotV3,
  formatSnapshotDate,
} from './offerEventCardUtils'

interface OfferCancelledCardProps {
  message: MessageItem
  phase?: OfferCancelledPhase
}

export function OfferCancelledCard({
  message,
  phase,
}: OfferCancelledCardProps) {
  const snapshot = extractOfferSnapshotV3(message.payload)
  if (!snapshot) return null

  const resolvedPhase = phase ?? snapshot.phase ?? 'pre_accept'
  const copy =
    resolvedPhase === 'post_accept'
      ? t`La marca canceló la oferta aceptada.`
      : t`La marca canceló la oferta antes de la aceptación.`

  return (
    <article role="article" aria-label={t`Oferta cancelada`}>
      <SystemEventCard
        tone="destructive"
        kicker={t`Oferta cancelada`}
        icon={Ban}
      >
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{copy}</p>
          {snapshot.cancelledAt ? (
            <p className="text-xs text-muted-foreground">
              <time dateTime={snapshot.cancelledAt}>
                {formatSnapshotDate(snapshot.cancelledAt)}
              </time>
            </p>
          ) : null}
        </div>
      </SystemEventCard>
    </article>
  )
}
