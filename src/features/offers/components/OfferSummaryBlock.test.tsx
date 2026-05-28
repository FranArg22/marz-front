import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { OfferSummaryBlock } from './OfferSummaryBlock'

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

  it('does not render the charge legend for free workspaces', () => {
    render(<OfferSummaryBlock amount={100} plan="free" />)

    expect(
      screen.queryByText('El cobro se realiza cuando el creator acepta'),
    ).not.toBeInTheDocument()
  })

  it('renders the charge legend for starter workspaces', () => {
    render(<OfferSummaryBlock amount={100} plan="starter" />)

    expect(
      screen.getByText('El cobro se realiza cuando el creator acepta'),
    ).toBeInTheDocument()
  })

  it('renders the charge legend for growth workspaces', () => {
    render(<OfferSummaryBlock amount={100} plan="growth" />)

    expect(
      screen.getByText('El cobro se realiza cuando el creator acepta'),
    ).toBeInTheDocument()
  })
})
