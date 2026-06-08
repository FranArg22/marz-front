import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { BadgeDollarSign, Eye } from 'lucide-react'

import { cn } from '#/lib/utils'
import { useCampaignWizardStore } from './store'

export function WizardStep2PricingModel() {
  const pricingModel = useCampaignWizardStore(
    (state) => state.step2.pricing_model,
  )
  const setStep2 = useCampaignWizardStore((state) => state.setStep2)
  const payPerPostSelected = pricingModel === 'pay_per_post'

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">
          <Trans>Elegí el modelo de pricing</Trans>
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          <Trans>Seleccioná cómo se va a pagar la campaña.</Trans>
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label={t`Modelo de pricing`}
        className="grid gap-4 md:grid-cols-2"
      >
        <button
          type="button"
          role="radio"
          aria-checked={payPerPostSelected}
          onClick={() => setStep2({ pricing_model: 'pay_per_post' })}
          className={cn(
            'flex min-h-44 flex-col items-start gap-4 rounded-lg border bg-card p-5 text-left transition-colors',
            payPerPostSelected
              ? 'border-primary ring-2 ring-primary/20'
              : 'border-border hover:bg-surface-hover',
          )}
        >
          <span
            className={cn(
              'flex size-10 items-center justify-center rounded-md',
              payPerPostSelected
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground',
            )}
          >
            <BadgeDollarSign aria-hidden="true" />
          </span>
          <span className="flex flex-col gap-1">
            <span className="text-base font-semibold text-foreground">
              <Trans>Pay per post</Trans>
            </span>
            <span className="text-sm text-muted-foreground">
              <Trans>Pagás un monto fijo por cada publicación aprobada.</Trans>
            </span>
          </span>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked="false"
          disabled
          className="pointer-events-none flex min-h-44 cursor-not-allowed flex-col items-start gap-4 rounded-lg border border-border bg-card p-5 text-left opacity-60"
        >
          <span className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Eye aria-hidden="true" />
          </span>
          <span className="flex flex-col gap-3">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold text-foreground">
                <Trans>CPM (por 1000 views)</Trans>
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                <Trans>Próximamente</Trans>
              </span>
            </span>
            <span className="text-sm text-muted-foreground">
              <Trans>Pagás según el volumen de views alcanzado.</Trans>
            </span>
          </span>
        </button>
      </div>
    </section>
  )
}
