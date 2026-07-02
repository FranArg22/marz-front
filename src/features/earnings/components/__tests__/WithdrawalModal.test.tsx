import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Wallet } from '#/shared/api/generated/model'
import { ApiError } from '#/shared/api/mutator'
import { WithdrawalModal } from '../WithdrawalModal'

vi.mock('#/shared/api/idempotency', () => ({
  generateIdempotencyKey: () => 'test-idempotency-key',
}))

const mockMutateAsync = vi.fn()
vi.mock('../../hooks/useCreateWithdrawalMutation', () => ({
  useCreateWithdrawalMutation: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}))

function makeWallet(overrides?: Partial<Wallet>): Wallet {
  return {
    balance: { amount: '152.50', currency: 'USD' },
    withdrawal_fee_pct: '2.5',
    min_withdrawal: { amount: '10.00', currency: 'USD' },
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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

function renderModal(overrides?: Partial<Wallet>) {
  const onOpenChange = vi.fn()
  const onSuccess = vi.fn()
  const wallet = makeWallet(overrides)

  const result = render(
    <WithdrawalModal
      open
      wallet={wallet}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
    />,
    { wrapper: createWrapper() },
  )

  return { ...result, onOpenChange, onSuccess }
}

describe('WithdrawalModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows breakdown for input 100', async () => {
    const user = userEvent.setup()
    renderModal()

    const input = screen.getByLabelText('Monto bruto')
    await user.type(input, '100')

    expect(screen.getByText('$100.00')).toBeInTheDocument()
    expect(screen.getByText('− $2.50')).toBeInTheDocument()
    expect(screen.getByText('$97.50')).toBeInTheDocument()
  })

  it('shows minimum error for input 5', async () => {
    const user = userEvent.setup()
    renderModal()

    const input = screen.getByLabelText('Monto bruto')
    await user.type(input, '5')

    expect(screen.getByText('Mínimo $10.00')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Confirmar retiro/ }),
    ).toBeDisabled()
  })

  it('shows insufficient balance error for input above balance', async () => {
    const user = userEvent.setup()
    renderModal()

    const input = screen.getByLabelText('Monto bruto')
    await user.type(input, '200')

    expect(screen.getByText('Saldo insuficiente')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Confirmar retiro/ }),
    ).toBeDisabled()
  })

  it('shows success step after successful submit', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockResolvedValueOnce({
      data: {
        id: 'w-1',
        status: 'queued',
        gross: '100.00',
        fee: '2.50',
        net: '97.50',
        currency: 'USD',
        requested_at: '2026-07-02T00:00:00Z',
      },
      status: 201,
      headers: new Headers(),
    })

    renderModal()

    const input = screen.getByLabelText('Monto bruto')
    await user.type(input, '100')
    await user.click(screen.getByRole('button', { name: /Confirmar retiro/ }))

    await waitFor(() => {
      expect(
        screen.getByText(/¡Solicitud enviada!/),
      ).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /Cerrar/ })).toBeInTheDocument()
  })

  it('shows inline error for withdrawal_in_flight', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockRejectedValueOnce(
      new ApiError(409, 'withdrawal_in_flight', 'Already in flight'),
    )

    renderModal()

    const input = screen.getByLabelText('Monto bruto')
    await user.type(input, '50')
    await user.click(screen.getByRole('button', { name: /Confirmar retiro/ }))

    await waitFor(() => {
      expect(
        screen.getByText('Ya tenés un retiro en proceso'),
      ).toBeInTheDocument()
    })
  })
})
