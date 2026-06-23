import { t } from '@lingui/core/macro'
import { TrendingUp } from 'lucide-react'
import { cn } from '#/lib/utils'
import { useBrandOnboardingStore } from '../store'
import { MarketingObjective, Vertical } from '../types'
import { BUDGET_DEFAULT_USD, formatBudgetShortK } from '../budget'

const OBJECTIVE_LABEL: Record<MarketingObjective, () => string> = {
  awareness: () => t`awareness`,
  performance: () => t`performance`,
  launch: () => t`lanzamiento`,
  community: () => t`comunidad`,
}

const VERTICAL_LABEL: Record<Vertical, () => string> = {
  fintech: () => t`fintech`,
  tech: () => t`tech`,
  ecommerce: () => t`e-commerce`,
  education: () => t`educación`,
  food: () => t`comida`,
  fitness: () => t`fitness`,
  health: () => t`salud`,
  entertainment: () => t`entretenimiento`,
  beauty: () => t`belleza`,
  gaming: () => t`gaming`,
  travel: () => t`viajes`,
  fashion: () => t`moda`,
  mobile_apps: () => t`apps móviles`,
  crypto: () => t`crypto`,
  ai_tech: () => t`AI / tech`,
  other: () => t`tu vertical`,
}

/* eslint-disable lingui/no-unlocalized-strings */
function formatViews(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000
    return `${m.toFixed(1).replace('.0', '')}M`
  }
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return `${n}`
}

function formatClicks(n: number): string {
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return `${n}`
}
/* eslint-enable lingui/no-unlocalized-strings */

export function B10PrimingProjection() {
  const store = useBrandOnboardingStore()
  const budgetUsd = store.monthly_budget_usd ?? BUDGET_DEFAULT_USD
  const objective = store.marketing_objective ?? MarketingObjective.performance
  const vertical = store.vertical ?? Vertical.other

  const views = budgetUsd * 240
  const clicks = budgetUsd * 1.8
  const cpc = clicks > 0 ? budgetUsd / clicks : 0

  const highlight: 'views' | 'clicks' =
    objective === 'performance' ? 'clicks' : 'views'

  const budgetLabel = formatBudgetShortK(budgetUsd)
  const objectiveLabel = OBJECTIVE_LABEL[objective]()
  const verticalLabel = VERTICAL_LABEL[vertical]()

  return (
    <div className="relative flex w-full flex-col items-center gap-10 max-sm:gap-6">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-160px] h-[640px] w-[860px] -translate-x-1/2 opacity-80 wizard-glow-pulse"
        style={{
          background:
            'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(13, 166, 120, 0.24) 0%, rgba(13, 166, 120, 0) 100%)',
        }}
      />

      <div className="relative flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5">
        <TrendingUp className="size-3 text-primary" />
        <span className="text-[11px] font-medium text-primary">
          {t`Proyección con tu budget y objetivo`}
        </span>
      </div>

      <div className="relative flex w-full max-w-[720px] flex-col items-center gap-3">
        <h1 className="text-center text-[44px] font-semibold leading-[1.2] tracking-[-0.02em] text-foreground max-sm:text-[30px]">
          {t`Así se ve lo que podés alcanzar.`}
        </h1>
        <p className="text-center text-[15px] leading-[1.5] text-muted-foreground">
          {t`Con ${budgetLabel}/mes y foco en ${objectiveLabel}, tu primer mes promedio en ${verticalLabel} LatAm.`}
        </p>
      </div>

      <div className="relative flex flex-wrap justify-center gap-6">
        <StatCard
          value={`~${formatViews(views)}`}
          label={t`views proyectados / mes`}
          highlighted={highlight === 'views'}
        />
        <StatCard
          value={`~${formatClicks(clicks)}`}
          label={t`clicks al sitio / mes`}
          highlighted={highlight === 'clicks'}
        />
        <StatCard
          value={`~$${cpc.toFixed(2)}`}
          label={t`CPC estimado`}
          highlighted={false}
        />
      </div>

      <p className="relative max-w-[720px] text-center text-[11px] leading-[1.5] text-muted-foreground">
        {t`Los números son referencias históricas en ${verticalLabel} LatAm.`}
      </p>
    </div>
  )
}

function StatCard({
  value,
  label,
  highlighted,
}: {
  value: string
  label: string
  highlighted: boolean
}) {
  return (
    <div
      className={cn(
        'flex h-[160px] w-[280px] flex-col items-center justify-center gap-2 rounded-3xl bg-card p-7 max-sm:h-auto max-sm:w-[280px] max-sm:p-5',
        highlighted ? 'border border-primary' : 'border border-border',
      )}
    >
      <span
        className={cn(
          'text-[56px] font-bold leading-[1.2] tracking-[-0.02em] max-sm:text-[40px]',
          highlighted ? 'text-primary' : 'text-foreground',
        )}
      >
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}
