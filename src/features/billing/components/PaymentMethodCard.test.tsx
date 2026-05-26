import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { BillingPaymentMethod } from '#/shared/api/generated/model'
import { PaymentMethodCard } from './PaymentMethodCard'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

const paymentMethod: BillingPaymentMethod = {
  stripe_payment_method_id: 'pm_test_visa',
  card_brand: 'visa',
  card_last4: '4242',
}

describe('PaymentMethodCard', () => {
  it('renders payment method brand, last4, title, and CTA', () => {
    render(
      <PaymentMethodCard
        title="Tarjeta de suscripción"
        paymentMethod={paymentMethod}
        onManageClick={vi.fn()}
      />,
    )

    expect(screen.getByText('Tarjeta de suscripción')).toBeInTheDocument()
    expect(screen.getByText('Visa •••• 4242')).toBeInTheDocument()
    expect(screen.getByText('Gestionar en Stripe')).toBeInTheDocument()
  })

  it('renders secondary label as badge', () => {
    render(
      <PaymentMethodCard
        title="Tarjeta de pagos"
        paymentMethod={paymentMethod}
        secondaryLabel="Se usa para suscripción y pagos a creators"
        onManageClick={vi.fn()}
      />,
    )

    expect(
      screen.getByText('Se usa para suscripción y pagos a creators'),
    ).toBeInTheDocument()
  })

  it('renders fallback text when payment method is null', () => {
    render(
      <PaymentMethodCard
        title="Tarjeta de pagos"
        paymentMethod={null}
        onManageClick={vi.fn()}
      />,
    )

    expect(screen.getByText('Sin método de pago')).toBeInTheDocument()
  })

  it('calls onManageClick when CTA is clicked', async () => {
    const user = userEvent.setup()
    const onManageClick = vi.fn()

    render(
      <PaymentMethodCard
        title="Tarjeta de pagos"
        paymentMethod={paymentMethod}
        onManageClick={onManageClick}
      />,
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Gestionar Tarjeta de pagos en Stripe',
      }),
    )

    expect(onManageClick).toHaveBeenCalledTimes(1)
  })

  it('sets an aria-label that includes the title', () => {
    render(
      <PaymentMethodCard
        title="Tarjeta de suscripción"
        paymentMethod={paymentMethod}
        onManageClick={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('button', {
        name: 'Gestionar Tarjeta de suscripción en Stripe',
      }),
    ).toBeInTheDocument()
  })
})
