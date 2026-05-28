import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import type { BillingSubscription } from '../hooks/useBillingSubscription'
import { BillingPage } from './BillingPage'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
  plural: (n: number, forms: { one: string; other: string }) => {
    const form = n === 1 ? forms.one : forms.other
    return form.replace('#', String(n))
  },
}))

const subscriptionMock = vi.fn()
const mutateMock = vi.fn()
let isPending = false

vi.mock('../hooks/useBillingSubscription', () => ({
  useBillingSubscription: () => subscriptionMock(),
}))

vi.mock('../hooks/useCreatePortalSession', () => ({
  useCreatePortalSession: () => ({
    mutate: mutateMock,
    isPending,
  }),
}))

// Payment-method management is covered by PaymentMethodsCard.test; stub it here
// so BillingPage tests focus on the per-status views and plan details.
vi.mock('./PaymentMethodsCard', () => ({
  PaymentMethodsCard: () => null,
}))

const toastErrorMock = vi.fn()
vi.mock('sonner', () => ({
  toast: { error: (msg: string) => toastErrorMock(msg) },
}))

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

function baseSubscription(
  overrides: Partial<BillingSubscription> = {},
): BillingSubscription {
  return {
    plan: 'starter',
    interval: 'month',
    status: 'active',
    in_trial: false,
    trial_ends_at: null,
    current_period_start: '2026-05-01T00:00:00Z',
    current_period_end: '2026-06-01T00:00:00Z',
    cancel_at: null,
    cancel_at_period_end: false,
    subscription_payment_method: {
      stripe_payment_method_id: 'pm_test_visa',
      card_brand: 'visa',
      card_last4: '4242',
    },
    offers_payment_method: {
      stripe_payment_method_id: 'pm_test_visa',
      card_brand: 'visa',
      card_last4: '4242',
    },
    same_payment_method: true,
    next_invoice_amount_usd: '49.00',
    next_invoice_at: '2026-06-01T00:00:00Z',
    days_until_trial_ends: null,
    days_until_downgrade: null,
    ...overrides,
  }
}

function setSubscription(sub: BillingSubscription) {
  subscriptionMock.mockReturnValue({
    isLoading: false,
    data: { status: 200, data: sub },
  })
}

describe('BillingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isPending = false
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        origin: 'http://localhost:3000',
        assign: vi.fn(),
      },
    })
  })

  it('renders trialing block with countdown', () => {
    setSubscription(
      baseSubscription({
        status: 'trialing',
        in_trial: true,
        days_until_trial_ends: 5,
      }),
    )

    render(<BillingPage />, { wrapper })

    expect(
      screen.getByRole('heading', { name: /período de prueba/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/termina en 5 días/i)).toBeInTheDocument()
  })

  it('renders active block with plan and next invoice', () => {
    setSubscription(baseSubscription({ status: 'active' }))
    render(<BillingPage />, { wrapper })

    expect(
      screen.getByRole('heading', { name: /suscripción está activa/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Starter \(mensual\)/i)).toBeInTheDocument()
    expect(screen.getByText(/\$49\.00/)).toBeInTheDocument()
  })

  it('renders past_due block with destructive CTA', () => {
    setSubscription(baseSubscription({ status: 'past_due' }))
    render(<BillingPage />, { wrapper })

    expect(
      screen.getByRole('heading', { name: /último cobro falló/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Actualizar tarjeta en Stripe/i }),
    ).toBeInTheDocument()
  })

  it('renders canceled block with cancel_at date', () => {
    setSubscription(
      baseSubscription({
        status: 'canceled',
        cancel_at: '2026-07-15T00:00:00Z',
        cancel_at_period_end: true,
      }),
    )
    render(<BillingPage />, { wrapper })

    expect(
      screen.getByRole('heading', { name: /cancelaste tu suscripción/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Mantenés acceso hasta/i)).toBeInTheDocument()
  })

  it('does not render details when query is loading', () => {
    subscriptionMock.mockReturnValue({ isLoading: true, data: undefined })
    render(<BillingPage />, { wrapper })

    expect(screen.queryByText(/Detalle del plan/i)).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
