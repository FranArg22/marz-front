import { t } from '@lingui/core/macro'
import { Send } from 'lucide-react'

import type { MessageItem } from '#/features/chat/types'
import { EventBubble } from '#/shared/ui/EventBubble'

import { extractOfferSnapshotV3 } from './offerEventCardUtils'

interface OfferSentCardProps {
  message: MessageItem
  sessionKind?: 'brand' | 'creator'
}

export function OfferSentCard({ message, sessionKind }: OfferSentCardProps) {
  const snapshot = extractOfferSnapshotV3(message.payload)
  if (!snapshot) return null

  // Offers always go brand → creator, so the creator is the receiver.
  const label =
    sessionKind === 'creator' ? t`Oferta recibida` : t`Oferta enviada`

  return (
    <article aria-label={label}>
      <EventBubble severity="info" direction="out" icon={Send}>
        {label}
      </EventBubble>
    </article>
  )
}
