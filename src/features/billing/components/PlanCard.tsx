import { t } from '@lingui/core/macro'
import { cn } from '#/lib/utils'
import type { BillingInterval } from '#/shared/api/generated/model/billingInterval'
import type { BillingPlanIdentifier } from '#/shared/api/generated/model/billingPlanIdentifier'

const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const PLAN_NAME: Record<BillingPlanIdentifier, () => string> = {
  starter: () => t`Starter`,
  growth: () => t`Growth`,
  scale: () => t`Scale`,
}

interface PlanCardProps {
  plan: BillingPlanIdentifier
  interval: BillingInterval
  amountUsd: number
  selected: boolean
  onSelect: () => void
  highlightLabel?: string
}

export function PlanCard({
  plan,
  interval,
  amountUsd,
  selected,
  onSelect,
  highlightLabel,
}: PlanCardProps) {
  const intervalLabel = interval === 'year' ? t`/mo · anual` : t`/mo`

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'relative flex w-[260px] flex-col gap-4 rounded-2xl border bg-card p-6 text-left transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selected ? 'border-primary' : 'border-border hover:border-foreground/30',
      )}
    >
      {highlightLabel ? (
        <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary bg-background px-3 py-1 text-[10px] font-semibold tracking-[0.08em] text-primary">
          {highlightLabel}
        </span>
      ) : null}

      <span className="text-lg font-semibold text-foreground">
        {PLAN_NAME[plan]()}
      </span>

      <div className="flex items-end gap-1">
        <span className="text-4xl font-semibold leading-none tracking-tight text-foreground">
          {priceFormatter.format(amountUsd)}
        </span>
        <span className="pb-1 text-xs text-muted-foreground">{intervalLabel}</span>
      </div>

      <span
        className={cn(
          'mt-2 flex h-10 w-full items-center justify-center rounded-xl text-xs font-semibold',
          selected
            ? 'bg-primary text-primary-foreground'
            : 'border border-border bg-background text-foreground',
        )}
      >
        {t`Elegir plan`}
      </span>
    </button>
  )
}
