import { t } from '@lingui/core/macro'

import { Badge } from '#/components/ui/badge'
import type { ArchivedOfferItem } from '#/features/offers/hooks/useConversationOffers'

type OfferArchiveType = ArchivedOfferItem['type']

function getOfferTypeLabels(): Record<OfferArchiveType, string> {
  return {
    single: t`Single`,
    bundle: t`Bundle`,
    multistage: t`Multi-stage`,
  }
}

export function getOfferTypeBadgeLabel(type: OfferArchiveType) {
  return getOfferTypeLabels()[type]
}

interface OfferTypeBadgeProps {
  type: OfferArchiveType
}

export function OfferTypeBadge({ type }: OfferTypeBadgeProps) {
  const label = getOfferTypeBadgeLabel(type)

  return (
    <Badge
      variant="secondary"
      className="shrink-0 rounded-full bg-muted text-[11px] text-muted-foreground"
      aria-label={t`Offer type: ${label}`}
    >
      {label}
    </Badge>
  )
}
