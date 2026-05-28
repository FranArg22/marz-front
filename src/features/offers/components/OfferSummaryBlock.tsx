import { t } from '@lingui/core/macro'

import type { OfferBonusTermsFormValues } from '../schemas/createOffer'
import { getMaxPayout } from './OfferSummary'

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export interface OfferSummaryBlockProps {
  amount: number
  bonusTerms?: OfferBonusTermsFormValues
  plan: 'free' | 'starter' | 'growth' | 'scale'
}

function formatUsd(amount: number) {
  return usdFormatter.format(Number.isFinite(amount) ? amount : 0)
}

export function OfferSummaryBlock({
  amount,
  bonusTerms,
  plan,
}: OfferSummaryBlockProps) {
  const baseAmount = Number.isFinite(amount) ? amount : 0
  const maxPayout = getMaxPayout(baseAmount, bonusTerms)
  const bonusCeiling = Math.max(maxPayout - baseAmount, 0)
  const isPaidPlan = plan !== 'free'
  const formattedBaseAmount = formatUsd(baseAmount)
  const formattedBonusCeiling = formatUsd(bonusCeiling)
  const formattedMaxPayout = formatUsd(maxPayout)

  return (
    <section
      data-testid="offers.send.summary_block"
      className="rounded-xl border border-border bg-card p-4 text-card-foreground"
    >
      <h3 className="text-[length:var(--font-size-sm)] font-semibold">
        {t`Resumen de la oferta`}
      </h3>

      <dl className="mt-3 space-y-2 text-[length:var(--font-size-sm)]">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">{t`Monto base`}</dt>
          <dd className="font-mono font-medium">
            {t`${formattedBaseAmount} USD (base)`}
          </dd>
        </div>

        {bonusCeiling > 0 ? (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{t`Bonos máximos`}</dt>
            <dd className="font-mono font-medium">
              {t`${formattedBonusCeiling} USD (bonus)`}
            </dd>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
          <dt className="font-semibold">{t`Monto máximo`}</dt>
          <dd className="font-mono font-semibold">
            {t`${formattedMaxPayout} USD (máximo)`}
          </dd>
        </div>
      </dl>

      {isPaidPlan ? (
        <p className="mt-3 text-[length:var(--font-size-xs)] text-muted-foreground">
          {t`El cobro se realiza cuando el creator acepta`}
        </p>
      ) : null}
    </section>
  )
}
