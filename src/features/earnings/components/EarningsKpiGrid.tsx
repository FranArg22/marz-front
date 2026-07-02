import type { ReactNode } from 'react'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { Hourglass, TrendingUp, Wallet as WalletIcon } from 'lucide-react'

import type { CreatorEarningsKPI, Wallet } from '#/shared/api/generated/model'

interface EarningsKpiGridProps {
  kpis: CreatorEarningsKPI
  wallet: Wallet | undefined
  withdrawButton?: ReactNode
}

const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export function EarningsKpiGrid({
  kpis,
  wallet,
  withdrawButton,
}: EarningsKpiGridProps) {
  const pendingAmount = totalPendingNonWithdrawable(kpis)

  return (
    <div className="flex flex-col gap-3">
      <section
        aria-label={t`Earnings KPIs`}
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
      >
        <KpiCard
          icon={<WalletIcon className="size-3.5" aria-hidden="true" />}
          label={t`Total ganado`}
          value={formatMoney(kpis.total_earned.amount)}
          supportingText={t`Histórico`}
        />
        <KpiCard
          icon={<TrendingUp className="size-3.5" aria-hidden="true" />}
          label={t`Ganado en el período`}
          value={formatMoney(kpis.earned_in_period.amount)}
          supportingText={t`Período actual`}
        />
        {wallet ? (
          <KpiCard
            highlighted
            icon={
              <WalletIcon
                className="size-3.5 text-primary"
                aria-hidden="true"
              />
            }
            label={t`Balance disponible`}
            value={formatMoney(wallet.balance.amount)}
            supportingText={t`Disponible para retiro`}
          />
        ) : (
          <div className="h-[118px] animate-pulse rounded-2xl border border-border bg-card" />
        )}
        {withdrawButton}
      </section>

      {pendingAmount > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Hourglass className="size-3.5 shrink-0 text-warning" aria-hidden />
          <span>
            <Trans>Pendiente (no retirable):</Trans>{' '}
            <span className="font-medium text-foreground">
              {moneyFormatter.format(pendingAmount)}
            </span>
          </span>
        </div>
      )}
    </div>
  )
}

interface KpiCardProps {
  icon: ReactNode
  label: string
  value: string
  supportingText: string
  highlighted?: boolean
}

function KpiCard({
  icon,
  label,
  value,
  supportingText,
  highlighted = false,
}: KpiCardProps) {
  return (
    <article
      className={[
        'rounded-2xl border bg-card p-5 text-card-foreground',
        highlighted ? 'border-primary' : 'border-border',
      ].join(' ')}
    >
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 text-[28px] leading-tight font-bold tracking-normal text-foreground">
        {value}
      </p>
      <p
        className={
          highlighted
            ? 'mt-1 text-xs font-medium text-primary'
            : 'mt-1 text-xs text-muted-foreground'
        }
      >
        {supportingText}
      </p>
    </article>
  )
}

function formatMoney(amount: string) {
  return moneyFormatter.format(Number(amount))
}

function totalPendingNonWithdrawable(kpis: CreatorEarningsKPI) {
  return Number(kpis.pending_payout.amount) + Number(kpis.next_payout.amount)
}
