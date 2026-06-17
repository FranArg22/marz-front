import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { BillingSubscription } from '../hooks/useBillingSubscription'
import { SubscriptionSection } from './SubscriptionSection'

const subscriptionMock = vi.fn()
const paymentMethodsMock = vi.fn()
const usageMock = vi.fn()
const meMock = vi.fn()

vi.mock('#/shared/api/generated/accounts/accounts', () => ({
  useMe: () => meMock(),
}))

vi.mock('../hooks/useBillingSubscription', () => ({
  useBillingSubscription: (opts: unknown) => subscriptionMock(opts),
}))

vi.mock('../hooks/useOffersPaymentMethod', () => ({
  useOffersPaymentMethods: () => paymentMethodsMock(),
}))

vi.mock('#/shared/api/generated/billing/billing', () => ({
  useGetPlanUsage: () => usageMock(),
}))

vi.mock('./BillingSummary', () => ({
  BillingSummary: ({ usageSlot }: { usageSlot?: React.ReactNode }) => (
    <div>BillingSummary{usageSlot}</div>
  ),
}))

vi.mock('./FreePlanCTA', () => ({
  FreePlanCTA: () => <div>FreePlanCTA</div>,
}))

vi.mock('./PlanUsageCard', () => ({
  PlanUsageCard: () => <div>PlanUsageCard</div>,
}))

function subscription(
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
    subscription_payment_method: null,
    offers_payment_method: null,
    same_payment_method: true,
    next_invoice_amount_usd: '49.00',
    next_invoice_at: '2026-06-01T00:00:00Z',
    days_until_trial_ends: null,
    days_until_downgrade: null,
    ...overrides,
  }
}

function setMe(plan: string) {
  meMock.mockReturnValue({
    isLoading: false,
    data: { status: 200, data: { kind: 'brand', brand_workspace: { plan } } },
  })
}

function setUsage() {
  usageMock.mockReturnValue({
    isLoading: false,
    data: {
      status: 200,
      data: {
        campaigns_active: { current: 1, limit: 1, available: true },
        creators_active: { current: 2, limit: null, available: true },
        invitations: {
          current: 0,
          limit: 0,
          cycle_resets_at: null,
          available: true,
        },
      },
    },
  })
}

describe('SubscriptionSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setUsage()
    subscriptionMock.mockReturnValue({ isLoading: false, data: undefined })
    paymentMethodsMock.mockReturnValue({
      isLoading: false,
      data: {
        status: 200,
        data: { payment_methods: [], same_payment_method: true },
      },
    })
  })

  it('renders FreePlanCTA and PlanUsageCard for free plan', () => {
    setMe('free')

    render(<SubscriptionSection />)

    expect(screen.getByText('FreePlanCTA')).toBeInTheDocument()
    expect(screen.getByText('PlanUsageCard')).toBeInTheDocument()
    expect(screen.queryByText('BillingSummary')).not.toBeInTheDocument()
  })

  it('does not fetch the subscription for free plans', () => {
    setMe('free')

    render(<SubscriptionSection />)

    // The plan from /me is the source of truth — free brands never hit the
    // subscription endpoint (no 404/retries, no "detect free from a failure").
    expect(subscriptionMock).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    )
  })

  it('renders BillingSummary and PlanUsageCard for paid plan', () => {
    setMe('growth')
    subscriptionMock.mockReturnValue({
      isLoading: false,
      data: { status: 200, data: subscription({ plan: 'growth' }) },
    })

    render(<SubscriptionSection />)

    expect(screen.getByText('BillingSummary')).toBeInTheDocument()
    expect(screen.getByText('PlanUsageCard')).toBeInTheDocument()
    expect(screen.queryByText('FreePlanCTA')).not.toBeInTheDocument()
    expect(subscriptionMock).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true }),
    )
  })
})
