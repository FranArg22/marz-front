import { t } from '@lingui/core/macro'

import { usePreviewOfferFee } from '#/shared/api/generated/offers/offers'

import type { OfferBonusTermsFormValues } from '../schemas/createOffer'

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

function formatUsd(amount: number) {
  return usdFormatter.format(Number.isFinite(amount) ? amount : 0)
}

export function OfferSummaryBlock({
  amount,
  bonusTerms,
  plan,
}: OfferSummaryBlockProps) {
  const baseAmount = Number.isFinite(amount) ? amount : 0
  const bonusCeiling = Math.max(
    getMaxPayout(baseAmount, bonusTerms) - baseAmount,
    0,
  )
  const isPaidPlan = plan !== 'free'

  // Only paid plans place a Stripe hold, so only they are charged the
  // processing fee. The card is charged Base + fee, where the fee grosses up
  // Stripe's cut on the total charged so the base amount stays whole; bonuses
  // are paid out separately.
  const feeQuery = usePreviewOfferFee(
    { amount: baseAmount.toFixed(2) },
    { query: { enabled: isPaidPlan && baseAmount > 0, staleTime: 60_000 } },
  )
  const feeData = feeQuery.data?.status === 200 ? feeQuery.data.data : undefined

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
          <dd className="font-mono font-medium">{formatUsd(baseAmount)}</dd>
        </div>

        {bonusCeiling > 0 ? (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{t`Bonos máximos`}</dt>
            <dd className="font-mono font-medium">
              +{formatUsd(bonusCeiling)}
            </dd>
          </div>
        ) : null}

        {isPaidPlan && feeData ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <dt className="flex flex-col gap-0.5 text-muted-foreground">
                <span>{t`Costo de procesamiento de pagos`}</span>
                <span className="text-xs text-muted-foreground/70">
                  {t`Stripe cobra 2.9% + $0.30 sobre el total cobrado; se suma para que el monto base de la oferta quede cubierto íntegro.`}
                </span>
              </dt>
              <dd className="shrink-0 font-mono font-medium">
                +{formatUsd(Number(feeData.processing_fee))}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border pt-2.5">
              <dt className="font-semibold">{t`Total a cobrar a tu tarjeta`}</dt>
              <dd className="font-mono font-bold">
                {formatUsd(Number(feeData.total_amount))}
              </dd>
            </div>
          </>
        ) : null}
      </dl>

      {isPaidPlan ? (
        <p className="mt-3 text-[length:var(--font-size-xs)] text-muted-foreground">
          {t`El cobro se realiza cuando el creador acepta`}
        </p>
      ) : null}
    </section>
  )
}
