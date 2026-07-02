import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  ListMyWithdrawals200,
  WithdrawalListItem,
  Withdrawal,
} from '#/shared/api/generated/model'
import { WithdrawalsHistory } from '../WithdrawalsHistory'

const mockCancelMutateAsync = vi.fn()

vi.mock('../../hooks/useWithdrawalsQuery', () => ({
  useWithdrawalsQuery: vi.fn(),
  getWithdrawalsQueryKey: vi.fn(() => ['/v1/creators/me/withdrawals', {}]),
}))

vi.mock('../../hooks/useCancelWithdrawalMutation', () => ({
  useCancelWithdrawalMutation: () => ({
    mutateAsync: mockCancelMutateAsync,
    isPending: false,
  }),
}))

vi.mock('../../hooks/useWithdrawalDetailQuery', () => ({
  useWithdrawalDetailQuery: vi.fn(),
}))

const { useWithdrawalsQuery } = await import('../../hooks/useWithdrawalsQuery')
const { useWithdrawalDetailQuery } = await import(
  '../../hooks/useWithdrawalDetailQuery'
)
const mockUseWithdrawalsQuery = vi.mocked(useWithdrawalsQuery)
const mockUseWithdrawalDetailQuery = vi.mocked(useWithdrawalDetailQuery)

function makeItem(overrides?: Partial<WithdrawalListItem>): WithdrawalListItem {
  return {
    id: 'w-1',
    status: 'sent',
    net: { amount: '97.50', currency: 'USD' },
    requested_at: '2026-06-15T10:00:00Z',
    sent_at: '2026-06-16T10:00:00Z',
    failed_at: null,
    ...overrides,
  }
}

function makeQueryResult(
  data: ListMyWithdrawals200 | undefined,
  isLoading = false,
) {
  return {
    data,
    isLoading,
    isError: false,
    queryKey: ['/v1/creators/me/withdrawals', {}] as const,
  } as unknown as ReturnType<typeof useWithdrawalsQuery>
}

