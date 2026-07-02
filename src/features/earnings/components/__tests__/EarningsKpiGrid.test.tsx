import { describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'

import type {
  CreatorEarningsKPI,
  Wallet,
} from '#/shared/api/generated/model'
import { EarningsKpiGrid } from '../EarningsKpiGrid'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce(
        (acc, str, index) => acc + str + (values[index] ?? ''),
        '',
      ),
    { __lingui: true },
  ),
}))

vi.mock('@lingui/react/macro', () => ({
  Trans: ({ children }: { children: ReactNode }) => children,
}))

const kpis: CreatorEarningsKPI = {
  total_earned: { amount: '48920.00' },
  earned_in_period: { amount: '12450.00' },
  pending_payout: { amount: '3275.00' },
  next_payout: {
    amount: '1840.00',
    estimated_date: '2026-05-12T00:00:00.000Z',
    date_available: true,
  },
}

const wallet: Wallet = {
  balance: { amount: '5000.00', currency: 'USD' },
  withdrawal_fee_pct: '0',
  min_withdrawal: { amount: '25.00', currency: 'USD' },
  can_withdraw: true,
  eligibility: {
    requires_w8ben: false,
    w8ben_redirect_url: null,
    has_payout_account: true,
    has_inflight_withdrawal: false,
  },
}

describe('EarningsKpiGrid', () => {
  it('renders Total ganado, Ganado en el período, and Balance disponible', () => {
    render(<EarningsKpiGrid kpis={kpis} wallet={wallet} />)

    expect(screen.getByText('Total ganado')).toBeInTheDocument()
    expect(screen.getByText('Ganado en el período')).toBeInTheDocument()
    expect(screen.getByText('Balance disponible')).toBeInTheDocument()
    expect(screen.getByText('$5,000')).toBeInTheDocument()
  })

  it('does NOT render Próximo pago or Pago pendiente', () => {
    render(<EarningsKpiGrid kpis={kpis} wallet={wallet} />)

    expect(screen.queryByText('Próximo pago')).not.toBeInTheDocument()
    expect(screen.queryByText('Pago pendiente')).not.toBeInTheDocument()
  })

  it('shows pending non-withdrawable line when pending + next > 0', () => {
    render(<EarningsKpiGrid kpis={kpis} wallet={wallet} />)

    expect(screen.getByText('Pendiente (no retirable):')).toBeInTheDocument()
    expect(screen.getByText('$5,115')).toBeInTheDocument()
  })

  it('hides pending non-withdrawable line when both amounts are 0', () => {
    const zeroKpis: CreatorEarningsKPI = {
      ...kpis,
      pending_payout: { amount: '0' },
      next_payout: { ...kpis.next_payout, amount: '0' },
    }

    render(<EarningsKpiGrid kpis={zeroKpis} wallet={wallet} />)

    expect(
      screen.queryByText('Pendiente (no retirable):'),
    ).not.toBeInTheDocument()
  })

  it('shows skeleton when wallet is undefined', () => {
    const { container } = render(
      <EarningsKpiGrid kpis={kpis} wallet={undefined} />,
    )

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
    expect(screen.queryByText('Balance disponible')).not.toBeInTheDocument()
  })

  it('renders withdrawButton slot', () => {
    render(
      <EarningsKpiGrid
        kpis={kpis}
        wallet={wallet}
        withdrawButton={<button>Retirar</button>}
      />,
    )

    expect(screen.getByRole('button', { name: 'Retirar' })).toBeInTheDocument()
  })
})
