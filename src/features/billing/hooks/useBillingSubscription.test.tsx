import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query'
import type { ReactNode } from 'react'

import { ApiError } from '#/shared/api/mutator'

import { useBillingSubscription } from './useBillingSubscription'

const getBillingSubscriptionMock = vi.fn()

vi.mock('#/shared/api/generated/brand/brand', () => ({
  useGetBillingSubscription: (opts?: {
    query?: {
      staleTime?: number
      refetchInterval?: number | false
      enabled?: boolean
    }
  }) =>
    useQuery({
      queryKey: ['getBillingSubscription'],
      queryFn: () => getBillingSubscriptionMock(),
      ...(opts?.query ?? {}),
    }),
}))

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('useBillingSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns subscription data on success', async () => {
    getBillingSubscriptionMock.mockResolvedValue({
      status: 200,
      data: { plan: 'starter', status: 'active' },
    })

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const { result } = renderHook(() => useBillingSubscription(), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect((result.current.data as { status: number }).status).toBe(200)
  })

  it('surfaces 404 no_subscription as ApiError', async () => {
    getBillingSubscriptionMock.mockRejectedValue(
      new ApiError(404, 'no_subscription', 'subscription not found'),
    )

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const { result } = renderHook(() => useBillingSubscription(), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.data).toBeUndefined()
    expect(result.current.error).toBeInstanceOf(ApiError)
    expect((result.current.error as unknown as ApiError).code).toBe(
      'no_subscription',
    )
  })
})
