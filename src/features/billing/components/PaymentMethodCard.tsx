import { t } from '@lingui/core/macro'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import type { BillingPaymentMethod } from '#/shared/api/generated/model'

interface PaymentMethodCardProps {
  title: string
  paymentMethod: BillingPaymentMethod | null
  secondaryLabel?: string
  onManageClick: () => void
}

export function PaymentMethodCard({
  title,
  paymentMethod,
  secondaryLabel,
  onManageClick,
}: PaymentMethodCardProps) {
  const paymentMethodLabel = paymentMethod
    ? `${capitalizeCardBrand(paymentMethod.card_brand)} •••• ${
        paymentMethod.card_last4
      }`
    : t`Sin método de pago`

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {secondaryLabel ? (
            <Badge variant="secondary">{secondaryLabel}</Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-medium text-foreground">
            {paymentMethodLabel}
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={onManageClick}
            aria-label={t`Gestionar ${title} en Stripe`}
          >
            {t`Gestionar en Stripe`}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function capitalizeCardBrand(brand: string) {
  return brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase()
}
