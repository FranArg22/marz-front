import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query'
import type { ReactNode } from 'react'

import { useBillingPlans } from './useBillingPlans'

const listBillingPlansMock = vi.fn()

vi.mock('#/shared/api/generated/brand/brand', () => ({
  useListBillingPlans: () =>
    useQuery({
      queryKey: ['listBillingPlans'],
      queryFn: () => listBillingPlansMock(),
    }),
}))

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('useBillingPlans', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns plans from the generated query hook', async () => {
    listBillingPlansMock.mockResolvedValue({
      status: 200,
      data: { plans: [{ id: 'starter' }] },
    })

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const { result } = renderHook(() => useBillingPlans(), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect((result.current.data as { status: number }).status).toBe(200)
    expect(listBillingPlansMock).toHaveBeenCalledTimes(1)
  })
})
