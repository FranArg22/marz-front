import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { PaymentMethodsCard } from './PaymentMethodsCard'

vi.mock('@lingui/core/macro', () => ({
  t: (strings: TemplateStringsArray, ...values: unknown[]) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
}))

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))
vi.mock('../analytics', () => ({ trackBillingEvent: vi.fn() }))

const listMock = vi.fn()
const setSubMutate = vi.fn()
const setOffersMutate = vi.fn()
const setupMutate = vi.fn()
const portalMutate = vi.fn()

vi.mock('../hooks/useOffersPaymentMethod', () => ({
  useOffersPaymentMethods: () => listMock(),
  useSetSubscriptionPaymentMethod: () => ({ mutate: setSubMutate, isPending: false }),
  useSetOffersPaymentMethod: () => ({ mutate: setOffersMutate, isPending: false }),
  useCreateOffersSetupSession: () => ({ mutate: setupMutate, isPending: false }),
}))

vi.mock('../hooks/useCreatePortalSession', () => ({
  useCreatePortalSession: () => ({ mutate: portalMutate, isPending: false }),
}))

function listData(sameAsSubscription: boolean) {
  return {
    isLoading: false,
    data: {
      status: 200,
      data: {
        same_payment_method: sameAsSubscription,
        payment_methods: [
          {
            stripe_payment_method_id: 'pm_sub',
            card_brand: 'visa',
            card_last4: '4242',
            exp_month: 1,
            exp_year: 2030,
            is_subscription_default: true,
            is_offers_default: sameAsSubscription,
          },
          {
            stripe_payment_method_id: 'pm_offers',
            card_brand: 'amex',
            card_last4: '0005',
            exp_month: 1,
            exp_year: 2030,
            is_subscription_default: false,
            is_offers_default: !sameAsSubscription,
          },
        ],
      },
    },
  }
}

describe('PaymentMethodsCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { origin: 'https://marz.test', assign: vi.fn() },
    })
  })

  it('changes the subscription card', async () => {
    const user = userEvent.setup()
    listMock.mockReturnValue(listData(true))
    render(<PaymentMethodsCard />)

    await user.click(
      screen.getByRole('combobox', { name: /método de pago de la suscripción/i }),
    )
    await user.click(await screen.findByRole('option', { name: /Amex •••• 0005/i }))

    await waitFor(() => expect(setSubMutate).toHaveBeenCalledTimes(1))
    expect(setSubMutate.mock.calls[0]?.[0]).toEqual({
      data: { stripe_payment_method_id: 'pm_offers' },
    })
  })

  it('pins a distinct offers card', async () => {
    const user = userEvent.setup()
    listMock.mockReturnValue(listData(true))
    render(<PaymentMethodsCard />)

    await user.click(
      screen.getByRole('combobox', { name: /método de pago para creadores/i }),
    )
    await user.click(await screen.findByRole('option', { name: /Amex •••• 0005/i }))

    await waitFor(() => expect(setOffersMutate).toHaveBeenCalledTimes(1))
    expect(setOffersMutate.mock.calls[0]?.[0]).toEqual({
      data: { stripe_payment_method_id: 'pm_offers' },
    })
  })

  it('resets offers to same-as-subscription (null)', async () => {
    const user = userEvent.setup()
    listMock.mockReturnValue(listData(false))
    render(<PaymentMethodsCard />)

    await user.click(
      screen.getByRole('combobox', { name: /método de pago para creadores/i }),
    )
    await user.click(
      await screen.findByRole('option', { name: /El mismo que la suscripción/i }),
    )

    await waitFor(() => expect(setOffersMutate).toHaveBeenCalledTimes(1))
    expect(setOffersMutate.mock.calls[0]?.[0]).toEqual({
      data: { stripe_payment_method_id: null },
    })
  })

  it('redirects to the setup session when adding a card', async () => {
    const user = userEvent.setup()
    listMock.mockReturnValue(listData(true))
    setupMutate.mockImplementation((_args, handlers) => {
      handlers.onSuccess({ status: 201, data: { setup_url: 'https://stripe/setup' } })
    })
    render(<PaymentMethodsCard />)

    await user.click(screen.getByRole('button', { name: /Agregar otra tarjeta/i }))
    expect(window.location.assign).toHaveBeenCalledWith('https://stripe/setup')
  })

  it('redirects to the portal on manage', async () => {
    const user = userEvent.setup()
    listMock.mockReturnValue(listData(true))
    portalMutate.mockImplementation((_args, handlers) => {
      handlers.onSuccess({ status: 201, data: { portal_url: 'https://stripe/portal' } })
    })
    render(<PaymentMethodsCard />)

    await user.click(screen.getByRole('button', { name: /Gestionar en Stripe/i }))
    expect(window.location.assign).toHaveBeenCalledWith('https://stripe/portal')
  })
})
