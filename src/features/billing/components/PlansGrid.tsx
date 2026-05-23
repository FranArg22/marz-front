import { t } from '@lingui/core/macro'
import { cn } from '#/lib/utils'
import type { BillingInterval } from '#/shared/api/generated/model/billingInterval'
import type { BillingPlan } from '#/shared/api/generated/model/billingPlan'
import type { BillingPlanIdentifier } from '#/shared/api/generated/model/billingPlanIdentifier'
import { PlanCard } from './PlanCard'

interface PlansGridProps {
  plans: BillingPlan[]
  selectedPlan?: BillingPlanIdentifier
  selectedInterval: BillingInterval
  onIntervalChange: (interval: BillingInterval) => void
  onPlanSelect: (plan: BillingPlanIdentifier) => void
}

export function PlansGrid({
  plans,
  selectedPlan,
  selectedInterval,
  onIntervalChange,
  onPlanSelect,
}: PlansGridProps) {
  const visiblePlans = plans.filter((p) => p.interval === selectedInterval)

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div
        role="tablist"
        aria-label={t`Intervalo de facturación`}
        className="flex h-10 items-center gap-1 rounded-full border border-border bg-card p-1"
      >
        <IntervalTab
          interval="month"
          selected={selectedInterval === 'month'}
          onSelect={onIntervalChange}
          label={t`Mensual`}
        />
        <IntervalTab
          interval="year"
          selected={selectedInterval === 'year'}
          onSelect={onIntervalChange}
          label={t`Anual`}
        />
      </div>

      <div
        role="radiogroup"
        aria-label={t`Planes`}
        className="flex flex-wrap justify-center gap-4"
      >
        {visiblePlans.map((p) => (
          <PlanCard
            key={`${p.plan}-${p.interval}`}
            plan={p.plan}
            interval={p.interval}
            amountUsd={Number.parseFloat(p.amount_usd)}
            selected={selectedPlan === p.plan}
            onSelect={() => onPlanSelect(p.plan)}
          />
        ))}
      </div>
    </div>
  )
}

interface IntervalTabProps {
  interval: BillingInterval
  selected: boolean
  onSelect: (interval: BillingInterval) => void
  label: string
}

function IntervalTab({ interval, selected, onSelect, label }: IntervalTabProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={() => onSelect(interval)}
      className={cn(
        'flex h-8 items-center rounded-full px-4 text-xs font-semibold transition-colors',
        selected
          ? 'bg-foreground text-background'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
    </button>
  )
}
