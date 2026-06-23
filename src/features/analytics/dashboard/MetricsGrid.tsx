import type { DashboardCardsResponse } from '#/shared/api/generated/model/dashboardCardsResponse'
import type { DashboardCardKey } from '#/shared/api/generated/model/dashboardCardKey'

import { ErrorBlockState } from './ErrorBlockState'
import { MetricCard } from './MetricCard'

interface MetricsGridProps {
  data: DashboardCardsResponse | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}

const CARD_ORDER: DashboardCardKey[] = [
  'videos_published',
  'creators_activated',
  'views',
  'spend',
  'likes',
  'comments',
  'engagement',
  'cpm',
]

export function MetricsGrid({
  data,
  isLoading,
  isError,
  onRetry,
}: MetricsGridProps) {
  if (isError) {
    return <ErrorBlockState onRetry={onRetry} />
  }

  if (isLoading || !data) {
    return (
      <section
        data-testid="metrics-grid"
        className="grid grid-cols-2 gap-3 md:grid-cols-4"
      >
        {CARD_ORDER.map((key) => (
          <MetricCardSkeleton key={key} />
        ))}
      </section>
    )
  }

  const cardsByKey = new Map(data.cards.map((card) => [card.key, card]))

  return (
    <section
      data-testid="metrics-grid"
      className="grid grid-cols-2 gap-3 md:grid-cols-4"
    >
      {CARD_ORDER.map((key) => {
        const card = cardsByKey.get(key)

        return card ? <MetricCard key={key} card={card} /> : null
      })}
    </section>
  )
}

function MetricCardSkeleton() {
  return (
    <div
      data-testid="metric-card-skeleton"
      className="min-h-[105px] animate-pulse rounded-3xl border border-border bg-card p-3.5 shadow-[0_10px_24px_-18px_rgba(0,0,0,0.35)]"
    >
      <div className="flex h-7 items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-full bg-muted" />
          <div className="h-3 w-28 rounded-full bg-muted" />
        </div>
        <div className="size-5 rounded-full bg-muted" />
      </div>
      <div className="mt-4 flex items-end gap-2">
        <div className="h-6 w-20 rounded-full bg-muted" />
        <div className="h-5 w-12 rounded-full bg-muted" />
      </div>
    </div>
  )
}
