import { t } from '@lingui/core/macro'
import { Loader2 } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { useCreatePortalSession } from '#/features/billing/hooks/useCreatePortalSession'
import type { OfferSendError } from '#/shared/api/generated/model'
import { OfferSendErrorCode } from '#/shared/api/generated/model'

export interface OfferSendErrorBannerProps {
  error: OfferSendError
}

const STRIPE_CODE_HIDDEN_CODES: ReadonlyArray<string> = [
  OfferSendErrorCode.card_declined,
  OfferSendErrorCode.insufficient_funds,
  OfferSendErrorCode.expired_card,
  OfferSendErrorCode.incorrect_cvc,
]

function getOfferSendErrorMessage(code: OfferSendError['code']) {
  if (code === ('stripe_unavailable' as OfferSendError['code'])) {
    return t`Stripe no responde, intentá de nuevo en un momento.`
  }

  switch (code) {
    case OfferSendErrorCode.card_declined:
      return t`Tu tarjeta fue declinada. Verificá los datos o usá otra tarjeta.`
    case OfferSendErrorCode.insufficient_funds:
      return t`Tu tarjeta no tiene fondos suficientes.`
    case OfferSendErrorCode.expired_card:
      return t`Tu tarjeta está vencida.`
    case OfferSendErrorCode.incorrect_cvc:
      return t`El código de seguridad de tu tarjeta es incorrecto.`
    case OfferSendErrorCode.hold_failed_generic:
    default:
      return t`No pudimos procesar el pago. Intentá de nuevo o gestioná tu tarjeta.`
  }
}

function shouldShowStripeCode(error: OfferSendError) {
  return (
    Boolean(error.stripe_code) && !STRIPE_CODE_HIDDEN_CODES.includes(error.code)
  )
}

export function OfferSendErrorBanner({ error }: OfferSendErrorBannerProps) {
  const portalMutation = useCreatePortalSession()

  const handleManageCard = () => {
    portalMutation.mutate(
      { data: { return_url: window.location.href } },
      {
        onSuccess: (portalResponse) => {
          if (portalResponse.status === 201) {
            window.location.href = portalResponse.data.portal_url
          }
        },
      },
    )
  }

  return (
    <div
      role="alert"
      data-testid="offers.send.error_banner"
      className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {getOfferSendErrorMessage(error.code)}
          </p>
          {shouldShowStripeCode(error) ? (
            <p className="text-xs text-muted-foreground">
              <abbr title={error.stripe_code ?? undefined}>
                {error.stripe_code}
              </abbr>
            </p>
          ) : null}
        </div>

        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={handleManageCard}
          disabled={portalMutation.isPending}
          className="self-start"
        >
          {portalMutation.isPending ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : null}
          {t`Gestionar tarjeta en Stripe`}
        </Button>
      </div>
    </div>
  )
}
