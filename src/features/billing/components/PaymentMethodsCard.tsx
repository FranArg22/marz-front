import { Loader2 } from 'lucide-react'
import { t } from '@lingui/core/macro'
import { useEffect } from 'react'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Label } from '#/components/ui/label'
import type { BillingPaymentMethodList } from '#/shared/api/generated/model/billingPaymentMethodList'

import { trackBillingEvent } from '../analytics'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'

import { useCreatePortalSession } from '../hooks/useCreatePortalSession'
import {
  useCreateOffersSetupSession,
  useOffersPaymentMethods,
  useSetOffersPaymentMethod,
  useSetSubscriptionPaymentMethod,
} from '../hooks/useOffersPaymentMethod'

const SAME_AS_SUBSCRIPTION = '__same__'

// Single card that manages both payment methods: the card the subscription is
// charged on and the card used to pay creators. Cards are stored in Stripe (add
// via the setup Checkout, remove/manage via the Stripe portal); here the brand
// just routes which saved card pays what.
interface PaymentMethodsCardProps {
  paymentMethods?: BillingPaymentMethodList
  usePrefetchedPaymentMethods?: boolean
  returnUrl?: string
}

export function PaymentMethodsCard({
  paymentMethods,
  usePrefetchedPaymentMethods = false,
  returnUrl = '/ajustes/suscripcion',
}: PaymentMethodsCardProps) {
  const query = useOffersPaymentMethods(!usePrefetchedPaymentMethods)
  const setSubscription = useSetSubscriptionPaymentMethod()
  const setOffers = useSetOffersPaymentMethod()
  const setupMutation = useCreateOffersSetupSession()
  const portalMutation = useCreatePortalSession()

  useEffect(() => {
    trackBillingEvent('offers_payment_method_viewed')
  }, [])

  const list = usePrefetchedPaymentMethods
    ? paymentMethods
    : query.data?.status === 200
      ? query.data.data
      : undefined
  const cards = list?.payment_methods ?? []
  const subscriptionValue =
    cards.find((card) => card.is_subscription_default)
      ?.stripe_payment_method_id ?? ''
  const offersValue =
    !list || list.same_payment_method
      ? SAME_AS_SUBSCRIPTION
      : (cards.find((card) => card.is_offers_default)
          ?.stripe_payment_method_id ?? SAME_AS_SUBSCRIPTION)

  const handleSubscriptionChange = (value: string) => {
    if (value === subscriptionValue) return
    setSubscription.mutate(
      { data: { stripe_payment_method_id: value } },
      {
        onError: () =>
          toast.error(
            t`No pudimos cambiar el método de pago, intentá de nuevo`,
          ),
      },
    )
  }

  const handleOffersChange = (value: string) => {
    if (value === offersValue) return
    setOffers.mutate(
      {
        data: {
          stripe_payment_method_id:
            value === SAME_AS_SUBSCRIPTION ? null : value,
        },
      },
      {
        onError: () =>
          toast.error(
            t`No pudimos cambiar el método de pago, intentá de nuevo`,
          ),
      },
    )
  }

  const handleAddCard = () => {
    if (setupMutation.isPending) return
    setupMutation.mutate(
      {
        data: {
          success_url: `${window.location.origin}${returnUrl}`,
          cancel_url: `${window.location.origin}${returnUrl}`,
        },
      },
      {
        onSuccess: (response) => {
          if (response.status === 201) {
            window.location.assign(response.data.setup_url)
          }
        },
        onError: () => toast.error(t`Stripe no responde, intentá de nuevo`),
      },
    )
  }

  const handleManage = () => {
    if (portalMutation.isPending) return
    trackBillingEvent('offers_payment_method_portal_opened')
    portalMutation.mutate(
      { data: { return_url: `${window.location.origin}${returnUrl}` } },
      {
        onSuccess: (response) => {
          if (response.status === 201) {
            window.location.assign(response.data.portal_url)
          }
        },
        onError: () => toast.error(t`Stripe no responde, intentá de nuevo`),
      },
    )
  }

  const cardOptions = cards.map((card) => (
    <SelectItem
      key={card.stripe_payment_method_id}
      value={card.stripe_payment_method_id}
    >
      {`${capitalizeCardBrand(card.card_brand)} •••• ${card.card_last4}`}
    </SelectItem>
  ))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          {t`Métodos de pago`}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {!usePrefetchedPaymentMethods && query.isLoading ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <Label>{t`Suscripción`}</Label>
              <Select
                value={subscriptionValue}
                onValueChange={handleSubscriptionChange}
                disabled={setSubscription.isPending || cards.length === 0}
              >
                <SelectTrigger
                  aria-label={t`Elegí el método de pago de la suscripción`}
                >
                  <SelectValue placeholder={t`Sin tarjeta`} />
                </SelectTrigger>
                <SelectContent>{cardOptions}</SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t`La tarjeta con la que se cobra tu plan.`}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label>{t`Pagos a creators`}</Label>
              <Select
                value={offersValue}
                onValueChange={handleOffersChange}
                disabled={setOffers.isPending}
              >
                <SelectTrigger
                  aria-label={t`Elegí el método de pago para creators`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SAME_AS_SUBSCRIPTION}>
                    {t`El mismo que la suscripción`}
                  </SelectItem>
                  {cardOptions}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t`La tarjeta con la que pagás a los creators.`}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={handleAddCard}
                disabled={setupMutation.isPending}
              >
                {setupMutation.isPending ? (
                  <Loader2
                    aria-hidden="true"
                    className="mr-2 size-4 animate-spin"
                  />
                ) : null}
                {t`Agregar otra tarjeta`}
              </Button>
              <Button
                type="button"
                variant="outline"
                data-testid="settings.subscription.manage_stripe_button"
                onClick={handleManage}
                disabled={portalMutation.isPending}
              >
                {t`Gestionar en Stripe`}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function capitalizeCardBrand(brand: string) {
  return brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase()
}
