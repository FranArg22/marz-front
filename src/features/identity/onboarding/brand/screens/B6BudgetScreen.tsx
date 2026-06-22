import { useEffect } from 'react'
import { t } from '@lingui/core/macro'
import { TrendingUp } from 'lucide-react'
import { cn } from '#/lib/utils'
import { Slider } from '#/components/ui/slider'
import { useBrandOnboardingStore } from '../store'
import { verticalLabelLower } from '../verticalLabels'
import {
  BUDGET_DEFAULT_USD,
  BUDGET_MAX_USD,
  BUDGET_MIN_USD,
  BUDGET_STEP_USD,
  budgetPercent,
  formatBudgetFull,
  formatBudgetShortK,
} from '../budget'

const TICKS = [1000, 10000, 20000, 30000, 40000, 50000] as const

export function B6BudgetScreen() {
  const store = useBrandOnboardingStore()
  const currentBudget = store.monthly_budget_usd ?? BUDGET_DEFAULT_USD
  const bigNumber = formatBudgetFull(currentBudget)

  // Commit the default so the step validates without forcing the user to drag.
  useEffect(() => {
    if (store.monthly_budget_usd == null) {
      store.setField('monthly_budget_usd', BUDGET_DEFAULT_USD)
    }
  }, [store])

  const verticalLabel = verticalLabelLower(store.vertical)
  const hint = verticalLabel
    ? t`Marcas de ${verticalLabel} invierten entre $2.000 y $7.000/mes`
    : t`Marcas similares invierten entre $2.000 y $7.000/mes`

  return (
    <div className="flex w-full flex-col items-center gap-12 max-sm:gap-6">
      <div className="flex w-full max-w-[640px] flex-col items-center gap-2.5">
        <h1 className="text-center text-[28px] font-semibold leading-tight tracking-[-0.02em] text-foreground max-sm:text-[22px]">
          {t`¿Cuánto pensás invertir por mes?`}
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          {t`Usamos tu respuesta para recomendarte el mejor plan.`}
        </p>
      </div>

      <div className="flex items-end" aria-live="polite">
        <span className="text-[36px] font-semibold tracking-[-0.02em] text-muted-foreground max-sm:text-[24px]">
          $
        </span>
        <span className="self-start pl-0.5 pt-2 text-sm font-semibold text-muted-foreground">
          {t`USD`}
        </span>
        <span className="text-[80px] font-bold leading-[1.2] tracking-[-0.02em] text-foreground max-sm:text-[48px]">
          {bigNumber}
        </span>
        <span className="pb-3 pl-1 text-lg font-medium text-muted-foreground">
          {t`/mes`}
        </span>
      </div>

      <div className="flex w-full max-w-[640px] flex-col gap-3">
        <Slider
          min={BUDGET_MIN_USD}
          max={BUDGET_MAX_USD}
          step={BUDGET_STEP_USD}
          value={[currentBudget]}
          onValueChange={([val]) => {
            if (val != null) {
              store.setField('monthly_budget_usd', val)
            }
          }}
          aria-label={t`Presupuesto mensual`}
        />
        <div className="relative h-4 w-full">
          {TICKS.map((tick, index) => (
            <span
              key={tick}
              className={cn(
                'absolute top-0 text-[11px]',
                index === 0
                  ? 'translate-x-0'
                  : index === TICKS.length - 1
                    ? '-translate-x-full'
                    : '-translate-x-1/2',
                currentBudget === tick
                  ? 'font-semibold text-foreground'
                  : 'font-normal text-muted-foreground',
              )}
              style={{ left: `${budgetPercent(tick)}%` }}
            >
              {formatBudgetShortK(tick)}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-full border border-border bg-card px-[18px] py-3">
        <div className="flex size-6 items-center justify-center rounded-full bg-primary/20">
          <TrendingUp className="size-4 text-primary" />
        </div>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </div>
    </div>
  )
}
