import { t } from '@lingui/core/macro'

import type { OfferBonusTermsFormValues } from '../schemas/createOffer'

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

interface OfferSummaryProps {
  amount: number
  bonusTerms?: OfferBonusTermsFormValues
}

export function getMaxPayout(
  amount: number,
  bonusTerms?: OfferBonusTermsFormValues,
) {
  if (!bonusTerms?.enabled) return amount

  return bonusTerms.speed_bonus_windows.reduce((total, window) => {
    if (window.bonus_amount.type === 'fixed') {
      return total + window.bonus_amount.amount_usd
    }

    return total + amount * (window.bonus_amount.value / 100)
  }, amount)
}

export function formatUsd(amount: number) {
  return usdFormatter.format(Number.isFinite(amount) ? amount : 0)
}

export function OfferSummary({ amount, bonusTerms }: OfferSummaryProps) {
  const baseAmount = Number.isFinite(amount) ? amount : 0
  const maxPayout = getMaxPayout(baseAmount, bonusTerms)
  const bonusCeiling = Math.max(maxPayout - baseAmount, 0)

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-card-foreground">
            {t`Resumen de la oferta`}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t`Máximo si aplican todos los bonos`}
          </p>
        </div>
        <span className="text-sm font-semibold text-primary">
          {formatUsd(maxPayout)}
        </span>
      </div>

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">{t`Monto base`}</dt>
          <dd className="font-medium text-card-foreground">
            {formatUsd(baseAmount)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">{t`Techo de bonos`}</dt>
          <dd className="font-medium text-card-foreground">
            {formatUsd(bonusCeiling)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
          <dt className="font-semibold text-card-foreground">
            {t`Payout máximo`}
          </dt>
          <dd className="font-mono text-lg font-semibold text-primary">
            {formatUsd(maxPayout)}
          </dd>
        </div>
      </dl>
    </section>
  )
}
