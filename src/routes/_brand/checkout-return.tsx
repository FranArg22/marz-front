import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { NavigateFn } from '@tanstack/react-router'
import { t } from '@lingui/core/macro'
import { z } from 'zod'

import { useDraftStatus } from '#/features/payments/hooks/useDraftStatus'

const searchSchema = z.object({
  offer_draft_id: z.string(),
  return_to_kind: z.enum(['conversation', 'inbox']),
  return_to_id: z.string().optional(),
  checkout: z.enum(['success', 'cancel']).optional(),
})

type CheckoutReturnSearch = z.infer<typeof searchSchema>
type SendOfferResult = 'success' | 'cancelled' | 'failed'

export const Route = createFileRoute('/_brand/checkout-return')({
  validateSearch: (search) => searchSchema.parse(search),
  component: CheckoutReturnRoute,
})

function CheckoutReturnRoute() {
  return <CheckoutReturnPage search={Route.useSearch()} />
}

function navigateToReturnTo(
  navigate: NavigateFn,
  search: CheckoutReturnSearch,
  result: SendOfferResult,
) {
  if (search.return_to_kind === 'conversation') {
    void navigate({
      to: '/workspace/conversations/$conversationId',
      params: { conversationId: search.return_to_id! },
      search: { send_offer_result: result },
      replace: true,
    })
  } else {
    void navigate({
      to: '/inbox',
      search: (prev) => ({ ...prev, send_offer_result: result }),
      replace: true,
    })
  }
}

export function CheckoutReturnPage({
  search,
}: {
  search: CheckoutReturnSearch
}) {
  const navigate = useNavigate()
  const [retryKey, setRetryKey] = useState(0)

  return (
    <CheckoutReturnContent
      key={retryKey}
      search={search}
      navigate={navigate}
      onRetry={() => setRetryKey((current) => current + 1)}
    />
  )
}

function CheckoutReturnContent({
  search,
  navigate,
  onRetry,
}: {
  search: CheckoutReturnSearch
  navigate: NavigateFn
  onRetry: () => void
}) {
  const draftStatus = useDraftStatus({
    offerDraftId: search.offer_draft_id,
    enabled: search.checkout === 'success',
  })

  useEffect(() => {
    if (search.checkout !== 'cancel') return
    navigateToReturnTo(navigate, search, 'cancelled')
  }, [navigate, search])

  useEffect(() => {
    if (search.checkout !== 'success' || !draftStatus.isTerminal) return

    const result = draftStatus.status === 'sent' ? 'success' : 'failed'
    navigateToReturnTo(navigate, search, result)
  }, [draftStatus.isTerminal, draftStatus.status, navigate, search])

  if (draftStatus.timedOut && !draftStatus.isTerminal) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <div
          role="alert"
          data-testid="checkout-return.timeout_error"
          className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 text-center"
        >
          <h1 className="text-lg font-semibold text-foreground">
            {t`Tardamos más de lo esperado`}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t`Tu pago puede estar procesándose. Podés volver a intentar o revisar el estado luego.`}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground"
          >
            {t`Reintentar`}
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div
        role="status"
        data-testid="checkout-return.waiting"
        aria-live="polite"
        className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 text-center"
      >
        <div
          className="size-10 animate-spin rounded-full border-2 border-muted border-t-primary"
          aria-hidden="true"
        />
        <h1 className="text-lg font-semibold text-foreground">
          {t`Esperando confirmación…`}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t`Estamos confirmando el pago con Stripe.`}
        </p>
      </div>
    </main>
  )
}
