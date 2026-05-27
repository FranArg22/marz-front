import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { OfferSendError } from '#/shared/api/generated/model'
import { OfferSendErrorCode } from '#/shared/api/generated/model'
import { OfferSendErrorBanner } from './OfferSendErrorBanner'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

const portalSessionMock = vi.hoisted(() => ({
  mutate: vi.fn(),
  isPending: false,
}))

vi.mock('#/features/billing/hooks/useCreatePortalSession', () => ({
  useCreatePortalSession: () => portalSessionMock,
}))

function renderBanner(error: OfferSendError) {
  render(<OfferSendErrorBanner error={error} />)
}

describe('OfferSendErrorBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    portalSessionMock.isPending = false
  })

  it('renders card_declined copy and an enabled portal CTA', () => {
    renderBanner({ code: OfferSendErrorCode.card_declined })

    expect(
      screen.getByText(
        'Tu tarjeta fue declinada. Verificá los datos o usá otra tarjeta.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Gestionar tarjeta en Stripe' }),
    ).toBeEnabled()
  })

  it('renders insufficient_funds copy', () => {
    renderBanner({ code: OfferSendErrorCode.insufficient_funds })

    expect(
      screen.getByText('Tu tarjeta no tiene fondos suficientes.'),
    ).toBeInTheDocument()
  })

  it('renders expired_card copy', () => {
    renderBanner({ code: OfferSendErrorCode.expired_card })

    expect(screen.getByText('Tu tarjeta está vencida.')).toBeInTheDocument()
  })

  it('renders incorrect_cvc copy', () => {
    renderBanner({ code: OfferSendErrorCode.incorrect_cvc })

    expect(
      screen.getByText(
        'El código de seguridad de tu tarjeta es incorrecto.',
      ),
    ).toBeInTheDocument()
  })

  it('renders hold_failed_generic copy', () => {
    renderBanner({ code: OfferSendErrorCode.hold_failed_generic })

    expect(
      screen.getByText(
        'No pudimos procesar el pago. Intentá de nuevo o gestioná tu tarjeta.',
      ),
    ).toBeInTheDocument()
  })

  it('renders stripe_code in an abbr for generic hold failures', () => {
    renderBanner({
      code: OfferSendErrorCode.hold_failed_generic,
      stripe_code: 'do_not_honor',
    })

    expect(screen.getByTitle('do_not_honor')).toHaveTextContent('do_not_honor')
  })

  it('renders generic copy for unknown codes', () => {
    renderBanner({ code: 'unknown_future_code' as OfferSendError['code'] })

    expect(
      screen.getByText(
        'No pudimos procesar el pago. Intentá de nuevo o gestioná tu tarjeta.',
      ),
    ).toBeInTheDocument()
  })

  it('calls create portal session mutation when clicking the CTA', async () => {
    const user = userEvent.setup()
    renderBanner({ code: OfferSendErrorCode.card_declined })

    await user.click(
      screen.getByRole('button', { name: 'Gestionar tarjeta en Stripe' }),
    )

    expect(portalSessionMock.mutate).toHaveBeenCalledTimes(1)
  })

  it('disables the CTA while portal session is pending', () => {
    portalSessionMock.isPending = true

    renderBanner({ code: OfferSendErrorCode.card_declined })

    expect(
      screen.getByRole('button', { name: 'Gestionar tarjeta en Stripe' }),
    ).toBeDisabled()
  })

  it('renders an alert banner', () => {
    renderBanner({ code: OfferSendErrorCode.card_declined })

    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
