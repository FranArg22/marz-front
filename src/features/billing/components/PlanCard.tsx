import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { CheckIcon } from 'lucide-react'
import { cn } from '#/lib/utils'
import type { BillingInterval } from '#/shared/api/generated/model/billingInterval'
import type { BillingPlanIdentifier } from '#/shared/api/generated/model/billingPlanIdentifier'

const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  maximumFractionDigits: 0,
})

const PLAN_BADGE: Record<BillingPlanIdentifier, () => string> = {
  starter: () => t`ESSENTIALS`,
  growth: () => t`FOR GROWTH TEAMS`,
  scale: () => t`HIGH VOLUME`,
}

const PLAN_NAME: Record<BillingPlanIdentifier, () => string> = {
  starter: () => t`Starter`,
  growth: () => t`Growth`,
  scale: () => t`Scale`,
}

const PLAN_DESCRIPTION: Record<BillingPlanIdentifier, () => string> = {
  starter: () => t`Accedé a la red de creadores de Marz.`,
  growth: () =>
    t`El plan que eligen equipos que miden creadores como canal performance.`,
  scale: () => t`Para equipos que gastan $10K+/mes y necesitan control total.`,
}

type PlanStats = {
  campaigns: string
  hires: string
  invites: string
  payouts: string
}

const PLAN_STATS: Record<BillingPlanIdentifier, () => PlanStats> = {
  starter: () => ({
    campaigns: '1',
    hires: '5',
    invites: t`30/mes`,
    payouts: t`24h`,
  }),
  growth: () => ({
    campaigns: '3',
    hires: '15',
    invites: t`100/mes`,
    payouts: t`24h`,
  }),
  scale: () => ({
    campaigns: '∞',
    hires: '∞',
    invites: '∞',
    payouts: t`24h`,
  }),
}

const PLAN_FEATURES: Record<BillingPlanIdentifier, () => string[]> = {
  starter: () => [
    t`Red de creadores`,
    t`AI matching + outreach`,
    t`Script Lab básico`,
    t`Payouts automáticos 24h`,
    t`Métricas 30 días`,
    t`Soporte por email`,
  ],
  growth: () => [
    t`Todo lo de Starter, +:`,
    t`Script Lab completo`,
    t`A/B testing`,
    t`Content review workflow`,
    t`Reasignación automática`,
    t`Métricas ilimitadas`,
  ],
  scale: () => [
    t`Todo lo de Growth, +:`,
    t`Account manager dedicado`,
    t`Attribution / ROAS`,
    t`Reportes custom`,
    t`Soporte 24/7`,
    t`Acceso API`,
  ],
}

interface PlanCardProps {
  plan: BillingPlanIdentifier
  interval: BillingInterval
  amountUsd: number
  selected: boolean
  onSelect: () => void
  highlightLabel?: string
  onCta: () => void
}

export function PlanCard({
  plan,
  interval,
  amountUsd,
  selected,
  onSelect,
  highlightLabel,
  onCta,
}: PlanCardProps) {
  const intervalLabel = interval === 'year' ? t`/mo · anual` : t`/mo`

  const stats = PLAN_STATS[plan]()
  const features = PLAN_FEATURES[plan]()
  const ctaLabel = t`Probar 7 días gratis`

  const inputId = `plan-radio-${plan}-${interval}`

  return (
    <div
      className={cn(
        'relative flex w-[260px] flex-col gap-[18px] rounded-[var(--radius-xl)] border bg-card p-6 text-left transition-colors',
        selected
          ? 'border-primary'
          : 'border-border hover:border-foreground/30',
      )}
    >
      <input
        type="radio"
        id={inputId}
        name="billing-plan"
        value={plan}
        checked={selected}
        onChange={onSelect}
        aria-label={PLAN_NAME[plan]()}
        className="sr-only"
      />
      {highlightLabel ? (
        <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 rounded-full border border-primary bg-background px-3.5 py-1 text-[10px] font-semibold tracking-[0.08em] text-primary whitespace-nowrap">
          <span className="size-[5px] rounded-full bg-primary" />
          {highlightLabel}
        </span>
      ) : null}

      {/* Top: badge + name */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[9px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          {PLAN_BADGE[plan]()}
        </span>
        <span className="text-[18px] font-bold leading-none text-foreground">
          {PLAN_NAME[plan]()}
        </span>
      </div>

      {/* Price */}
      <div className="flex flex-col gap-1">
        <div className="flex items-end gap-0.5">
          <span className="text-[18px] font-bold text-foreground">$</span>
          <span className="text-[40px] font-bold leading-none tracking-tight text-foreground">
            {priceFormatter.format(amountUsd)}
          </span>
          <span className="pb-1 text-[12px] font-medium text-muted-foreground">
            {intervalLabel}
          </span>
        </div>
        <span className="text-[11px] font-medium text-primary">
          <Trans>Sin take rate</Trans>
        </span>
      </div>

      {/* Description */}
      <p className="text-[11px] leading-normal text-muted-foreground">
        {PLAN_DESCRIPTION[plan]()}
      </p>

      {/* CTA button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onCta()
        }}
        className={cn(
          'flex h-10 w-full items-center justify-center rounded-[var(--radius-md)] text-[12px] font-semibold transition-colors',
          selected
            ? 'bg-primary text-primary-foreground'
            : 'border border-[var(--border-strong)] bg-card text-foreground hover:bg-muted',
        )}
      >
        {ctaLabel}
      </button>

      {/* Stats 2x2 grid */}
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex gap-1.5">
          <div className="flex flex-1 flex-col gap-0.5 rounded-[var(--radius-sm)] bg-muted p-2.5">
            <span className="text-[9px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              <Trans>CAMPAÑAS</Trans>
            </span>
            <span
              className={cn(
                'text-[14px] font-bold',
                stats.campaigns === '∞' ? 'text-primary' : 'text-foreground',
              )}
            >
              {stats.campaigns}
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-0.5 rounded-[var(--radius-sm)] bg-muted p-2.5">
            <span className="text-[9px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              <Trans>HIRES</Trans>
            </span>
            <span
              className={cn(
                'text-[14px] font-bold',
                stats.hires === '∞' ? 'text-primary' : 'text-foreground',
              )}
            >
              {stats.hires}
            </span>
          </div>
        </div>
        <div className="flex gap-1.5">
          <div className="flex flex-1 flex-col gap-0.5 rounded-[var(--radius-sm)] bg-muted p-2.5">
            <span className="text-[9px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              <Trans>INVITES</Trans>
            </span>
            <span
              className={cn(
                'text-[14px] font-bold',
                stats.invites === '∞' ? 'text-primary' : 'text-foreground',
              )}
            >
              {stats.invites}
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-0.5 rounded-[var(--radius-sm)] bg-muted p-2.5">
            <span className="text-[9px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              <Trans>PAYOUTS</Trans>
            </span>
            <span className="text-[14px] font-bold text-foreground">
              {stats.payouts}
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-border" />

      {/* Features list */}
      <div className="flex flex-col gap-[7px]">
        <span className="text-[9px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          <Trans>INCLUYE</Trans>
        </span>
        {features.map((feature) => (
          <div key={feature} className="flex items-start gap-2">
            <CheckIcon className="mt-px size-3 shrink-0 text-primary" />
            <span className="text-[11px] leading-normal text-muted-foreground">
              {feature}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
