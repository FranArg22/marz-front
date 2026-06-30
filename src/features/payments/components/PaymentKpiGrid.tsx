import { t } from '@lingui/core/macro'
import { CircleDollarSign, Clock3, Send, WalletCards } from 'lucide-react'

import type {
  BrandPaymentsStageBreakdown,
  BrandPaymentsSummary,
} from '../api/brandPaymentsSchemas'
import { formatUsd } from './paymentFormatting'

interface PaymentKpiGridProps {
  summary: BrandPaymentsSummary
  stageBreakdown: BrandPaymentsStageBreakdown[]
}

export function PaymentKpiGrid({
  summary,
  stageBreakdown,
}: PaymentKpiGridProps) {
  const committedAmount =
    stageBreakdown.find((stage) => stage.stage === 'committed')?.amount ?? '0'
  const kpis = [
    {
      key: 'total_spent',
      label: t`Gasto total`,
      value: formatUsd(summary.total_spent),
      detail: t`Todos los pagos históricos`,
      Icon: CircleDollarSign,
    },
    {
      key: 'period_spend',
      label: t`Gasto del período`,
      value: formatUsd(summary.period_spend),
      detail: t`Según el periodo seleccionado`,
      Icon: WalletCards,
    },
    {
      key: 'in_progress',
      label: t`Ofertas en curso`,
      value: formatUsd(committedAmount),
      detail: t`Aceptadas, pendientes de pago`,
      Icon: Clock3,
    },
    {
      key: 'pending_offers',
      label: t`Ofertas enviadas`,
      value: String(summary.pending_offers.count),
      detail: formatUsd(summary.pending_offers.amount),
      Icon: Send,
    },
  ]

  return (
    <section
      aria-label={t`KPIs de pagos`}
      className="grid grid-cols-2 gap-4 md:grid-cols-4"
    >
      {kpis.map(({ key, label, value, detail, Icon }) => (
        <article
          key={key}
          className="min-w-0 rounded-lg border border-border bg-card p-5"
        >
          <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Icon className="size-4 text-muted-foreground" aria-hidden />
            <span>{label}</span>
          </div>
          <div className="text-3xl font-bold tracking-tight text-foreground">
            {value}
          </div>
          <p className="mt-2 truncate text-xs text-muted-foreground">
            {detail}
          </p>
        </article>
      ))}
    </section>
  )
}
