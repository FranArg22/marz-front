import { t } from '@lingui/core/macro'
import {
  CircleDollarSign,
  FileClock,
  Handshake,
  UsersRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { CampaignOverviewResponse } from '#/shared/api/generated/model'

interface StatsBlockProps {
  overview: CampaignOverviewResponse
}

interface StatCardProps {
  label: string
  value: string
  helper: string
  icon: LucideIcon
  tone?: 'default' | 'success' | 'neutral'
}

const compactNumberFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const wholeUsdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const fractionalUsdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

export function StatsBlock({ overview }: StatsBlockProps) {
  const pendingOffersCount = formatCompactNumber(
    overview.spend_pending_offers_count,
  )

  return (
    <section aria-label={t`Estadísticas de campaña`}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t`Gastado`}
          value={formatUsd(
            sumUsd(overview.spend_committed_usd, overview.spend_paid_usd),
          )}
          helper={t`Ofertas comprometidas y pagos realizados`}
          icon={CircleDollarSign}
          tone="success"
        />
        <StatCard
          label={t`Pendiente`}
          value={formatUsd(overview.spend_pending_offers_usd)}
          helper={t`Ofertas enviadas sin aceptar`}
          icon={FileClock}
          tone="neutral"
        />
        <StatCard
          label={t`Ofertas`}
          value={formatCompactNumber(overview.offers_count)}
          helper={t`${pendingOffersCount} pendientes`}
          icon={Handshake}
        />
        <StatCard
          label={t`Postulaciones`}
          value={formatCompactNumber(overview.applications_count)}
          helper={t`Postulaciones recibidas`}
          icon={UsersRound}
        />
      </div>
    </section>
  )
}

function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = 'default',
}: StatCardProps) {
  const helperClassName =
    tone === 'success'
      ? 'text-success'
      : tone === 'neutral'
        ? 'text-muted-foreground'
        : 'text-muted-foreground'

  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-2 truncate text-[28px] leading-tight font-semibold text-foreground">
            {value}
          </p>
          <p className={`mt-2 text-xs ${helperClassName}`}>{helper}</p>
        </div>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Icon className="size-4" aria-hidden="true" />
        </div>
      </div>
    </article>
  )
}

function formatCompactNumber(value: number) {
  return compactNumberFormatter.format(value)
}

function formatUsd(amount: string) {
  const number = Number.parseFloat(amount)
  if (Number.isNaN(number)) return `USD ${amount}`

  const formatter =
    number % 1 === 0 ? wholeUsdFormatter : fractionalUsdFormatter
  return formatter.format(number)
}

function sumUsd(...amounts: string[]) {
  const total = amounts.reduce((sum, amount) => {
    const number = Number.parseFloat(amount)
    return Number.isNaN(number) ? sum : sum + number
  }, 0)
  return total.toFixed(2)
}
