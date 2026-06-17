import { AlertTriangle } from 'lucide-react'
import { t } from '@lingui/core/macro'
import { useMemo } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import type { PlanUsageInvitations } from '#/shared/api/generated/model/planUsageInvitations'
import type { PlanUsageMetric } from '#/shared/api/generated/model/planUsageMetric'
import type { PlanUsageResponse } from '#/shared/api/generated/model/planUsageResponse'

const resetDateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

interface PlanUsageCardProps {
  usage: PlanUsageResponse
}

export function PlanUsageCard({ usage }: PlanUsageCardProps) {
  const resetLabel = useMemo(() => {
    const resetAt = usage.invitations.cycle_resets_at
    if (!resetAt) return null
    return resetDateFormatter.format(new Date(resetAt))
  }, [usage.invitations.cycle_resets_at])

  return (
    <Card className="gap-0 overflow-hidden rounded-2xl py-0 shadow-none">
      <CardHeader className="gap-1 px-6 pt-6 pb-0">
        <CardTitle className="text-[15px] leading-normal font-semibold">
          {t`Uso`}
        </CardTitle>
        <p className="text-xs leading-normal text-muted-foreground">
          {t`Seguimiento de límites incluidos en tu suscripción actual.`}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 p-6">
        <div className="grid gap-3 md:grid-cols-3">
          <UsageMiniCard
            testId="plan-usage.campaigns"
            label={t`Campañas activas`}
            metric={usage.campaigns_active}
          />
          <UsageMiniCard
            testId="plan-usage.creators"
            label={t`Creadores activos`}
            metric={usage.creators_active}
          />
          <UsageMiniCard
            testId="plan-usage.invitations"
            label={t`Invitaciones`}
            metric={usage.invitations}
            resetLabel={resetLabel}
          />
        </div>
      </CardContent>
    </Card>
  )
}

interface UsageMiniCardProps {
  testId: string
  label: string
  metric: PlanUsageMetric | PlanUsageInvitations
  resetLabel?: string | null
}

function UsageMiniCard({
  testId,
  label,
  metric,
  resetLabel,
}: UsageMiniCardProps) {
  const current = metric.current ?? 0
  const limit = metric.limit ?? null

  if (!metric.available) {
    return (
      <div
        data-testid={testId}
        className="flex min-h-32 flex-col gap-2 rounded-lg border border-border bg-muted p-4"
      >
        <div className="flex items-center gap-2 font-mono text-sm font-semibold text-destructive">
          <AlertTriangle aria-hidden="true" className="size-4" />
          <span>{t`No disponible`}</span>
        </div>
        <span className="font-mono text-[11px] leading-normal font-medium text-muted-foreground">
          {label}
        </span>
      </div>
    )
  }

  if (limit === null) {
    return (
      <div
        data-testid={testId}
        className="flex min-h-32 flex-col gap-2 rounded-lg border border-border bg-muted p-4"
      >
        <span className="font-mono text-lg leading-normal font-semibold text-foreground">
          {current} {t`de`} ∞
        </span>
        <span className="font-mono text-[11px] leading-normal font-medium text-muted-foreground">
          {label}
        </span>
        <ResetSublabel resetLabel={resetLabel} />
      </div>
    )
  }

  if (limit === 0) {
    return (
      <div
        data-testid={testId}
        className="flex min-h-32 flex-col gap-2 rounded-lg border border-border bg-muted p-4"
      >
        <span className="font-mono text-lg leading-normal font-semibold text-foreground">
          {t`N/A`}
        </span>
        <span className="font-mono text-[11px] leading-normal font-medium text-muted-foreground">
          {label}
        </span>
        <ResetSublabel resetLabel={resetLabel} />
      </div>
    )
  }

  const progress = Math.min(100, Math.max(0, (current / limit) * 100))

  return (
    <div
      data-testid={testId}
      className="flex min-h-32 flex-col gap-2 rounded-lg border border-border bg-muted p-4"
    >
      <span className="font-mono text-lg leading-normal font-semibold text-foreground">
        {current} {t`de`} {limit}
      </span>
      <span className="font-mono text-[11px] leading-normal font-medium text-muted-foreground">
        {label}
      </span>
      <ResetSublabel resetLabel={resetLabel} />
      <div className="mt-auto flex items-center gap-2">
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-background"
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-valuenow={current}
        >
          <div
            className="h-full rounded-full bg-foreground"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="shrink-0 font-mono text-[11px] leading-normal font-semibold text-muted-foreground">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  )
}

function ResetSublabel({ resetLabel }: { resetLabel?: string | null }) {
  if (!resetLabel) return null

  return (
    <span className="font-mono text-[11px] leading-normal font-medium text-muted-foreground">
      {t`Reinicia el ${resetLabel}`}
    </span>
  )
}
