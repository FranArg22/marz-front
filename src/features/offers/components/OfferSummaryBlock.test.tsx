import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { getMaxPayout, OfferSummaryBlock } from './OfferSummaryBlock'

vi.mock('#/shared/api/generated/offers/offers', () => ({
  usePreviewOfferFee: () => ({
    data: {
      status: 200,
      data: {
        base_amount: '100.00',
        processing_fee: '3.30',
        total_amount: '103.30',
        currency: 'USD',
      },
    },
  }),
}))

describe('getMaxPayout', () => {
  it('calculates max payout from percentage and fixed bonus windows', () => {
    expect(
      getMaxPayout(1000, {
        enabled: true,
        speed_bonus_windows: [
          { window_hours: 24, bonus_amount: { type: 'percentage', value: 25 } },
          { window_hours: 48, bonus_amount: { type: 'fixed', amount_usd: 100 } },
        ],
      }),
    ).toBe(1350)
  })
})

describe('OfferSummaryBlock', () => {
  it('renders base amount, bonus ceiling, and max payout', () => {
    render(
      <OfferSummaryBlock
        amount={100}
        plan="starter"
        bonusTerms={{
          enabled: true,
          speed_bonus_windows: [
            {
              window_hours: 24,
              bonus_amount: { type: 'percentage', value: 10 },
            },
          ],
        }}
      />,
    )

    expect(screen.getByText('$100.00 USD (base)')).toBeInTheDocument()
    expect(screen.getByText('$10.00 USD (bonus)')).toBeInTheDocument()
    expect(screen.getByText('$110.00 USD (máximo)')).toBeInTheDocument()
  })

  it('renders base and max without a bonus line when bonuses are absent', () => {
    render(<OfferSummaryBlock amount={100} plan="starter" />)

    expect(screen.getByText('$100.00 USD (base)')).toBeInTheDocument()
    expect(screen.getByText('$100.00 USD (máximo)')).toBeInTheDocument()
    expect(screen.queryByText('$0.00 USD (bonus)')).not.toBeInTheDocument()
  })

  it('renders the Stripe processing fee and total for paid workspaces', () => {
    render(<OfferSummaryBlock amount={100} plan="starter" />)

    expect(
      screen.getByText('Comisión de procesamiento (Stripe)'),
    ).toBeInTheDocument()
    expect(screen.getByText('+$3.30')).toBeInTheDocument()
    expect(screen.getByText('$103.30')).toBeInTheDocument()
  })

  it('does not render the charge legend or fee for free workspaces', () => {
    render(<OfferSummaryBlock amount={100} plan="free" />)

    expect(
      screen.queryByText('El cobro se realiza cuando el creador acepta'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText('Total a cobrar a tu tarjeta'),
    ).not.toBeInTheDocument()
  })

  it('renders the charge legend for growth workspaces', () => {
    render(<OfferSummaryBlock amount={100} plan="growth" />)

    expect(
      screen.getByText('El cobro se realiza cuando el creador acepta'),
    ).toBeInTheDocument()
  })
})
