import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'

import type { CreatorEarningsPeriod } from '#/shared/api/generated/model'
import { trackEarningsViewed } from '../analytics'
import { useCreatorEarningsQuery } from '../hooks/useCreatorEarnings'
import { useWalletQuery } from '../hooks/useWalletQuery'
import { EarningsKpiGrid } from './EarningsKpiGrid'
import { EarningsPeriodControl } from './EarningsPeriodControl'
import { MonthlyEarningsChart } from './MonthlyEarningsChart'
import { EarningsPaymentsTable } from './EarningsPaymentsTable'
import { PendingBonusPanel } from './PendingBonusPanel'
import { WithdrawButton } from './WithdrawButton'
import { WithdrawalModal } from './WithdrawalModal'
import { WithdrawalsHistory } from './WithdrawalsHistory'

const EARNINGS_KPI_SKELETON_IDS = [
  'total',
  'period',
  'balance',
  'withdraw',
] as const

interface EarningsPageProps {
  period: CreatorEarningsPeriod
  q?: string
  cursor?: string
  onPeriodChange: (period: CreatorEarningsPeriod) => void
}

export function EarningsPage({
  period,
  q,
  cursor,
  onPeriodChange,
}: EarningsPageProps) {
  const hasTrackedView = useRef(false)
  const earningsQuery = useCreatorEarningsQuery({
    period,
    q,
    cursor,
    limit: 25,
  })
  const walletQuery = useWalletQuery()
  const [withdrawOpen, setWithdrawOpen] = useState(false)

  useEffect(() => {
    if (hasTrackedView.current) {
      return
    }

    hasTrackedView.current = true
    trackEarningsViewed()
  }, [])

  if (earningsQuery.isLoading) {
    return <EarningsPageShell period={period} onPeriodChange={onPeriodChange} />
  }

  if (earningsQuery.isError || !earningsQuery.data) {
    return (
      <EarningsPageShell period={period} onPeriodChange={onPeriodChange}>
        <div
          role="alert"
          className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground"
        >
          <Trans>
            We could not load earnings right now. Try refreshing the page.
          </Trans>
        </div>
      </EarningsPageShell>
    )
  }

  return (
    <EarningsPageShell period={period} onPeriodChange={onPeriodChange}>
      <EarningsKpiGrid
        kpis={earningsQuery.data.kpis}
        wallet={walletQuery.data}
        withdrawButton={
          <WithdrawButton
            wallet={walletQuery.data}
            onWithdraw={() => setWithdrawOpen(true)}
          />
        }
      />
      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="min-w-0 flex-1">
          <MonthlyEarningsChart buckets={earningsQuery.data.monthly_earnings} />
        </div>
        <PendingBonusPanel
          key={getPendingBonusPanelKey(
            period,
            earningsQuery.data.pending_bonuses,
          )}
          period={period}
          pendingBonuses={earningsQuery.data.pending_bonuses}
        />
      </div>
      <EarningsPaymentsTable
        period={period}
        q={q}
        payments={earningsQuery.data.payments}
      />
      <WithdrawalsHistory />
      {withdrawOpen && walletQuery.data && (
        <WithdrawalModal
          open
          wallet={walletQuery.data}
          onOpenChange={setWithdrawOpen}
          onSuccess={() => {}}
        />
      )}
    </EarningsPageShell>
  )
}

function getPendingBonusPanelKey(
  period: CreatorEarningsPeriod,
  pendingBonuses: {
    next_cursor?: string | null
    has_more: boolean
    items: Array<{ id: string }>
  },
) {
  return [
    period,
    pendingBonuses.next_cursor ?? '',
    String(pendingBonuses.has_more),
    pendingBonuses.items.map((item) => item.id).join('|'),
  ].join(':')
}

interface EarningsPageShellProps {
  period: CreatorEarningsPeriod
  onPeriodChange: (period: CreatorEarningsPeriod) => void
  children?: ReactNode
}

function EarningsPageShell({
  period,
  onPeriodChange,
  children,
}: EarningsPageShellProps) {
  return (
    <div className="h-full overflow-y-auto bg-background p-6 text-foreground sm:p-8 pb-mobile-nav">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              <Trans>Ganancias</Trans>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              <Trans>Seguí tus pagos pendientes</Trans>
            </p>
          </div>
          <EarningsPeriodControl value={period} onChange={onPeriodChange} />
        </header>

        {children ?? <EarningsSkeleton />}
      </div>
    </div>
  )
}

function EarningsSkeleton() {
  return (
    <>
      <section
        aria-label={t`Loading earnings KPIs`}
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
      >
        {EARNINGS_KPI_SKELETON_IDS.map((skeletonId) => (
          <div
            key={skeletonId}
            className="h-[118px] animate-pulse rounded-2xl border border-border bg-card"
          />
        ))}
      </section>
      <div className="h-[354px] animate-pulse rounded-2xl border border-border bg-card" />
    </>
  )
}
