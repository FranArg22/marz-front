import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { useLayoutEffect, useRef, useState } from 'react'
import { cn } from '#/lib/utils'
import type { BillingInterval } from '#/shared/api/generated/model/billingInterval'
import type { BillingPlan } from '#/shared/api/generated/model/billingPlan'
import type { BillingPlanIdentifier } from '#/shared/api/generated/model/billingPlanIdentifier'
import { PlanCard } from './PlanCard'

const PLAN_ORDER: Record<BillingPlanIdentifier, number> = {
  starter: 0,
  growth: 1,
  scale: 2,
}

interface PlansGridProps {
  plans: BillingPlan[]
  selectedPlan?: BillingPlanIdentifier
  selectedInterval: BillingInterval
  onIntervalChange: (interval: BillingInterval) => void
  onPlanSelect: (plan: BillingPlanIdentifier) => void
  onPlanCta?: (plan: BillingPlanIdentifier) => void
  ctaDisabled?: boolean
}

export function PlansGrid({
  plans,
  selectedPlan,
  selectedInterval,
  onIntervalChange,
  onPlanSelect,
  onPlanCta,
  ctaDisabled = false,
}: PlansGridProps) {
  const visiblePlans = plans
    .filter((p) => p.interval === selectedInterval)
    .sort((a, b) => PLAN_ORDER[a.plan] - PLAN_ORDER[b.plan])

  const tablistRef = useRef<HTMLDivElement>(null)
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null)

  // Slide a single pill to the active interval tab. Tabs have different widths
  // ("Anual -20%" is wider), so we measure the active tab rather than assume.
  useLayoutEffect(() => {
    const list = tablistRef.current
    if (!list) return
    const measure = () => {
      const active = list.querySelector<HTMLElement>(
        // eslint-disable-next-line lingui/no-unlocalized-strings -- CSS attribute selector, not UI copy
        `[data-interval="${selectedInterval}"]`,
      )
      if (active) {
        setPill({ left: active.offsetLeft, width: active.offsetWidth })
      }
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(list)
    return () => observer.disconnect()
  }, [selectedInterval])

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div
        ref={tablistRef}
        role="tablist"
        aria-label={t`Intervalo de facturación`}
        className="relative flex h-10 items-center gap-1 rounded-full border border-border bg-card p-1"
      >
        {pill ? (
          <span
            aria-hidden
            className="pointer-events-none absolute top-1 h-8 rounded-full bg-foreground transition-[left,width] duration-200 ease-[var(--ease-out-quint)] motion-reduce:transition-none"
            style={{ left: pill.left, width: pill.width }}
          />
        ) : null}
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
          showDiscount
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
            onCta={() => onPlanCta?.(p.plan)}
            ctaDisabled={ctaDisabled}
            highlightLabel={
              p.plan === 'growth' ? t`Recomendado para vos` : undefined
            }
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
  showDiscount?: boolean
}

function IntervalTab({
  interval,
  selected,
  onSelect,
  label,
  showDiscount,
}: IntervalTabProps) {
  return (
    <button
      type="button"
      role="tab"
      data-interval={interval}
      aria-selected={selected}
      onClick={() => onSelect(interval)}
      className={cn(
        'relative z-10 flex h-8 items-center gap-1.5 rounded-full px-4 text-xs font-semibold transition-colors',
        selected
          ? 'text-background'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
      {showDiscount && (
        <span
          className={cn(
            'text-[10px] font-semibold',
            selected ? 'text-background' : 'text-primary',
          )}
        >
          <Trans>· 20% off</Trans>
        </span>
      )}
    </button>
  )
}
