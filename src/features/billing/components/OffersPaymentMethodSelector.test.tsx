import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { OffersPaymentMethodSelector } from './OffersPaymentMethodSelector'

vi.mock('@lingui/core/macro', () => ({
  t: (strings: TemplateStringsArray, ...values: unknown[]) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
}))

const toastErrorMock = vi.fn()
vi.mock('sonner', () => ({
  toast: { error: (msg: string) => toastErrorMock(msg) },
}))

const listMock = vi.fn()
const setMutate = vi.fn()
const setupMutate = vi.fn()

vi.mock('../hooks/useOffersPaymentMethod', () => ({
  useOffersPaymentMethods: () => listMock(),
  useSetOffersPaymentMethod: () => ({ mutate: setMutate, isPending: false }),
  useCreateOffersSetupSession: () => ({ mutate: setupMutate, isPending: false }),
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

describe('OffersPaymentMethodSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { origin: 'http://marz.test', assign: vi.fn() },
    })
  })

  it('pins a distinct card when selected', async () => {
    const user = userEvent.setup()
    listMock.mockReturnValue(listData(true))
    render(<OffersPaymentMethodSelector />)

    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: /Amex •••• 0005/i }))

    await waitFor(() => expect(setMutate).toHaveBeenCalledTimes(1))
    expect(setMutate.mock.calls[0]?.[0]).toEqual({
      data: { stripe_payment_method_id: 'pm_offers' },
    })
  })

  it('resets to same-as-subscription (null) when picking that option', async () => {
    const user = userEvent.setup()
    listMock.mockReturnValue(listData(false))
    render(<OffersPaymentMethodSelector />)

    await user.click(screen.getByRole('combobox'))
    await user.click(
      await screen.findByRole('option', { name: /El mismo que la suscripción/i }),
    )

    await waitFor(() => expect(setMutate).toHaveBeenCalledTimes(1))
    expect(setMutate.mock.calls[0]?.[0]).toEqual({
      data: { stripe_payment_method_id: null },
    })
  })

  it('redirects to the Stripe setup session when adding a card', async () => {
    const user = userEvent.setup()
    listMock.mockReturnValue(listData(true))
    setupMutate.mockImplementation((_args, handlers) => {
      handlers.onSuccess({ status: 201, data: { setup_url: 'https://stripe/setup' } })
    })
    render(<OffersPaymentMethodSelector />)

    await user.click(screen.getByRole('button', { name: /Agregar otra tarjeta/i }))

    expect(window.location.assign).toHaveBeenCalledWith('https://stripe/setup')
  })
})
