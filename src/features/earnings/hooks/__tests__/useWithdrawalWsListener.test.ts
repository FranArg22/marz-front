import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { ReactNode } from 'react'

import {
  getGetMyWalletQueryKey,
  getGetMyWithdrawalQueryKey,
  getListMyWithdrawalsQueryKey,
} from '#/shared/api/generated/creator/creator'
import { useWithdrawalWsListener } from '../useWithdrawalWsListener'

let mockWsHandlers: Record<string, (event: unknown) => void> = {}

vi.mock('#/shared/ws/useWebSocket', () => ({
  useWebSocket: (opts: {
    handlers?: Record<string, (event: unknown) => void>
    enabled?: boolean
  }) => {
    mockWsHandlers = opts.handlers ?? {}
    return { status: 'open', send: vi.fn() }
  },
}))

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return {
    queryClient,
    Wrapper: ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children),
  }
}

describe('useWithdrawalWsListener', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockWsHandlers = {}
  })

  it('registers a withdrawal.updated handler via useWebSocket', () => {
    const { Wrapper } = makeWrapper()
    renderHook(() => useWithdrawalWsListener(), { wrapper: Wrapper })

    expect(mockWsHandlers['withdrawal.updated']).toBeDefined()
  })

  it('invalidates wallet, withdrawals list and withdrawal detail on event', () => {
    const { queryClient, Wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    renderHook(() => useWithdrawalWsListener(), { wrapper: Wrapper })

    act(() => {
      mockWsHandlers['withdrawal.updated']!({
        event_id: 'evt-1',
        event_type: 'withdrawal.updated',
        schema_version: '1',
        aggregate_id: 'w-1',
        aggregate_type: 'withdrawal',
        occurred_at: '2026-07-01T00:00:00Z',
        payload: {
          id: 'w-1',
          status: 'sent',
          net: { amount: '97.50', currency: 'USD' },
        },
      })
    })

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: getGetMyWalletQueryKey() }),
    )
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: getListMyWithdrawalsQueryKey({}) }),
    )
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: getGetMyWithdrawalQueryKey('w-1'),
      }),
    )
  })
})
