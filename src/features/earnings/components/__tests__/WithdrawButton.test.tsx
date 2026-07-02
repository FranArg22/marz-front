import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { Wallet } from '#/shared/api/generated/model'
import { WithdrawButton } from '../WithdrawButton'

vi.mock('#/features/payments/settings/PayoutAccountModal', () => ({
  PayoutAccountModal: ({
    open,
  }: {
    open: boolean
    account: null
    onOpenChange: (v: boolean) => void
  }) => (open ? <div data-testid="payout-modal">PayoutAccountModal</div> : null),
}))

function makeWallet(overrides?: Partial<Wallet>): Wallet {
  return {
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
    ...overrides,
  }
}

describe('WithdrawButton', () => {
  it('renders skeleton when wallet is undefined', () => {
    const { container } = render(
      <WithdrawButton wallet={undefined} onWithdraw={vi.fn()} />,
    )

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows W-8BEN button and opens modal on click', async () => {
    const user = userEvent.setup()
    const wallet = makeWallet({
      can_withdraw: false,
      eligibility: {
        requires_w8ben: true,
        w8ben_redirect_url: 'https://pagos.go-marz.com/w8ben',
        has_payout_account: false,
        has_inflight_withdrawal: false,
      },
    })

    render(<WithdrawButton wallet={wallet} onWithdraw={vi.fn()} />)

    const btn = screen.getByRole('button', {
      name: /Completar formulario W-8BEN/,
    })
    expect(btn).toBeInTheDocument()

    await user.click(btn)

    expect(
      screen.getByText('Formulario W-8BEN requerido'),
    ).toBeInTheDocument()
  })

  it('shows add payout account button and opens modal on click', async () => {
    const user = userEvent.setup()
    const wallet = makeWallet({
      can_withdraw: false,
      eligibility: {
        requires_w8ben: false,
        w8ben_redirect_url: null,
        has_payout_account: false,
        has_inflight_withdrawal: false,
      },
    })

    render(<WithdrawButton wallet={wallet} onWithdraw={vi.fn()} />)

    const btn = screen.getByRole('button', {
      name: /Agregar cuenta de cobro/,
    })
    expect(btn).toBeInTheDocument()

    await user.click(btn)

    expect(screen.getByTestId('payout-modal')).toBeInTheDocument()
  })

  it('shows disabled button when withdrawal is in-flight', () => {
    const wallet = makeWallet({
      can_withdraw: false,
      eligibility: {
        requires_w8ben: false,
        w8ben_redirect_url: null,
        has_payout_account: true,
        has_inflight_withdrawal: true,
      },
    })

    render(<WithdrawButton wallet={wallet} onWithdraw={vi.fn()} />)

    const btn = screen.getByRole('button', { name: /Retiro en proceso/ })
    expect(btn).toBeDisabled()
  })

  it('shows enabled withdraw button and calls onWithdraw on click', async () => {
    const user = userEvent.setup()
    const onWithdraw = vi.fn()
    const wallet = makeWallet({ can_withdraw: true })

    render(<WithdrawButton wallet={wallet} onWithdraw={onWithdraw} />)

    const btn = screen.getByRole('button', { name: /Retirar/ })
    expect(btn).toBeEnabled()

    await user.click(btn)

    expect(onWithdraw).toHaveBeenCalledOnce()
  })

  it('shows disabled withdraw button when balance is zero', () => {
    const wallet = makeWallet({
      can_withdraw: false,
      balance: { amount: '0.00', currency: 'USD' },
    })

    render(<WithdrawButton wallet={wallet} onWithdraw={vi.fn()} />)

    const btn = screen.getByRole('button', { name: /Retirar/ })
    expect(btn).toBeDisabled()
  })
})
