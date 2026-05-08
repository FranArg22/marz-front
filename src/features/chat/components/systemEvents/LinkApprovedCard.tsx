import { useMemo } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { Button } from '#/components/ui/button'
import { useGetConversationDeliverablesQuery } from '#/features/deliverables/api/conversationDeliverables'
import { canMarkDeliverableAsPaid } from '#/shared/payments/markAsPaidPermissions'
import type { MarkAsPaidViewer } from '#/shared/payments/markAsPaidPermissions'
import { SystemEventCard } from '#/shared/ui/SystemEventCard'
import type { MessageItem } from '#/features/chat/types'

interface LinkApprovedCardProps {
  message: MessageItem
  conversationId: string
  viewer: MarkAsPaidViewer
  onMarkAsPaid?: (deliverableId: string) => void
}

interface LinkApprovedSnapshot {
  deliverable_id: string
  deliverable_display_label?: string
  approved_at?: string
}

function extractSnapshot(
  payload: Record<string, unknown> | null,
): LinkApprovedSnapshot | null {
  if (!payload) return null
  const snapshot =
    (payload.snapshot as Record<string, unknown> | undefined) ?? payload
  if (typeof snapshot.deliverable_id !== 'string') return null
  return {
    deliverable_id: snapshot.deliverable_id,
    deliverable_display_label:
      typeof snapshot.deliverable_display_label === 'string'
        ? snapshot.deliverable_display_label
        : undefined,
    approved_at:
      typeof snapshot.approved_at === 'string'
        ? snapshot.approved_at
        : undefined,
  }
}

export function LinkApprovedCard({
  message,
  conversationId,
  viewer,
  onMarkAsPaid,
}: LinkApprovedCardProps) {
  const deliverablesQuery = useGetConversationDeliverablesQuery(conversationId)
  const snapshot = useMemo(
    () => extractSnapshot(message.payload),
    [message.payload],
  )

  if (!snapshot) return null

  const deliverable = deliverablesQuery.data?.deliverables.find(
    (item) => item.id === snapshot.deliverable_id,
  )
  const canMarkAsPaid = canMarkDeliverableAsPaid({
    viewer,
    deliverableStatus: deliverable?.status,
  })

  return (
    <SystemEventCard
      tone="success"
      kicker={t`Link approved`}
      icon={CheckCircle2}
      headerVariant="solid"
    >
      <div className="space-y-3">
        <p className="text-sm text-foreground">
          {snapshot.deliverable_display_label ?? t`Deliverable completed`}
        </p>
        {canMarkAsPaid ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onMarkAsPaid?.(snapshot.deliverable_id)}
          >
            {t`Mark as paid`}
          </Button>
        ) : null}
      </div>
    </SystemEventCard>
  )
}
