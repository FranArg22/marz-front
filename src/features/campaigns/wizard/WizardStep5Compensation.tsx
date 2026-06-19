import { useEffect } from 'react'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { BadgeDollarSign, Gift, RefreshCw } from 'lucide-react'

import { Switch } from '#/components/ui/switch'
import { Textarea } from '#/components/ui/textarea'
import { cn } from '#/lib/utils'
import { CampaignCompensationType } from '#/shared/api/generated/model/campaignCompensationType'
import { useCampaignWizardStore } from './store'

export function WizardStep5Compensation() {
  const step5 = useCampaignWizardStore((state) => state.step5)
  const setStep5 = useCampaignWizardStore((state) => state.setStep5)
  const compensationOptions = [
    {
      value: CampaignCompensationType.payment,
      label: t`Pago monetario`,
      description: t`La campaña compensa a creators con un pago fijo.`,
      Icon: BadgeDollarSign,
      disabled: false,
    },
    {
      value: CampaignCompensationType.product_trade,
      label: t`Canje de producto`,
      description: t`La marca entrega producto como compensación principal.`,
      Icon: Gift,
      disabled: true,
    },
    {
      value: CampaignCompensationType.payment_plus_product,
      label: t`Pago + canje`,
      description: t`La compensación combina pago monetario y producto.`,
      Icon: RefreshCw,
      disabled: true,
    },
  ]

  useEffect(() => {
    if (step5.compensation_type === null) {
      setStep5({ compensation_type: CampaignCompensationType.payment })
    }
  }, [setStep5, step5.compensation_type])

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">
          <Trans>Definí la compensación</Trans>
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          <Trans>
            Configurá cómo se compensará a los creators de esta campaña.
          </Trans>
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-foreground">
          <Trans>Tipo de compensación</Trans>
        </h2>
        <div
          role="radiogroup"
          aria-label={t`Tipo de compensación`}
          className="grid gap-4 md:grid-cols-3"
        >
          {compensationOptions.map(
            ({ value, label, description, Icon, disabled }) => {
              const selected = step5.compensation_type === value

              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={disabled}
                  onClick={() => setStep5({ compensation_type: value })}
                  className={cn(
                    'flex min-h-44 flex-col items-start gap-4 rounded-lg border bg-card p-5 text-left transition-colors',
                    selected
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:bg-surface-hover',
                    disabled &&
                      'pointer-events-none cursor-not-allowed opacity-60 hover:bg-card',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-10 items-center justify-center rounded-md',
                      selected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground',
                      disabled && 'text-muted-foreground',
                    )}
                  >
                    <Icon aria-hidden="true" />
                  </span>
                  <span className="flex flex-col gap-3">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-semibold text-foreground">
                        {label}
                      </span>
                      {disabled ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          <Trans>Próximamente</Trans>
                        </span>
                      ) : null}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {description}
                    </span>
                  </span>
                </button>
              )
            },
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-3">
          <label
            htmlFor="compensation-notes"
            className="text-sm font-semibold text-foreground"
          >
            <Trans>Notas de compensación</Trans>
          </label>
          <Textarea
            id="compensation-notes"
            value={step5.compensation_notes}
            onChange={(event) =>
              setStep5({ compensation_notes: event.target.value })
            }
            placeholder={t`Agregá detalles opcionales sobre pagos, condiciones o aclaraciones.`}
            className="min-h-28 resize-y"
          />
        </div>

        <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card p-5">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="video-reuse-permission-default"
              className="text-sm font-semibold text-foreground"
            >
              <Trans>Reutilización de video</Trans>
            </label>
            <p className="max-w-2xl text-sm text-muted-foreground">
              <Trans>
                Activá este permiso si la marca podrá reutilizar los videos por
                defecto.
              </Trans>
            </p>
          </div>
          <Switch
            id="video-reuse-permission-default"
            aria-label={t`Reutilización de video`}
            checked={step5.video_reuse_permission_default}
            onCheckedChange={(video_reuse_permission_default) =>
              setStep5({ video_reuse_permission_default })
            }
          />
        </div>
      </div>
    </section>
  )
}
