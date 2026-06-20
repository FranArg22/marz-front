import { t } from '@lingui/core/macro'
import {
  BarChart3,
  DollarSign,
  Eye,
  Heart,
  Info,
  MessageCircle,
  Users,
  Video,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Badge } from '#/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { cn } from '#/lib/utils'
import type { DashboardCard } from '#/shared/api/generated/model/dashboardCard'
import type { DashboardCardDeltaDirection } from '#/shared/api/generated/model/dashboardCardDeltaDirection'
import type { DashboardCardKey } from '#/shared/api/generated/model/dashboardCardKey'

interface MetricCardProps {
  card: DashboardCard
}

const NO_COMPARISON_TOOLTIP = () =>
  t`Sin datos del período anterior para comparar`

const ICONS: Record<DashboardCardKey, LucideIcon> = {
  videos_published: Video,
  creators_activated: Users,
  views: Eye,
  spend: DollarSign,
  likes: Heart,
  comments: MessageCircle,
  engagement: BarChart3,
  cpm: DollarSign,
}

export function MetricCard({ card }: MetricCardProps) {
  const Icon = ICONS[card.key]
  const cardLabel = getCardLabel(card.key)
  const deltaDisplay = card.delta.has_comparison ? card.delta.display : '—'
  const deltaTooltip = card.delta.has_comparison
    ? card.delta.tooltip
    : NO_COMPARISON_TOOLTIP()

  return (
    <article
      data-testid="metric-card"
      className="flex min-h-[105px] flex-col gap-2.5 rounded-3xl border border-border bg-card p-3.5 text-card-foreground shadow-[0_10px_24px_-18px_rgba(0,0,0,0.35)]"
    >
      <div className="flex h-7 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
            <Icon className="size-3.5 text-foreground" aria-hidden="true" />
          </span>
          <h3 className="truncate text-[11px] font-semibold leading-none text-muted-foreground">
            {cardLabel}
          </h3>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={t`Definición de ${cardLabel}`}
            >
              <Info className="size-3.5" aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-64 leading-relaxed">
            {getCardInfoTooltip(card.key)}
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-end gap-2">
        <p className="font-mono text-[22px] font-bold leading-none text-foreground">
          {card.current_display}
        </p>

        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="ghost"
              data-testid="metric-delta"
              className={cn(
                'h-5 rounded-full px-2 font-mono text-[11px] font-bold leading-none',
                getDeltaClassName(card.delta.direction),
                !card.delta.has_comparison &&
                  'bg-muted text-muted-foreground hover:bg-muted',
              )}
            >
              {deltaDisplay}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-72 leading-relaxed">
            {deltaTooltip}
          </TooltipContent>
        </Tooltip>
      </div>
    </article>
  )
}

function getDeltaClassName(direction: DashboardCardDeltaDirection): string {
  if (direction === 'positive') {
    return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
  }

  if (direction === 'negative') {
    return 'bg-red-500/10 text-red-600 dark:text-red-400'
  }

  return 'bg-muted text-muted-foreground'
}

function getCardLabel(key: DashboardCardKey): string {
  const labels: Record<DashboardCardKey, () => string> = {
    videos_published: () => t`Videos publicados`,
    creators_activated: () => t`Creadores activados`,
    views: () => t`Vistas`,
    spend: () => t`Gasto Total`,
    likes: () => t`Likes`,
    comments: () => t`Comentarios`,
    engagement: () => t`Engagement`,
    cpm: () => t`CPM`,
  }
  return labels[key]()
}

function getCardInfoTooltip(key: DashboardCardKey): string {
  const tooltips: Record<DashboardCardKey, () => string> = {
    videos_published: () =>
      t`Cantidad de videos publicados por los creators en el período.`,
    creators_activated: () =>
      t`Creators con al menos una oferta aceptada en el período.`,
    views: () =>
      t`Suma de vistas acumuladas de todos los videos al fin del período.`,
    spend: () => t`Suma de pagos efectuados a creators en el período.`,
    likes: () =>
      t`Suma de likes acumulados de todos los videos al fin del período.`,
    comments: () =>
      t`Suma de comentarios acumulados de todos los videos al fin del período.`,
    engagement: () =>
      t`Ratio (likes + comentarios) / vistas, al fin del período.`,
    cpm: () =>
      t`Costo por mil vistas: gasto del período / vistas del período × 1000.`,
  }
  return tooltips[key]()
}
