import { Loader2 } from 'lucide-react'
import { t, plural } from '@lingui/core/macro'
import { useEffect } from 'react'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { cn } from '#/lib/utils'
import type { BillingPlanIdentifier } from '#/shared/api/generated/model/billingPlanIdentifier'

import { useBillingSubscription } from '../hooks/useBillingSubscription'
import type { BillingSubscription } from '../hooks/useBillingSubscription'
import { useCreatePortalSession } from '../hooks/useCreatePortalSession'
import { trackBillingEvent } from '../analytics'
import { PaymentMethodCard } from './PaymentMethodCard'

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

export function BillingPage() {
  const subscriptionQuery = useBillingSubscription({ staleTime: 30_000 })

  if (subscriptionQuery.isLoading) {
    return (
      <div
        className="flex min-h-[40vh] items-center justify-center"
        role="status"
        aria-label={t`Cargando suscripción`}
      >
        <Loader2
          aria-hidden="true"
          className="size-6 animate-spin text-muted-foreground"
        />
      </div>
    )
  }

  const response = subscriptionQuery.data
  if (!response || response.status !== 200) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">
          {t`No pudimos cargar tu suscripción. Recargá la página o probá más tarde.`}
        </p>
      </div>
    )
  }

  const sub = response.data
  return <BillingPageContent subscription={sub} />
}

interface BillingPageContentProps {
  subscription: BillingSubscription
}

function BillingPageContent({ subscription }: BillingPageContentProps) {
  switch (subscription.status) {
    case 'trialing':
      return <TrialingView subscription={subscription} />
    case 'past_due':
      return <PastDueView subscription={subscription} />
    case 'canceled':
      return <CanceledView subscription={subscription} />
    case 'active':
    case 'unpaid':
    default:
      return <ActiveView subscription={subscription} />
  }
}

function TrialingView({ subscription }: BillingPageContentProps) {
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
      <DetailsCard
        subscription={subscription}
        hideTarjeta={subscription.same_payment_method}
      />
      <PaymentMethodBlock subscription={subscription} />
    </BillingShell>
  )
}

function ActiveView({ subscription }: BillingPageContentProps) {
  return (
    <BillingShell>
      <Header title={t`Tu suscripción está activa`} />
      <DetailsCard
        subscription={subscription}
        hideTarjeta={subscription.same_payment_method}
      />
      <PaymentMethodBlock subscription={subscription} />
    </BillingShell>
  )
}

function PastDueView({ subscription }: BillingPageContentProps) {
  return (
    <BillingShell>
      <Header
        title={t`Tu último cobro falló`}
        description={t`Actualizá tu tarjeta para mantener el acceso.`}
        tone="destructive"
      />
      <DetailsCard
        subscription={subscription}
        hideNextInvoice
        hideTarjeta={subscription.same_payment_method}
      />
      <PaymentMethodBlock subscription={subscription} />
      <ManagePortalButton
        variant="destructive"
        label={t`Actualizar tarjeta en Stripe`}
      />
    </BillingShell>
  )
}

function CanceledView({ subscription }: BillingPageContentProps) {
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
      <DetailsCard
        subscription={subscription}
        hideNextInvoice
        readOnlyCard
        hideTarjeta={subscription.same_payment_method}
      />
      <PaymentMethodBlock subscription={subscription} />
    </BillingShell>
  )
}

function BillingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      {children}
    </div>
  )
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
  hideTarjeta?: boolean
  readOnlyCard?: boolean
}

function DetailsCard({
  subscription,
  hideNextInvoice = false,
  hideTarjeta = false,
  readOnlyCard = false,
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
        {!hideTarjeta ? (
          <Row
            label={readOnlyCard ? t`Tarjeta (solo lectura)` : t`Tarjeta`}
            value={
              subscription.subscription_payment_method
                ? `${subscription.subscription_payment_method.card_brand} •••• ${subscription.subscription_payment_method.card_last4}`
                : t`Sin tarjeta cargada`
            }
          />
        ) : null}
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

interface PaymentMethodBlockProps {
  subscription: BillingSubscription
}

function PaymentMethodBlock({ subscription }: PaymentMethodBlockProps) {
  const portalMutation = useCreatePortalSession()

  useEffect(() => {
    trackBillingEvent('offers_payment_method_viewed')
  }, [])

  const handleManageClick = () => {
    trackBillingEvent('offers_payment_method_portal_opened')
    portalMutation.mutate(
      { data: { return_url: `${window.location.origin}/billing` } },
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

  if (subscription.same_payment_method) {
    return (
      <PaymentMethodCard
        title={t`Método de pago`}
        paymentMethod={subscription.offers_payment_method}
        secondaryLabel={t`Se usa para suscripción y pagos a creators`}
        onManageClick={handleManageClick}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <PaymentMethodCard
        title={t`Método de pago de la suscripción`}
        paymentMethod={subscription.subscription_payment_method}
        onManageClick={handleManageClick}
      />
      <PaymentMethodCard
        title={t`Método de pago para pagos a creators`}
        paymentMethod={subscription.offers_payment_method}
        onManageClick={handleManageClick}
      />
    </div>
  )
}

interface ManagePortalButtonProps {
  variant?: 'default' | 'destructive'
  label?: string
}

function ManagePortalButton({
  variant = 'default',
  label,
}: ManagePortalButtonProps) {
  const portalMutation = useCreatePortalSession()
  const buttonLabel = label ?? t`Gestionar en Stripe`

  const openStripePortal = () => {
    portalMutation.mutate(
      { data: { return_url: `${window.location.origin}/billing` } },
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
