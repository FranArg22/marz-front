import { Loader2 } from 'lucide-react'
import { plural, t } from '@lingui/core/macro'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { cn } from '#/lib/utils'
import type { BillingPaymentMethodList } from '#/shared/api/generated/model/billingPaymentMethodList'
import type { BillingPlanIdentifier } from '#/shared/api/generated/model/billingPlanIdentifier'

import type { BillingSubscription } from '../hooks/useBillingSubscription'
import { useCreatePortalSession } from '../hooks/useCreatePortalSession'
import { PaymentMethodsCard } from '../components/PaymentMethodsCard'

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  /* eslint-disable lingui/no-unlocalized-strings -- Intl format option values, not user-facing copy. */
  hour: '2-digit',
  minute: '2-digit',
  /* eslint-enable lingui/no-unlocalized-strings */
})

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
})

const PLAN_NAME: Record<BillingPlanIdentifier, () => string> = {
  starter: () => t`Starter`,
  growth: () => t`Growth`,
  scale: () => t`Scale`,
}

const INTERVAL_LABEL = {
  month: () => t`mensual`,
  year: () => t`anual`,
} as const

function formatAmount(amount: string | null | undefined): string | null {
  if (!amount) return null
  const numeric = Number(amount)
  if (!Number.isFinite(numeric)) return null
  return currencyFormatter.format(numeric)
}

export interface BillingSummaryProps {
  subscription: BillingSubscription
  paymentMethods?: BillingPaymentMethodList
  paymentMethodsMode?: 'prefetched' | 'self-fetch'
  returnUrl?: string
}

export function BillingSummary({
  subscription,
  paymentMethods,
  paymentMethodsMode = 'prefetched',
  returnUrl = '/ajustes/suscripcion',
}: BillingSummaryProps) {
  const contentProps = {
    subscription,
    paymentMethods,
    usePrefetchedPaymentMethods: paymentMethodsMode === 'prefetched',
    returnUrl,
  }

  switch (subscription.status) {
    case 'trialing':
      return <TrialingView {...contentProps} />
    case 'past_due':
      return <PastDueView {...contentProps} />
    case 'canceled':
      return <CanceledView {...contentProps} />
    case 'active':
    case 'unpaid':
    default:
      return <ActiveView {...contentProps} />
  }
}

interface BillingSummaryContentProps {
  subscription: BillingSubscription
  paymentMethods?: BillingPaymentMethodList
  usePrefetchedPaymentMethods: boolean
  returnUrl: string
}

function TrialingView({
  subscription,
  paymentMethods,
  usePrefetchedPaymentMethods,
  returnUrl,
}: BillingSummaryContentProps) {
  const days = subscription.days_until_trial_ends
  const countdown =
    days != null
      ? plural(days, {
          one: 'Tu trial termina en # día',
          other: 'Tu trial termina en # días',
        })
      : t`Tu trial sigue activo`

  return (
    <BillingShell>
      <Header title={t`Estás en período de prueba`} description={countdown} />
      <DetailsCard subscription={subscription} />
      <PaymentMethodsCard
        paymentMethods={paymentMethods}
        usePrefetchedPaymentMethods={usePrefetchedPaymentMethods}
        returnUrl={returnUrl}
      />
    </BillingShell>
  )
}

function ActiveView({
  subscription,
  paymentMethods,
  usePrefetchedPaymentMethods,
  returnUrl,
}: BillingSummaryContentProps) {
  return (
    <BillingShell>
      <Header title={t`Tu suscripción está activa`} />
      <DetailsCard subscription={subscription} />
      <PaymentMethodsCard
        paymentMethods={paymentMethods}
        usePrefetchedPaymentMethods={usePrefetchedPaymentMethods}
        returnUrl={returnUrl}
      />
    </BillingShell>
  )
}

