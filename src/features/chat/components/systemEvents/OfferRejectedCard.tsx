import { t } from '@lingui/core/macro'
import { XCircle } from 'lucide-react'

import type { MessageItem } from '#/features/chat/types'
import { SystemEventCard } from '#/shared/ui/SystemEventCard'

import {
  extractOfferSnapshotV3,
  formatSnapshotDate,
} from './offerEventCardUtils'

interface OfferRejectedCardProps {
  message: MessageItem
}

export function OfferRejectedCard({ message }: OfferRejectedCardProps) {
  const snapshot = extractOfferSnapshotV3(message.payload)
  if (!snapshot) return null

  return (
    <article role="article" aria-label={t`Oferta rechazada`}>
      <SystemEventCard
        tone="destructive"
        kicker={t`Oferta rechazada`}
        icon={XCircle}
      >
        <p className="text-sm font-semibold text-foreground">
          {snapshot.rejectedAt ? (
            <>
              {t`La oferta fue rechazada el `}
              <time dateTime={snapshot.rejectedAt}>
                {formatSnapshotDate(snapshot.rejectedAt)}
              </time>
            </>
          ) : (
            t`La oferta fue rechazada.`
          )}
        </p>
      </SystemEventCard>
    </article>
  )
}
