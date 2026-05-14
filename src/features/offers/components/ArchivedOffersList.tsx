import { Archive, ChevronRight } from 'lucide-react'
import { Trans } from '@lingui/react/macro'
import { t } from '@lingui/core/macro'

import { Badge } from '#/components/ui/badge'

export interface ArchivedOffer {
  offerId: string
  amount: string
  date: string
  status: 'paid' | 'rejected' | 'cancelled'
}

interface ArchivedOffersListProps {
  offers: Array<ArchivedOffer>
}

function getBadgeByStatus(): Record<
  ArchivedOffer['status'],
  {
    label: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
  }
> {
  return {
    paid: { label: t`Paid`, variant: 'default' },
    rejected: { label: t`Rejected`, variant: 'destructive' },
    cancelled: { label: t`Cancelled`, variant: 'outline' },
  }
}

export function ArchivedOffersList({ offers }: ArchivedOffersListProps) {
  const badgeByStatus = getBadgeByStatus()
  return (
    <section>
      <header className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Archive className="size-4" />
        <Trans>Archived offers</Trans>
        <span className="ml-auto">{offers.length}</span>
      </header>
      <ul className="space-y-2">
        {offers.map((offer) => {
          const badge = badgeByStatus[offer.status]
          return (
            <li key={offer.offerId}>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-surface-hover"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-sm font-semibold text-foreground">
                    #{offer.offerId}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {offer.amount} · {offer.date}
                  </div>
                </div>
                <Badge variant={badge.variant} className="rounded-full">
                  {badge.label}
                </Badge>
                <ChevronRight className="size-4 text-muted-foreground" />
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
