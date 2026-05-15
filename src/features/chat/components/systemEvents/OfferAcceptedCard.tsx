import { t } from '@lingui/core/macro'
import { CheckCircle2 } from 'lucide-react'

import type { MessageItem } from '#/features/chat/types'
import { SystemEventCard } from '#/shared/ui/SystemEventCard'

import { OfferEventDetails } from './OfferEventDetails'
import {
  extractOfferSnapshotV3,
  formatSnapshotDate,
} from './offerEventCardUtils'

interface OfferAcceptedCardProps {
  message: MessageItem
}

export function OfferAcceptedCard({ message }: OfferAcceptedCardProps) {
  const snapshot = extractOfferSnapshotV3(message.payload)
  if (!snapshot) return null

  return (
    <article role="article" aria-label={t`Oferta aceptada`}>
      <SystemEventCard
        tone="success"
        kicker={t`Oferta aceptada`}
        icon={CheckCircle2}
        headerVariant="solid"
      >
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">
            {snapshot.acceptedAt ? (
              <>
                {t`La oferta fue aceptada el `}
                <time dateTime={snapshot.acceptedAt}>
                  {formatSnapshotDate(snapshot.acceptedAt)}
                </time>
              </>
            ) : (
              t`La oferta fue aceptada.`
            )}
          </p>
          <OfferEventDetails snapshot={snapshot} />
        </div>
      </SystemEventCard>
    </article>
  )
}
