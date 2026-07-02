import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useCreateWithdrawal,
  getGetMyWalletQueryKey,
  getListMyWithdrawalsQueryKey,
} from '#/shared/api/generated/creator/creator'
import { useCreateWithdrawalMutation } from '../useCreateWithdrawalMutation'

vi.mock('#/shared/api/generated/creator/creator', () => ({
  useCreateWithdrawal: vi.fn(),
  getGetMyWalletQueryKey: vi.fn(() => ['/v1/creators/me/wallet']),
  getListMyWithdrawalsQueryKey: vi.fn(
    () => ['/v1/creators/me/withdrawals', {}] as const,
  ),
}))

const mockUseCreateWithdrawal = vi.mocked(useCreateWithdrawal)

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

describe('useCreateWithdrawalMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseCreateWithdrawal.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as never)
  })

  it('passes Idempotency-Key via request headers', () => {
    renderHook(() => useCreateWithdrawalMutation('my-key'), {
      wrapper: createWrapper(),
    })

    expect(mockUseCreateWithdrawal).toHaveBeenCalledWith(
      expect.objectContaining({
        request: { headers: { 'Idempotency-Key': 'my-key' } },
      }),
    )
  })

  it('invalidates wallet and withdrawals queries onSuccess', async () => {
    let capturedOnSuccess: (() => void) | undefined
    mockUseCreateWithdrawal.mockImplementation((options) => {
      capturedOnSuccess = options?.mutation?.onSuccess as (() => void) | undefined
      return { mutateAsync: vi.fn(), isPending: false } as never
    })

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    renderHook(() => useCreateWithdrawalMutation('key-2'), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        createElement(QueryClientProvider, { client: queryClient }, children),
    })

    expect(capturedOnSuccess).toBeDefined()
    capturedOnSuccess!()

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: getGetMyWalletQueryKey(),
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: getListMyWithdrawalsQueryKey({}),
      })
    })
  })
})
