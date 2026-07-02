import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import { createElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useListMyWithdrawals,
  getListMyWithdrawalsQueryKey,
} from '#/shared/api/generated/creator/creator'
import { useWithdrawalsQuery } from '../useWithdrawalsQuery'

vi.mock('#/shared/api/generated/creator/creator', () => ({
  useListMyWithdrawals: vi.fn(),
  getListMyWithdrawalsQueryKey: vi.fn(
    (params) => ['/v1/creators/me/withdrawals', params] as const,
  ),
}))

const mockUseListMyWithdrawals = vi.mocked(useListMyWithdrawals)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('useWithdrawalsQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseListMyWithdrawals.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as never)
  })

  it('calls useListMyWithdrawals with correct params', () => {
    renderHook(() => useWithdrawalsQuery({ page: 2, per_page: 10 }), {
      wrapper: createWrapper(),
    })

    expect(mockUseListMyWithdrawals).toHaveBeenCalledWith(
      { page: 2, per_page: 10 },
      expect.objectContaining({
        query: expect.objectContaining({
          queryKey: getListMyWithdrawalsQueryKey({ page: 2, per_page: 10 }),
        }),
      }),
    )
  })

  it('defaults to empty params', () => {
    renderHook(() => useWithdrawalsQuery(), {
      wrapper: createWrapper(),
    })

    expect(mockUseListMyWithdrawals).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        query: expect.objectContaining({
          queryKey: getListMyWithdrawalsQueryKey({}),
        }),
      }),
    )
  })
})
