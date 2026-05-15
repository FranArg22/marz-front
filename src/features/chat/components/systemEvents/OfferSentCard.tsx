import { t } from '@lingui/core/macro'
import { Send } from 'lucide-react'

import type { MessageItem } from '#/features/chat/types'
import { SystemEventCard } from '#/shared/ui/SystemEventCard'

import { OfferEventDetails } from './OfferEventDetails'
import { extractOfferSnapshotV3 } from './offerEventCardUtils'

interface OfferSentCardProps {
  message: MessageItem
}

export function OfferSentCard({ message }: OfferSentCardProps) {
  const snapshot = extractOfferSnapshotV3(message.payload)
  if (!snapshot) return null

  return (
    <article role="article" aria-label={t`Oferta enviada`}>
      <SystemEventCard tone="info" kicker={t`Oferta enviada`} icon={Send}>
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">
            {t`La marca envió una oferta.`}
          </p>
          <OfferEventDetails snapshot={snapshot} />
        </div>
      </SystemEventCard>
    </article>
  )
}
