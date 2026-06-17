import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { BillingPlan } from '#/shared/api/generated/model/billingPlan'
import { ApiError } from '#/shared/api/mutator'

import { PlanUpgradeModal } from './PlanUpgradeModal'

const createBillingCheckoutSessionMock = vi.fn()
const generateIdempotencyKeyMock = vi.fn()
const useBillingPlansMock = vi.fn()
let checkoutPending = false

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

vi.mock('@lingui/react/macro', () => ({
  Trans: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}))

vi.mock('#/features/billing/hooks/useBillingPlans', () => ({
  useBillingPlans: () => useBillingPlansMock(),
}))

vi.mock('#/shared/api/idempotency', () => ({
  generateIdempotencyKey: () => generateIdempotencyKeyMock(),
}))

vi.mock('#/shared/api/generated/billing/billing', () => ({
  createBillingCheckoutSession: (
    data: unknown,
    options?: RequestInit,
  ) => createBillingCheckoutSessionMock(data, options),
  useCreateBillingCheckoutSession: (options: {
    mutation: {
      mutationFn: (variables: { data: unknown }) => Promise<unknown>
    }
  }) => ({
    isPending: checkoutPending,
    mutate: (
      variables: { data: unknown },
      callbacks?: {
        onSuccess?: (response: unknown) => void
        onError?: (error: unknown) => void
      },
    ) => {
      checkoutPending = true
      options.mutation
        .mutationFn(variables)
        .then((response) => callbacks?.onSuccess?.(response))
        .catch((error: unknown) => callbacks?.onError?.(error))
    },
  }),
}))

const PLANS: BillingPlan[] = [
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
  {
    plan: 'growth',
    interval: 'year',
    amount_usd: '239.00',
    stripe_price_id: 'price_growth_y',
  },
  {
    plan: 'scale',
    interval: 'year',
    amount_usd: '799.00',
    stripe_price_id: 'price_scale_y',
  },
]

const originalLocation = window.location

function renderModal({
  open = true,
  onClose = vi.fn(),
}: {
  open?: boolean
  onClose?: () => void
} = {}) {
  const result = render(<PlanUpgradeModal open={open} onClose={onClose} />)
  return { ...result, onClose }
}

describe('PlanUpgradeModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    checkoutPending = false
    generateIdempotencyKeyMock.mockReturnValue('idem-key-1')
    useBillingPlansMock.mockReturnValue({
      data: { status: 200, data: { plans: PLANS } },
    })
    createBillingCheckoutSessionMock.mockResolvedValue({
      status: 201,
      data: { checkout_url: 'https://stripe.test/checkout' },
      headers: new Headers(),
    })
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        origin: 'https://app.test',
        href: 'https://app.test/ajustes/suscripcion',
      },
    })
  })

  it('shows the 3 paid plans when open', () => {
    renderModal()

    const group = screen.getByRole('radiogroup', { name: 'Planes' })
    expect(within(group).getAllByRole('radio')).toHaveLength(3)
    expect(screen.getByRole('radio', { name: 'Starter' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Growth' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Scale' })).toBeInTheDocument()
  })

  it('creates a monthly growth checkout session with Idempotency-Key', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByRole('radio', { name: 'Growth' }))
    await user.click(screen.getAllByRole('button', { name: 'Probar 7 días gratis' })[1]!)

    await waitFor(() => {
      expect(createBillingCheckoutSessionMock).toHaveBeenCalledTimes(1)
    })
    expect(createBillingCheckoutSessionMock).toHaveBeenCalledWith(
      {
        plan: 'growth',
        interval: 'monthly',
        success_url: 'https://app.test/ajustes/suscripcion',
        cancel_url: 'https://app.test/ajustes/suscripcion',
      },
      { headers: { 'Idempotency-Key': 'idem-key-1' } },
    )
  })

  it('does not create a second session on double click while pending', async () => {
    const user = userEvent.setup()
    createBillingCheckoutSessionMock.mockReturnValue(new Promise(() => {}))
    renderModal()

    const growthButton = screen.getAllByRole('button', {
      name: 'Probar 7 días gratis',
    })[1]!
    await user.dblClick(growthButton)

    await waitFor(() => {
      expect(createBillingCheckoutSessionMock).toHaveBeenCalledTimes(1)
    })
  })

  it('redirects to checkout_url on success', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getAllByRole('button', { name: 'Probar 7 días gratis' })[0]!)

    await waitFor(() => {
      expect(window.location.href).toBe('https://stripe.test/checkout')
    })
  })

  it('shows a toast and closes on already_subscribed', async () => {
    const user = userEvent.setup()
    createBillingCheckoutSessionMock.mockRejectedValue(
      new ApiError(403, 'already_subscribed', 'Already subscribed'),
    )
    const { toast } = await import('sonner')
    const { onClose } = renderModal()

    await user.click(screen.getAllByRole('button', { name: 'Probar 7 días gratis' })[0]!)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Tu workspace ya tiene un plan activo',
      )
    })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes with Escape', async () => {
    const user = userEvent.setup()
    const { onClose } = renderModal()

    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })
})
