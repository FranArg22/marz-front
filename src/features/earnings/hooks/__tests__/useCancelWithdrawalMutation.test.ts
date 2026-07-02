import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useCancelMyWithdrawal,
  getGetMyWalletQueryKey,
  getListMyWithdrawalsQueryKey,
} from '#/shared/api/generated/creator/creator'
import { useCancelWithdrawalMutation } from '../useCancelWithdrawalMutation'

vi.mock('#/shared/api/generated/creator/creator', () => ({
  useCancelMyWithdrawal: vi.fn(),
  getGetMyWalletQueryKey: vi.fn(() => ['/v1/creators/me/wallet']),
  getListMyWithdrawalsQueryKey: vi.fn(
    () => ['/v1/creators/me/withdrawals', {}] as const,
  ),
}))

const mockUseCancelMyWithdrawal = vi.mocked(useCancelMyWithdrawal)

describe('useCancelWithdrawalMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseCancelMyWithdrawal.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as never)
  })

  it('invalidates wallet and withdrawals queries onSuccess', async () => {
    let capturedOnSuccess: (() => void) | undefined
    mockUseCancelMyWithdrawal.mockImplementation((options) => {
      capturedOnSuccess = options?.mutation?.onSuccess as
        | (() => void)
        | undefined
      return { mutateAsync: vi.fn(), isPending: false } as never
    })

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    renderHook(() => useCancelWithdrawalMutation(), {
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
