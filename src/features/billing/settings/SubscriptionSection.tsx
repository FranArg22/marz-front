import { t } from '@lingui/core/macro'

export function SubscriptionSection() {
  return (
    <div className="rounded-lg border border-border bg-card p-6 text-card-foreground">
      <h2 className="text-lg font-semibold">{t`Suscripción`}</h2>
    </div>
  )
}
