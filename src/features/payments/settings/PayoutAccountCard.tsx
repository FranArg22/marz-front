import type { ReactNode } from 'react'
import { t } from '@lingui/core/macro'
import {
  CheckCircle2,
  CircleAlert,
  Landmark,
  Pencil,
  Smartphone,
} from 'lucide-react'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import type { PayoutAccount } from '#/shared/api/generated/model'
import { COUNTRIES } from '#/features/identity/onboarding/creator/countries'

import {
  SettingsCard,
  SettingsRow,
} from '#/features/identity/settings/SettingsCard'

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
      <div className="space-y-6">
        <SettingsCard
          title={t`Cuenta de cobro`}
          description={t`Guardá los datos donde querés recibir tus transferencias.`}
        >
          <div className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <CircleAlert
                className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {t`Todavía no hay una cuenta cargada`}
                </p>
                <p className="max-w-xl text-sm text-muted-foreground">
                  {t`Usá Agregar cuenta para abrir el formulario. Esta vista no muestra saldos ni movimientos.`}
                </p>
              </div>
            </div>
            <Button type="button" className="shrink-0" onClick={onEdit}>
              {t`Agregar cuenta`}
            </Button>
          </div>
        </SettingsCard>

        <SettingsCard
          title={t`Qué datos puede cargar`}
          description={t`Aceptá una cuenta bancaria tradicional o una cuenta externa como Wise, Payoneer, Mercado Pago u otra app similar.`}
        >
          <DataTypeRow
            icon={
              <Landmark
                className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                aria-hidden
              />
            }
            title={t`Cuenta bancaria`}
            description={t`Titular, banco, país, moneda y CBU/IBAN/número de cuenta.`}
          />
          <DataTypeRow
            icon={
              <Smartphone
                className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                aria-hidden
              />
            }
            title={t`App de cobro`}
            description={t`Proveedor, email o identificador de cuenta y moneda de recepción.`}
          />
        </SettingsCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SettingsCard
        title={t`Cuenta de cobro`}
        description={t`La cuenta cargada se usa para coordinar pagos manuales. Esta vista no muestra saldos ni movimientos.`}
      >
        <div className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <CheckCircle2
              className="mt-0.5 size-5 shrink-0 text-primary"
              aria-hidden
            />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {t`Cuenta cargada`}
              </p>
              <p className="text-sm text-muted-foreground">
                {accountSummary(account)}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="shrink-0"
            onClick={onEdit}
          >
            <Pencil className="size-4" aria-hidden />
            {t`Editar cuenta`}
          </Button>
        </div>
      </SettingsCard>

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <header className="flex items-start justify-between gap-3 px-6 py-5">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {account.provider_name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t`Cuenta externa en USD configurada para pagos manuales.`}
            </p>
          </div>
          <Badge variant="secondary" className="mt-0.5 shrink-0">
            {t`Activa`}
          </Badge>
        </header>
        <div className="divide-y divide-border border-t border-border">
          <PayoutAccountDetail label={t`Titular`} value={account.holder_name} />
          <PayoutAccountDetail
            label={t`Identificador`}
            value={account.identifier}
          />
          <PayoutAccountDetail
            label={t`País / moneda`}
            value={formatCountryCurrency(account.country)}
          />
        </div>
      </section>
    </div>
  )
}

function DataTypeRow({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3 px-6 py-4">
      {icon}
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function PayoutAccountCardSkeleton() {
  return (
    <div
      className="rounded-2xl border border-border bg-card p-6"
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
    <SettingsRow label={label}>
      <p className="break-words text-sm font-medium text-foreground md:text-right">
        {value}
      </p>
    </SettingsRow>
  )
}

function accountSummary(account: PayoutAccount) {
  return [account.provider_name, account.identifier, t`USD`]
    .filter(Boolean)
    .join(' · ')
}

function formatCountryCurrency(country: string) {
  const match = COUNTRIES.find((item) => item.code === country.toUpperCase())
  const name = match ? match.name : country.toUpperCase()
  return `${name} · ${t`USD`}`
}
