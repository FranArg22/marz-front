import { useCallback, useMemo, useRef } from 'react'
import { Check } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { cn } from '#/lib/utils'
import { getRecord, getString } from '#/shared/utils/record'
import {
  trackLinkCardSeen,
  useTrackOnceVisible,
} from '#/features/deliverables/analytics'
import type { DraftTimelineMessage } from '../types'
import type { LinkApprovedSnapshot } from '#/shared/ws/types'

interface LinkApprovedCardProps {
  message: DraftTimelineMessage
  currentAccountId: string
}

export function LinkApprovedCard({
  message,
  currentAccountId,
}: LinkApprovedCardProps) {
  const snapshot = useMemo(
    () => extractSnapshot(message.payload),
    [message.payload],
  )
  const cardRef = useRef<HTMLDivElement>(null)
  const outcome = snapshot ? extractPreviewOutcome(snapshot.link.preview) : null
  const handleCardSeen = useCallback(() => {
    if (!snapshot) return
    trackLinkCardSeen({
      deliverable_id: snapshot.deliverable_id,
      link_id: snapshot.link.id,
      platform: snapshot.deliverable_platform,
      ...(outcome === null ? {} : { outcome }),
    })
  }, [outcome, snapshot])
  useTrackOnceVisible(
    cardRef,
    snapshot ? `link_card_seen:${snapshot.link.id}` : null,
    handleCardSeen,
  )

  if (!snapshot) return null

  const direction =
    snapshot.approved_by_account_id === currentAccountId ? 'out' : 'in'

  return (
    <div
      ref={cardRef}
      className={cn(
        'flex py-1',
        direction === 'out' ? 'justify-end' : 'justify-start',
      )}
      data-testid="link-approved-card"
    >
      <span
        className={cn(
          'inline-flex max-w-[85%] items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium',
          direction === 'out'
            ? 'bg-success/10 text-success'
            : 'bg-success text-success-foreground',
        )}
      >
        <Check className="size-3.5 shrink-0" />
        <span className="shrink-0">{t`Link approved`}</span>
        <a
          href={snapshot.link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 truncate font-mono underline underline-offset-2"
        >
          {snapshot.link.url}
        </a>
      </span>
    </div>
  )
}

function extractSnapshot(
  payload: Record<string, unknown> | null,
): LinkApprovedSnapshot | null {
  if (!payload) return null
  const snapshot =
    (payload.snapshot as Record<string, unknown> | undefined) ?? payload
  const link = getRecord(snapshot.link) ?? snapshot
  const url = getString(link.url)
  if (!url) return null

  return {
    event_type: 'LinkApproved',
    deliverable_id: getString(snapshot.deliverable_id) ?? '',
    deliverable_platform: getString(snapshot.deliverable_platform) ?? '',
    deliverable_format: getString(snapshot.deliverable_format) ?? '',
    deliverable_offer_stage_id:
      getString(snapshot.deliverable_offer_stage_id) ?? null,
    link: {
      id: getString(link.id) ?? '',
      url,
      status: 'approved',
      preview: link.preview ?? snapshot.preview ?? null,
    },
    approved_at: getString(snapshot.approved_at) ?? '',
    approved_by_account_id: getString(snapshot.approved_by_account_id) ?? '',
  }
}

function extractPreviewOutcome(
  preview: unknown,
): 'title_and_thumbnail' | 'url_only' | 'failed' | null {
  const outcome = getString(getRecord(preview)?.outcome)
  if (
    outcome === 'title_and_thumbnail' ||
    outcome === 'url_only' ||
    outcome === 'failed'
  ) {
    return outcome
  }
  return null
}
