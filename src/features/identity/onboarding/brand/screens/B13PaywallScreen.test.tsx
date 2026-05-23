import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import type { BillingPlansResponse } from '#/shared/api/generated/model/billingPlansResponse'
import { ApiError } from '#/shared/api/mutator'
import { B13PaywallScreen } from './B13PaywallScreen'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

const mockGoTo = vi.fn()
vi.mock('../store', () => ({
  useBrandOnboardingStore: () => ({
    contact_name: 'Ana Pérez',
    goTo: mockGoTo,
  }),
}))

const useBillingPlansMock = vi.fn()
const useCreateCheckoutSessionMock = vi.fn()

vi.mock('#/features/billing/hooks/useBillingPlans', () => ({
  useBillingPlans: () => useBillingPlansMock(),
}))

vi.mock('#/features/billing/hooks/useCreateCheckoutSession', () => ({
  useCreateCheckoutSession: () => useCreateCheckoutSessionMock(),
}))

const PLANS: BillingPlansResponse = {
  plans: [
    {
      plan: 'starter',
      interval: 'month',
      amount_usd: '199.00',
      stripe_price_id: 'price_starter_m',
    },
    {
      plan: 'growth',
      interval: 'month',
      amount_usd: '299.00',
      stripe_price_id: 'price_growth_m',
    },
    {
      plan: 'scale',
      interval: 'month',
      amount_usd: '999.00',
      stripe_price_id: 'price_scale_m',
    },
    {
      plan: 'starter',
      interval: 'year',
      amount_usd: '159.00',
      stripe_price_id: 'price_starter_y',
    },
  ],
}

type PlansQueryResult = UseQueryResult<{ data: BillingPlansResponse; status: 200 }>

function plansQuerySuccess(): PlansQueryResult {
  return {
    data: { data: PLANS, status: 200 },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as PlansQueryResult
}

function plansQueryLoading(): PlansQueryResult {
  return {
    data: undefined,
    isLoading: true,
    isError: false,
    refetch: vi.fn(),
  } as unknown as PlansQueryResult
}

function plansQueryError(refetch = vi.fn()): PlansQueryResult {
  return {
    data: undefined,
    isLoading: false,
    isError: true,
    refetch,
  } as unknown as PlansQueryResult
}

type CheckoutMutation = UseMutationResult<
  { data: { checkout_url: string; session_id: string; expires_at: string } },
  unknown,
  { data: unknown },
  unknown
>

function checkoutMutation(overrides: {
  mutate?: ReturnType<typeof vi.fn>
  isPending?: boolean
} = {}): CheckoutMutation {
  return {
    mutate: overrides.mutate ?? vi.fn(),
    isPending: overrides.isPending ?? false,
  } as unknown as CheckoutMutation
}

const originalLocation = window.location

beforeEach(() => {
  vi.clearAllMocks()
  useBillingPlansMock.mockReturnValue(plansQuerySuccess())
  useCreateCheckoutSessionMock.mockReturnValue(checkoutMutation())

  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      ...originalLocation,
      origin: 'https://app.marz.test',
      assign: vi.fn(),
    },
  })
})

describe('B13PaywallScreen', () => {
  it('renders the PlansGrid with month plans by default', () => {
    render(<B13PaywallScreen />)
    expect(screen.getByText('Starter')).toBeInTheDocument()
    expect(screen.getByText('Growth')).toBeInTheDocument()
    expect(screen.getByText('Scale')).toBeInTheDocument()
    expect(screen.getByText('$199')).toBeInTheDocument()
  })

  it('disables the primary CTA until a plan is selected, then enables it', async () => {
    const user = userEvent.setup()
    render(<B13PaywallScreen />)
    const cta = screen.getByRole('button', { name: /continuar con plan pago/i })
    expect(cta).toBeDisabled()

    await user.click(screen.getByRole('radio', { name: /growth/i }))
    expect(cta).toBeEnabled()
  })

  it('calls checkout mutation with selected plan, interval, success and cancel URLs', async () => {
    const user = userEvent.setup()
    const mutate = vi.fn()
    useCreateCheckoutSessionMock.mockReturnValue(checkoutMutation({ mutate }))

    render(<B13PaywallScreen />)
    await user.click(screen.getByRole('radio', { name: /growth/i }))
    await user.click(screen.getByRole('button', { name: /continuar con plan pago/i }))

    expect(mutate).toHaveBeenCalledTimes(1)
    expect(mutate.mock.calls[0]?.[0]).toEqual({
      data: {
        plan: 'growth',
        interval: 'month',
        success_url:
          'https://app.marz.test/onboarding/brand/billing-callback?checkout=success',
        cancel_url:
          'https://app.marz.test/onboarding/brand/billing-callback?checkout=cancelled',
      },
    })
  })

  it('on success redirects to checkout_url', async () => {
    const user = userEvent.setup()
    const mutate = vi.fn(
      (_vars: unknown, opts: { onSuccess: (resp: unknown) => void }) => {
        opts.onSuccess({
          status: 201,
          data: {
            checkout_url: 'https://stripe.test/checkout/abc',
            session_id: 'cs_123',
            expires_at: '2026-05-23T00:00:00Z',
          },
        })
      },
    )
    useCreateCheckoutSessionMock.mockReturnValue(checkoutMutation({ mutate }))

    render(<B13PaywallScreen />)
    await user.click(screen.getByRole('radio', { name: /starter/i }))
    await user.click(screen.getByRole('button', { name: /continuar con plan pago/i }))

    expect(window.location.assign).toHaveBeenCalledWith(
      'https://stripe.test/checkout/abc',
    )
  })

  it('on 409 subscription_already_active shows message and an advance CTA', async () => {
    const user = userEvent.setup()
    const mutate = vi.fn(
      (_vars: unknown, opts: { onError: (e: unknown) => void }) => {
        opts.onError(
          new ApiError(409, 'subscription_already_active', 'already active'),
        )
      },
    )
    useCreateCheckoutSessionMock.mockReturnValue(checkoutMutation({ mutate }))

    render(<B13PaywallScreen />)
    await user.click(screen.getByRole('radio', { name: /starter/i }))
    await user.click(screen.getByRole('button', { name: /continuar con plan pago/i }))

    expect(
      screen.getByText(/ya tenés una suscripción activa/i),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^continuar$/i }))
    expect(mockGoTo).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalled()
  })

  it('free CTA advances step without invoking checkout mutation', async () => {
    const user = userEvent.setup()
    const mutate = vi.fn()
    useCreateCheckoutSessionMock.mockReturnValue(checkoutMutation({ mutate }))

    render(<B13PaywallScreen />)
    await user.click(
      screen.getByRole('button', {
        name: /prefiero seguir sin la red de creadores/i,
      }),
    )

    expect(mutate).not.toHaveBeenCalled()
    expect(mockGoTo).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalled()
  })

  it('renders skeleton while plans are loading', () => {
    useBillingPlansMock.mockReturnValue(plansQueryLoading())
    render(<B13PaywallScreen />)
    expect(screen.getByRole('status', { name: /cargando planes/i })).toBeInTheDocument()
  })

  it('shows error UI with a retry button when plans query fails', async () => {
    const user = userEvent.setup()
    const refetch = vi.fn()
    useBillingPlansMock.mockReturnValue(plansQueryError(refetch))

    render(<B13PaywallScreen />)
    expect(
      screen.getByText(/no pudimos cargar los planes/i),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /reintentar/i }))
    expect(refetch).toHaveBeenCalled()
  })
})