function PastDueView({
  subscription,
  paymentMethods,
  usePrefetchedPaymentMethods,
  returnUrl,
}: BillingSummaryContentProps) {
  return (
    <BillingShell>
      <Header
        title={t`Tu último cobro falló`}
        description={t`Actualizá tu tarjeta para mantener el acceso.`}
        tone="destructive"
      />
      <DetailsCard subscription={subscription} hideNextInvoice />
      <PaymentMethodsCard
        paymentMethods={paymentMethods}
        usePrefetchedPaymentMethods={usePrefetchedPaymentMethods}
        returnUrl={returnUrl}
      />
      <ManagePortalButton
        variant="destructive"
        label={t`Actualizar tarjeta en Stripe`}
        returnUrl={returnUrl}
      />
    </BillingShell>
  )
}

function CanceledView({
  subscription,
  paymentMethods,
  usePrefetchedPaymentMethods,
  returnUrl,
}: BillingSummaryContentProps) {
  const cancelAtLabel = subscription.cancel_at
    ? dateFormatter.format(new Date(subscription.cancel_at))
    : null

  return (
    <BillingShell>
      <Header
        title={t`Cancelaste tu suscripción`}
        description={
          cancelAtLabel
            ? t`Mantenés acceso hasta ${cancelAtLabel}`
            : t`Mantenés acceso hasta el final del período actual.`
        }
      />
      <DetailsCard subscription={subscription} hideNextInvoice />
      <PaymentMethodsCard
        paymentMethods={paymentMethods}
        usePrefetchedPaymentMethods={usePrefetchedPaymentMethods}
        returnUrl={returnUrl}
      />
    </BillingShell>
  )
}

function BillingShell({ children }: { children: React.ReactNode }) {
  return <div className="flex w-full flex-col gap-6">{children}</div>
}

interface HeaderProps {
  title: string
  description?: string
  tone?: 'default' | 'destructive'
}

function Header({ title, description, tone = 'default' }: HeaderProps) {
  return (
    <header className="flex flex-col gap-2">
      <h1
        className={cn(
          'text-2xl font-semibold',
          tone === 'destructive' ? 'text-destructive' : 'text-foreground',
        )}
      >
        {title}
      </h1>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </header>
  )
}

interface DetailsCardProps {
  subscription: BillingSubscription
  hideNextInvoice?: boolean
}

function DetailsCard({
  subscription,
  hideNextInvoice = false,
}: DetailsCardProps) {
  const planLabel = `${PLAN_NAME[subscription.plan]()} (${INTERVAL_LABEL[
    subscription.interval
  ]()})`

  const nextAmount = formatAmount(subscription.next_invoice_amount_usd)
  const nextAt = subscription.next_invoice_at
    ? dateTimeFormatter.format(new Date(subscription.next_invoice_at))
    : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          {t`Detalle del plan`}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Row label={t`Plan`} value={planLabel} />
        {!hideNextInvoice && nextAmount && nextAt ? (
          <Row label={t`Próximo cobro`} value={`${nextAmount} · ${nextAt}`} />
        ) : null}
      </CardContent>
    </Card>
  )
}

interface RowProps {
  label: string
  value: string
}

function Row({ label, value }: RowProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}

interface ManagePortalButtonProps {
  variant?: 'default' | 'destructive'
  label?: string
  returnUrl?: string
}

function ManagePortalButton({
  variant = 'default',
  label,
  returnUrl = '/ajustes/suscripcion',
}: ManagePortalButtonProps) {
  const portalMutation = useCreatePortalSession()
  const buttonLabel = label ?? t`Gestionar en Stripe`

  const openStripePortal = () => {
    portalMutation.mutate(
      {
        data: {
          return_url: `${window.location.origin}${returnUrl}`,
        },
      },
      {
        onSuccess: (portalResponse) => {
          if (portalResponse.status === 201) {
            window.location.assign(portalResponse.data.portal_url)
          }
        },
        onError: () => {
          toast.error(t`Stripe no responde, intentá de nuevo`)
        },
      },
    )
  }

  return (
    <div>
      <Button
        type="button"
        variant={variant}
        onClick={openStripePortal}
        disabled={portalMutation.isPending}
      >
        {portalMutation.isPending ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : null}
        {buttonLabel}
      </Button>
    </div>
  )
}
