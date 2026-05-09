import { t } from '@lingui/core/macro'
import { Link } from '@tanstack/react-router'

import { Badge } from '#/components/ui/badge'
import { ConfigurationPendingBadge } from '#/features/campaigns/configuration/components/ConfigurationPendingBadge'
import type { CampaignConfigurationStep } from '#/features/campaigns/configuration/hooks'

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
  configurationComplete?: boolean | null
  configurationCurrentStep?: CampaignConfigurationStep | null
}

const statusMeta: Record<
  CampaignMiniCardProps['status'],
  { label: string; variant: 'default' | 'secondary' | 'outline' }
> = {
  draft: { label: 'Draft', variant: 'outline' },
  active: { label: 'Active', variant: 'default' },
  paused: { label: 'Paused', variant: 'secondary' },
  completed: { label: 'Completed', variant: 'secondary' },
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
  configurationComplete,
  configurationCurrentStep,
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
      isConfigurationPending={
        status === 'draft' &&
        configurationComplete === false &&
        !!configurationCurrentStep
      }
    />
  )

  if (
    campaignId &&
    status === 'draft' &&
    configurationComplete === false &&
    configurationCurrentStep
  ) {
    return (
      <Link
        to="/campaigns/$campaignId/configuration/$step"
        params={{ campaignId, step: configurationCurrentStep }}
        className="block rounded-2xl outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {card}
      </Link>
    )
  }

  if (campaignId) {
    return (
      <Link
        to="/campaigns/$campaignId"
        params={{ campaignId }}
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
  isConfigurationPending,
}: Omit<
  CampaignMiniCardProps,
  'campaignId' | 'configurationComplete' | 'configurationCurrentStep'
> & {
  isConfigurationPending: boolean
}) {
  const badge = statusMeta[status]
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
          {isConfigurationPending ? <ConfigurationPendingBadge /> : null}
          <Badge variant={badge.variant} className="rounded-full">
            {badge.label}
          </Badge>
        </div>
      </header>

      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <Stat label="Creators" value={String(creators)} />
        <Stat label="Budget" value={budget} />
        <Stat
          label="Videos"
          value={`${videos.done}/${videos.total}`}
          align="right"
        />
      </dl>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
      </div>

      <footer className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{pct}% complete</span>
        <span>{platforms.join(' · ')}</span>
      </footer>

      {isConfigurationPending ? (
        <div className="mt-3 rounded-xl bg-warning/10 px-3 py-2 text-sm font-medium text-warning">
          {t`Retomar configuración`}
        </div>
      ) : null}
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
