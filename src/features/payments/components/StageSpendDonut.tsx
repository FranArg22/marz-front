import { t } from '@lingui/core/macro'

import type { BrandPaymentsStageBreakdown } from '../api/brandPaymentsSchemas'
import {
  formatCompactUsd,
  formatUsd,
  parsePaymentAmount,
} from './paymentFormatting'

interface StageSpendDonutProps {
  data: BrandPaymentsStageBreakdown[]
}

/* eslint-disable lingui/no-unlocalized-strings -- CSS variable tokens are not translatable UI copy. */
const stageColors: Record<BrandPaymentsStageBreakdown['stage'], string> = {
  pending_acceptance: 'var(--chart-1)',
  committed: 'var(--chart-2)',
  paid: 'var(--chart-3)',
}
/* eslint-enable lingui/no-unlocalized-strings */

const radius = 54
const circumference = 2 * Math.PI * radius

export function StageSpendDonut({ data }: StageSpendDonutProps) {
  const total = data.reduce(
    (sum, item) => sum + parsePaymentAmount(item.amount),
    0,
  )

  let offset = 0

  return (
    <section
      aria-label={t`Distribución de gasto por etapa en USD`}
      className="flex h-[300px] w-full shrink-0 flex-col rounded-lg border border-border bg-card p-5 md:w-[480px]"
    >
      <div>
        <h2 className="text-sm font-semibold text-foreground">
          {t`Gasto por etapa`}
        </h2>
        <p className="hidden text-xs text-muted-foreground md:block">
          {t`Distribución del gasto según la etapa de cada oferta`}
        </p>
      </div>

      <p className="sr-only">
        {data
          .map(
            (item) =>
              `${getStageLabel(item.stage)} ${formatUsd(item.amount)} ${getPercentage(item.amount, total)}%`,
          )
          .join(', ')}
      </p>

      <div className="mt-4 flex min-h-0 flex-1 items-center gap-5">
        <div className="relative flex size-40 shrink-0 items-center justify-center">
          <svg aria-hidden viewBox="0 0 140 140" className="size-40 -rotate-90">
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="var(--muted)"
              strokeWidth="20"
            />
            {data.map((item) => {
              const percentage = getPercentage(item.amount, total)
              const segmentLength = (percentage / 100) * circumference
              const dashOffset = offset
              offset += segmentLength

              return (
                <circle
                  key={item.stage}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke={stageColors[item.stage]}
                  strokeWidth="20"
                  strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                  strokeDashoffset={-dashOffset}
                  strokeLinecap="butt"
                />
              )
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold tracking-tight text-foreground">
              {formatCompactUsd(total)}
            </span>
            <span className="text-xs text-muted-foreground">total</span>
          </div>
        </div>

        <ul className="min-w-0 flex-1 space-y-2">
          {data.map((item) => (
            <li key={item.stage} className="flex items-center gap-2 text-xs">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: stageColors[item.stage] }}
              />
              <span className="min-w-0 flex-1 truncate text-foreground">
                {getStageLabel(item.stage)}
              </span>
              <span className="font-mono font-semibold text-foreground">
                {formatCompactUsd(item.amount)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function getStageLabel(stage: BrandPaymentsStageBreakdown['stage']): string {
  switch (stage) {
    case 'pending_acceptance':
      return t`Pendiente de aceptar`
    case 'committed':
      return t`Comprometido`
    case 'paid':
      return t`Pagado`
  }
}

function getPercentage(amount: string, total: number): number {
  if (total <= 0) return 0
  return (parsePaymentAmount(amount) / total) * 100
}
