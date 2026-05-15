import { t } from '@lingui/core/macro'
import { Clock3 } from 'lucide-react'

import type { MessageItem } from '#/features/chat/types'
import { SystemEventCard } from '#/shared/ui/SystemEventCard'

import {
  extractOfferSnapshotV3,
  formatSnapshotDate,
} from './offerEventCardUtils'

interface OfferExpiredCardProps {
  message: MessageItem
}

export function OfferExpiredCard({ message }: OfferExpiredCardProps) {
  const snapshot = extractOfferSnapshotV3(message.payload)
  if (!snapshot) return null

  return (
    <article role="article" aria-label={t`Oferta vencida`}>
      <SystemEventCard tone="warning" kicker={t`Oferta vencida`} icon={Clock3}>
        <p className="text-sm font-semibold text-foreground">
          {snapshot.expiredAt ? (
            <>
              {t`La oferta venció el `}
              <time dateTime={snapshot.expiredAt}>
                {formatSnapshotDate(snapshot.expiredAt)}
              </time>
            </>
          ) : (
            t`La oferta venció.`
          )}
        </p>
      </SystemEventCard>
    </article>
  )
}
