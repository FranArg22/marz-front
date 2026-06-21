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
  starter: () => t`LO ESENCIAL`,
  growth: () => t`PARA EQUIPOS DE GROWTH`,
  scale: () => t`ALTO VOLUMEN`,
}

const PLAN_NAME: Record<BillingPlanIdentifier, () => string> = {
  starter: () => t`Starter`,
  growth: () => t`Growth`,
  scale: () => t`Scale`,
}

const PLAN_DESCRIPTION: Record<BillingPlanIdentifier, () => string> = {
  starter: () => t`Accedé a la red de creadores y lanzá tu primera campaña.`,
  growth: () => t`Para equipos que usan creadores como canal de performance.`,
  scale: () => t`Para equipos con +$5K/mes en creadores que necesitan volumen.`,
}

type PlanStats = {
  campaigns: string
  hires: string
  invites: string
}

const PLAN_STATS: Record<BillingPlanIdentifier, () => PlanStats> = {
  starter: () => ({
    campaigns: '1',
    hires: '5',
    invites: t`30/mes`,
  }),
  growth: () => ({
    campaigns: '3',
    hires: '15',
    invites: t`100/mes`,
  }),
  scale: () => ({
    campaigns: t`Ilimitadas`,
    hires: t`Ilimitados`,
    invites: t`Ilimitadas`,
  }),
}

const PLAN_FEATURES: Record<BillingPlanIdentifier, () => string[]> = {
  starter: () => [
    t`Acceso a la red de creadores de Marz`,
    t`Pagos a creadores automáticos`,
    t`Métricas de los últimos 30 días`,
    t`Soporte por email`,
  ],
  growth: () => [
    t`Acceso a la red de creadores de Marz`,
    t`Pagos a creadores automáticos`,
    t`Métricas de los últimos 90 días`,
    t`Soporte por email y Whatsapp`,
  ],
  scale: () => [
    t`Acceso a la red de creadores de Marz`,
    t`Pagos a creadores automáticos`,
    t`Métricas ilimitadas`,
    t`Soporte con Account manager`,
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
  ctaDisabled?: boolean
}

export function PlanCard({
  plan,
  interval,
  amountUsd,
  selected,
  onSelect,
  highlightLabel,
  onCta,
  ctaDisabled = false,
}: PlanCardProps) {
  const intervalLabel = t`/mes`
  const displayAmount = interval === 'year' ? amountUsd / 12 : amountUsd

  const stats = PLAN_STATS[plan]()
  const features = PLAN_FEATURES[plan]()
  const ctaLabel = t`Probar 7 días gratis`
  const isUnlimited = plan === 'scale'

  const inputId = `plan-radio-${plan}-${interval}`
  const isRecommended = Boolean(highlightLabel)

  return (
    <div className="relative w-[260px]">
      {isRecommended ? (
        <span
          aria-hidden
          className="wizard-plan-glow pointer-events-none absolute -inset-3 -z-10 rounded-[var(--radius-xl)] bg-primary/25 blur-2xl"
        />
      ) : null}
      <div
        className={cn(
          'relative flex w-full flex-col gap-4 rounded-[var(--radius-xl)] border bg-card p-6 text-left transition-colors',
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
            <span className="wizard-dot-beat size-[5px] rounded-full bg-primary" />
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
            <span className="text-[36px] font-bold leading-none tracking-tight text-foreground">
              {priceFormatter.format(displayAmount)}
            </span>
            <span className="pb-1 text-[12px] font-medium text-muted-foreground">
              {intervalLabel}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-[11px] leading-normal text-muted-foreground">
          {PLAN_DESCRIPTION[plan]()}
        </p>

        {/* CTA button */}
        <button
          type="button"
          disabled={ctaDisabled}
          onClick={(e) => {
            e.stopPropagation()
            onCta()
          }}
          className={cn(
            'flex h-10 w-full items-center justify-center rounded-[var(--radius-md)] text-[12px] font-semibold transition-colors',
            ctaDisabled
              ? 'cursor-not-allowed opacity-60'
              : isRecommended
                ? 'wizard-cta-beat bg-primary text-primary-foreground hover:bg-primary/90'
                : selected
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-foreground text-background hover:bg-foreground/90',
          )}
        >
          {ctaLabel}
        </button>

        {/* Stats — single column, 3 rows */}
        <div className="flex w-full flex-col gap-1.5">
          <div className="flex flex-col gap-0.5 rounded-[var(--radius-sm)] bg-muted p-2">
            <span className="text-[9px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              <Trans>CAMPAÑAS</Trans>
            </span>
            <span
              className={cn(
                'text-[14px] font-semibold',
                isUnlimited ? 'text-primary' : 'text-foreground',
              )}
            >
              {stats.campaigns}
            </span>
          </div>
          <div className="flex flex-col gap-0.5 rounded-[var(--radius-sm)] bg-muted p-2">
            <span className="text-[9px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              <Trans>CREADORES</Trans>
            </span>
            <div className="flex items-baseline gap-1.5">
              <span
                className={cn(
                  'text-[14px] font-bold',
                  isUnlimited ? 'text-primary' : 'text-foreground',
                )}
              >
                {stats.hires}
              </span>
              <span className="text-[12px] font-medium text-muted-foreground">
                <Trans>trabajando a la vez</Trans>
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-0.5 rounded-[var(--radius-sm)] bg-muted p-2">
            <span className="text-[9px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              <Trans>INVITACIONES DE CONEXIÓN</Trans>
            </span>
            <span
              className={cn(
                'text-[14px] font-semibold',
                isUnlimited ? 'text-primary' : 'text-foreground',
              )}
            >
              {stats.invites}
            </span>
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
    </div>
  )
}
