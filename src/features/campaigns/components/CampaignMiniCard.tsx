import { t } from '@lingui/core/macro'
import { Link } from '@tanstack/react-router'

import { Badge } from '#/components/ui/badge'

// The parent route `/_brand/campaigns/$campaignId` declares a search schema
// with a defaulted `tab`. TanStack Router's typed Link API surfaces it as
// required, so we provide the default here.
const campaignDetailSearchDefaults = {
  tab: 'overview' as const,
}

interface CampaignMiniCardProps {
  campaignId?: string
  name: string
  startDate: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  creators: number
  budget: string
  videos: {
    done: number
    total: number
  }
  platforms: Array<string>
}

function getStatusMeta(): Record<
  CampaignMiniCardProps['status'],
  { label: string; variant: 'default' | 'secondary' | 'outline' }
> {
  return {
    draft: { label: t`Borrador`, variant: 'outline' },
    active: { label: t`Activa`, variant: 'default' },
    paused: { label: t`Pausada`, variant: 'secondary' },
    completed: { label: t`Completada`, variant: 'secondary' },
  }
}

export function CampaignMiniCard({
  campaignId,
  name,
  startDate,
  status,
  creators,
  budget,
  videos,
  platforms,
}: CampaignMiniCardProps) {
  const card = (
    <CampaignMiniCardContent
      name={name}
      startDate={startDate}
      status={status}
      creators={creators}
      budget={budget}
      videos={videos}
      platforms={platforms}
    />
  )

  if (campaignId) {
    return (
      <Link
        to="/campaigns/$campaignId"
        params={{ campaignId }}
        search={campaignDetailSearchDefaults}
        className="block rounded-2xl outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {card}
      </Link>
    )
  }

  return card
}

function CampaignMiniCardContent({
  name,
  startDate,
  status,
  creators,
  budget,
  videos,
  platforms,
}: Omit<CampaignMiniCardProps, 'campaignId'>) {
  const badge = getStatusMeta()[status]
  const pct =
    videos.total > 0 ? Math.round((videos.done / videos.total) * 100) : 0

  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <header className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-foreground">
            {name}
          </h3>
          <div className="mt-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {startDate}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
          <Badge variant={badge.variant} className="rounded-full">
            {badge.label}
          </Badge>
        </div>
      </header>

      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <Stat label={t`Creadores`} value={String(creators)} />
        <Stat label={t`Presupuesto`} value={budget} />
        <Stat
          label={t`Videos`}
          value={`${videos.done}/${videos.total}`}
          align="right"
        />
      </dl>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
      </div>

      <footer className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{t`${pct}% completado`}</span>
        <span>{platforms.join(' · ')}</span>
      </footer>
    </article>
  )
}

function Stat({
  label,
  value,
  align = 'left',
}: {
  label: string
  value: string
  align?: 'left' | 'right'
}) {
  return (
    <div className={align === 'right' ? 'text-right' : ''}>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 font-mono text-base font-semibold text-foreground">
        {value}
      </dd>
    </div>
  )
}
