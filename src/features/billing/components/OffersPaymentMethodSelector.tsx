import { Loader2 } from 'lucide-react'
import { t } from '@lingui/core/macro'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'

import {
  useCreateOffersSetupSession,
  useOffersPaymentMethods,
  useSetOffersPaymentMethod,
} from '../hooks/useOffersPaymentMethod'

const SAME_AS_SUBSCRIPTION = '__same__'

// Selector for the payment method charged for offers (charge-on-send). Lists
// the cards saved on the Stripe customer and lets the brand either reuse the
// subscription card (default) or pin a different one. Adding a new card goes
// through a Stripe-hosted setup Checkout.
export function OffersPaymentMethodSelector() {
  const query = useOffersPaymentMethods()
  const setMutation = useSetOffersPaymentMethod()
  const setupMutation = useCreateOffersSetupSession()

  const list = query.data?.status === 200 ? query.data.data : undefined
  const cards = list?.payment_methods ?? []
  const pinned = cards.find((card) => card.is_offers_default)
  const currentValue =
    !list || list.same_payment_method
      ? SAME_AS_SUBSCRIPTION
      : (pinned?.stripe_payment_method_id ?? SAME_AS_SUBSCRIPTION)

  const handleChange = (value: string) => {
    if (value === currentValue) return
    setMutation.mutate(
      {
        data: {
          stripe_payment_method_id:
            value === SAME_AS_SUBSCRIPTION ? null : value,
        },
      },
      {
        onError: () => {
          toast.error(t`No pudimos cambiar el método de pago, intentá de nuevo`)
        },
      },
    )
  }

  const handleAddCard = () => {
    if (setupMutation.isPending) return
    setupMutation.mutate(
      {
        data: {
          success_url: `${window.location.origin}/billing`,
          cancel_url: `${window.location.origin}/billing`,
        },
      },
      {
        onSuccess: (response) => {
          if (response.status === 201) {
            window.location.assign(response.data.setup_url)
          }
        },
        onError: () => {
          toast.error(t`Stripe no responde, intentá de nuevo`)
        },
      },
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          {t`Método de pago para pagos a creators`}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {query.isLoading ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <>
            <Select
              value={currentValue}
              onValueChange={handleChange}
              disabled={setMutation.isPending}
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
                {cards.map((card) => (
                  <SelectItem
                    key={card.stripe_payment_method_id}
                    value={card.stripe_payment_method_id}
                  >
                    {`${capitalizeCardBrand(card.card_brand)} •••• ${card.card_last4}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          </>
        )}
      </CardContent>
    </Card>
  )
}

function capitalizeCardBrand(brand: string) {
  return brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase()
}
