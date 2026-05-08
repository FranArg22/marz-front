import { t } from '@lingui/core/macro'
import { useMemo } from 'react'

import type { MessageItem } from '#/features/chat/types'
import { i18n } from '#/shared/i18n/setup'
import { formatOfferAmount } from '#/shared/utils/formatOfferAmount'
import { PaymentCard } from '#/shared/ui/PaymentCard'
import type { PaymentMarkedSnapshot } from '#/shared/ws/types'

interface PaymentMarkedCardProps {
  message: MessageItem
  viewer: { kind: 'brand' | 'creator' | undefined }
}

function extractSnapshot(
  payload: Record<string, unknown> | null,
): PaymentMarkedSnapshot | null {
  if (!payload) return null
  const snapshot =
    (payload.snapshot as Record<string, unknown> | undefined) ?? payload
  if (snapshot.event_type !== 'PaymentMarked') return null
  if (typeof snapshot.amount !== 'string') return null
  if (typeof snapshot.currency !== 'string') return null
  if (typeof snapshot.deliverable_display_label !== 'string') return null
  if (typeof snapshot.declared_at !== 'string') return null
  if (typeof snapshot.deliverable_id !== 'string') return null
  return snapshot as unknown as PaymentMarkedSnapshot
}

function buildNote(snapshot: PaymentMarkedSnapshot) {
  const declaredDate = new Date(snapshot.declared_at).toLocaleDateString(
    i18n.locale || undefined,
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    },
  )
  return t`${snapshot.deliverable_display_label} · ${declaredDate}`
}

export function PaymentMarkedCard({ message, viewer }: PaymentMarkedCardProps) {
  const snapshot = useMemo(
    () => extractSnapshot(message.payload),
    [message.payload],
  )

  if (!snapshot) return null

  const audience = viewer.kind === 'brand' ? 'sent' : 'received'

  return (
    <div
      className={`flex py-1 ${viewer.kind === 'brand' ? 'justify-end' : 'justify-start'}`}
      data-testid="payment-marked-card"
    >
      <div className="w-full max-w-[380px]">
        <PaymentCard
          audience={audience}
          amount={formatOfferAmount(snapshot.amount, snapshot.currency)}
          note={buildNote(snapshot)}
        />
      </div>
    </div>
  )
}
