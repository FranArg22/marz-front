import { t } from '@lingui/core/macro'
import {
  CheckCircle2,
  CircleAlert,
  FileText,
  Landmark,
  Pencil,
} from 'lucide-react'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import type { PayoutAccount } from '#/shared/api/generated/model'

import {
  SettingsCard,
  SettingsRow,
} from '#/features/identity/settings/SettingsCard'

interface PayoutAccountCardProps {
  account: PayoutAccount | null
  isLoading: boolean
  onEdit: () => void
}

const ACCOUNT_TYPE_LABELS: Record<PayoutAccount['account_type'], () => string> =
  {
    checking: () => t`Checking`,
    savings: () => t`Savings`,
    business: () => t`Business`,
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
          description={t`Guardá los datos donde querés recibir tus transferencias ACH.`}
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
              </div>
            </div>
            <Button type="button" className="shrink-0" onClick={onEdit}>
              {t`Agregar cuenta`}
            </Button>
          </div>
        </SettingsCard>

        <SettingsCard
          title={t`Qué datos puede cargar`}
          description={t`Por ahora solo aceptamos cuentas bancarias de Estados Unidos vía transferencia ACH.`}
        >
          <div className="flex items-start gap-3 px-6 py-4">
            <Landmark
              className="mt-0.5 size-5 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {t`Cuenta bancaria (ACH)`}
              </p>
              <p className="text-sm text-muted-foreground">
                {t`Nombre de la cuenta, titular, número de cuenta, tipo, routing number y dirección.`}
              </p>
            </div>
          </div>
        </SettingsCard>

        <W8BenCard />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SettingsCard
        title={t`Cuenta de cobro`}
        description={t`La cuenta cargada se usa para coordinar pagos manuales.`}
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
              {account.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t`Cuenta bancaria de EE. UU. (ACH) en USD para pagos manuales.`}
            </p>
          </div>
          <Badge variant="secondary" className="mt-0.5 shrink-0">
            {t`Activa`}
          </Badge>
        </header>
        <div className="divide-y divide-border border-t border-border">
          <PayoutAccountDetail
            label={t`Titular`}
            value={account.account_holder_name}
          />
          <PayoutAccountDetail
            label={t`Número de cuenta`}
            value={maskAccountNumber(account.account_number)}
          />
          <PayoutAccountDetail
            label={t`Tipo de cuenta`}
            value={accountTypeLabel(account.account_type)}
          />
          <PayoutAccountDetail
            label={t`Routing number`}
            value={account.routing_number}
          />
          <PayoutAccountDetail label={t`Dirección`} value={account.address} />
        </div>
      </section>

      <W8BenCard />
    </div>
  )
}

function W8BenCard() {
  return (
    <SettingsCard
      title={t`Impuestos (W-8BEN)`}
      description={t`Para recibir pagos tenés que completar el formulario W-8BEN una sola vez.`}
      footer={
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <a href="https://pagos.go-marz.com/" target="_blank" rel="noreferrer">
            {t`Rellenarlo`}
          </a>
        </Button>
      }
    >
      <div className="flex items-start gap-3 px-6 py-4">
        <FileText
          className="mt-0.5 size-5 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {t`¿Qué es el W-8BEN?`}
          </p>
          <p className="max-w-xl text-sm text-muted-foreground">
            {t`Es un formulario fiscal de Estados Unidos para personas que no son ciudadanas ni residentes fiscales de EE.UU. Sirve para declarar que sos extranjero y que no corresponde que te deduzcan impuestos de tu pago.`}
          </p>
        </div>
      </div>
    </SettingsCard>
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

function accountTypeLabel(accountType: PayoutAccount['account_type']) {
  return ACCOUNT_TYPE_LABELS[accountType]()
}

function maskAccountNumber(accountNumber: string) {
  const last4 = accountNumber.slice(-4)
  return `•••• ${last4}`
}

function accountSummary(account: PayoutAccount) {
  return [account.name, maskAccountNumber(account.account_number), t`USD`]
    .filter(Boolean)
    .join(' · ')
}
