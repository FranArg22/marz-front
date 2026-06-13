import { t } from '@lingui/core/macro'
import { CreditCard, Plus } from 'lucide-react'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import type { PayoutAccount } from '#/shared/api/generated/model'
import { COUNTRIES } from '#/features/identity/onboarding/creator/countries'

interface PayoutAccountCardProps {
  account: PayoutAccount | null
  isLoading: boolean
  onEdit: () => void
}

export function PayoutAccountCard({
  account,
  isLoading,
  onEdit,
}: PayoutAccountCardProps) {
  if (isLoading) return <PayoutAccountCardSkeleton />

  if (!account) {
    return (
      <div className="rounded-md border border-dashed border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
              <CreditCard className="size-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-foreground">
                {t`Cuenta de cobro`}
              </h2>
              <p className="max-w-xl text-sm text-muted-foreground">
                {t`Agregá una cuenta bancaria o billetera virtual para recibir tus pagos.`}
              </p>
            </div>
          </div>
          <Button type="button" onClick={onEdit}>
            <Plus className="size-4" aria-hidden />
            {t`Agregar cuenta de cobro`}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-md border border-border bg-card p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">
              {t`Cuenta de cobro`}
            </h2>
            <Badge variant="secondary">{t`Activa`}</Badge>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            <PayoutAccountDetail
              label={t`Tipo`}
              value={formatAccountType(account.account_type)}
            />
            <PayoutAccountDetail
              label={t`Titular`}
              value={account.holder_name}
            />
            <PayoutAccountDetail
              label={t`Banco o proveedor`}
              value={account.provider_name}
            />
            <PayoutAccountDetail
              label={t`Identificador`}
              value={maskIdentifier(account.identifier)}
            />
            <PayoutAccountDetail
              label={t`País`}
              value={formatCountry(account.country)}
            />
          </dl>
        </div>
        <Button type="button" variant="outline" onClick={onEdit}>
          {t`Editar`}
        </Button>
      </div>
    </div>
  )
}

function PayoutAccountCardSkeleton() {
  return (
    <div
      className="rounded-md border border-border bg-card p-6"
      aria-label={t`Cargando cuenta de cobro`}
    >
      <div className="space-y-4">
        <div className="h-5 w-40 animate-pulse rounded-md bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-11 animate-pulse rounded-md bg-muted" />
          <div className="h-11 animate-pulse rounded-md bg-muted" />
          <div className="h-11 animate-pulse rounded-md bg-muted" />
          <div className="h-11 animate-pulse rounded-md bg-muted" />
        </div>
      </div>
    </div>
  )
}

function PayoutAccountDetail({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm text-foreground">{value}</dd>
    </div>
  )
}

function formatAccountType(type: PayoutAccount['account_type']) {
  return type === 'bank' ? t`Banco` : t`Aplicación o billetera virtual`
}

function formatCountry(country: string) {
  const match = COUNTRIES.find((item) => item.code === country.toUpperCase())
  return match ? `${match.name} (${match.code})` : country.toUpperCase()
}

function maskIdentifier(identifier: string) {
  const trimmed = identifier.trim()
  if (trimmed.length <= 4) return `****${trimmed}`
  return `****${trimmed.slice(-4)}`
}
