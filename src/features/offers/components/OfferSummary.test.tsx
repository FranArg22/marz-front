import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { getMaxPayout, OfferSummary } from './OfferSummary'

vi.mock('#/shared/api/generated/offers/offers', () => ({
  usePreviewOfferFee: () => ({
    data: {
      status: 200,
      data: {
        base_amount: '1000.00',
        processing_fee: '30.18',
        total_amount: '1030.18',
        currency: 'USD',
      },
    },
  }),
}))

describe('OfferSummary', () => {
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

  it('renders base amount and max payout', () => {
    render(
      <OfferSummary
        offerMode="same_content"
        amount={1000}
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

    expect(screen.getByText('$1,000.00')).toBeInTheDocument()
    expect(screen.getByText('$1,100.00')).toBeInTheDocument()
  })

  it('renders the Stripe processing fee and total charged', () => {
    render(<OfferSummary offerMode="same_content" amount={1000} />)

    expect(screen.getByText('+$30.18')).toBeInTheDocument()
    expect(screen.getByText('$1,030.18')).toBeInTheDocument()
  })
})
