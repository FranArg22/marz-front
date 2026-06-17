import { t } from '@lingui/core/macro'

export function GeneralSection() {
  return (
    <div className="rounded-lg border border-border bg-card p-6 text-card-foreground">
      <h2 className="text-lg font-semibold">{t`General`}</h2>
    </div>
  )
}