function makeDetailResult(data: Withdrawal | undefined, isLoading = false) {
  return {
    data,
    isLoading,
    isError: false,
  } as ReturnType<typeof useWithdrawalDetailQuery>
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

describe('WithdrawalsHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseWithdrawalDetailQuery.mockReturnValue(
      makeDetailResult(undefined, true),
    )
  })

  it('renders skeletons while loading', () => {
    mockUseWithdrawalsQuery.mockReturnValue(makeQueryResult(undefined, true))

    render(<WithdrawalsHistory />, { wrapper: createWrapper() })

    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBe(3)
  })

  it('shows empty message when list is empty', () => {
    mockUseWithdrawalsQuery.mockReturnValue(
      makeQueryResult({ items: [], total: 0, page: 1, per_page: 10 }),
    )

    render(<WithdrawalsHistory />, { wrapper: createWrapper() })

    expect(
      screen.getByText('Todavía no realizaste ningún retiro.'),
    ).toBeInTheDocument()
  })

  it('shows date, net amount and status badge for items', () => {
    mockUseWithdrawalsQuery.mockReturnValue(
      makeQueryResult({
        items: [makeItem()],
        total: 1,
        page: 1,
        per_page: 10,
      }),
    )

    render(<WithdrawalsHistory />, { wrapper: createWrapper() })

    expect(screen.getByText('Jun 15, 2026')).toBeInTheDocument()
    expect(screen.getByText('$97.50')).toBeInTheDocument()
    expect(screen.getByText('Enviado ✓')).toBeInTheDocument()
  })

  it('shows "Enviado ✓" badge for sent status', () => {
    mockUseWithdrawalsQuery.mockReturnValue(
      makeQueryResult({
        items: [makeItem({ status: 'sent' })],
        total: 1,
        page: 1,
        per_page: 10,
      }),
    )

    render(<WithdrawalsHistory />, { wrapper: createWrapper() })

    expect(screen.getByText('Enviado ✓')).toBeInTheDocument()
  })

  it('shows "Falló" badge for failed status', () => {
    mockUseWithdrawalsQuery.mockReturnValue(
      makeQueryResult({
        items: [makeItem({ status: 'failed' })],
        total: 1,
        page: 1,
        per_page: 10,
      }),
    )

    render(<WithdrawalsHistory />, { wrapper: createWrapper() })

    expect(screen.getByText('Falló')).toBeInTheDocument()
  })

  it('shows "En cola" badge and Cancel button for requested status', () => {
    mockUseWithdrawalsQuery.mockReturnValue(
      makeQueryResult({
        items: [makeItem({ status: 'requested' })],
        total: 1,
        page: 1,
        per_page: 10,
      }),
    )

    render(<WithdrawalsHistory />, { wrapper: createWrapper() })

    expect(screen.getByText('En cola')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Cancelar/ }),
    ).toBeInTheDocument()
  })

  it('does not show Cancel button for sent status', () => {
    mockUseWithdrawalsQuery.mockReturnValue(
      makeQueryResult({
        items: [makeItem({ status: 'sent' })],
        total: 1,
        page: 1,
        per_page: 10,
      }),
    )

    render(<WithdrawalsHistory />, { wrapper: createWrapper() })

    const cancelButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.textContent === 'Cancelar')
    expect(cancelButtons).toHaveLength(0)
  })

  it('calls cancel mutation after confirmation', async () => {
    const user = userEvent.setup()
    mockCancelMutateAsync.mockResolvedValueOnce({})
    mockUseWithdrawalsQuery.mockReturnValue(
      makeQueryResult({
        items: [makeItem({ id: 'w-cancel-1', status: 'requested' })],
        total: 1,
        page: 1,
        per_page: 10,
      }),
    )

    render(<WithdrawalsHistory />, { wrapper: createWrapper() })

    await user.click(screen.getByRole('button', { name: /Cancelar/ }))

    await waitFor(() => {
      expect(screen.getByText('¿Cancelar este retiro?')).toBeInTheDocument()
    })

    await user.click(
      screen.getByRole('button', { name: /Confirmar cancelación/ }),
    )

    await waitFor(() => {
      expect(mockCancelMutateAsync).toHaveBeenCalledWith({
        id: 'w-cancel-1',
      })
    })
  })

  it('opens detail modal when clicking "Ver detalle"', async () => {
    const user = userEvent.setup()
    mockUseWithdrawalsQuery.mockReturnValue(
      makeQueryResult({
        items: [makeItem({ id: 'w-detail-1' })],
        total: 1,
        page: 1,
        per_page: 10,
      }),
    )
    mockUseWithdrawalDetailQuery.mockReturnValue(
      makeDetailResult({
        id: 'w-detail-1',
        status: 'sent',
        gross: { amount: '100.00', currency: 'USD' },
        fee: { amount: '2.50', currency: 'USD' },
        net: { amount: '97.50', currency: 'USD' },
        requested_at: '2026-06-15T10:00:00Z',
        sent_at: '2026-06-16T10:00:00Z',
        failed_at: null,
        cancelled_at: null,
        mercury_transaction_id: null,
        failure_reason: null,
        failure_category: null,
      }),
    )

    render(<WithdrawalsHistory />, { wrapper: createWrapper() })

    await user.click(screen.getByRole('button', { name: /Ver detalle/ }))

    await waitFor(() => {
      expect(screen.getByText('Comprobante de retiro')).toBeInTheDocument()
    })

    const dialog = screen.getByRole('dialog')
    const withinDialog = (text: string) =>
      [...dialog.querySelectorAll('*')].some((el) => el.textContent === text)

    expect(withinDialog('$100.00')).toBe(true)
    expect(withinDialog('− $2.50')).toBe(true)
    expect(screen.getAllByText('$97.50').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Jun 15, 2026').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Jun 16, 2026')).toBeInTheDocument()
  })
})
