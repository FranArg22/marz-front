import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import { createBillingPortalSession } from '#/shared/api/generated/brand/brand'
import type { createBillingPortalSessionResponse } from '#/shared/api/generated/brand/brand'

import { useCreatePortalSession } from './useCreatePortalSession'

vi.mock('#/shared/api/generated/brand/brand', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('#/shared/api/generated/brand/brand')>()
  return { ...actual, createBillingPortalSession: vi.fn() }
})

const mockCreate = vi.mocked(createBillingPortalSession)

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('useCreatePortalSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreate.mockResolvedValue({
      status: 201,
      data: { url: 'https://stripe.test/portal/abc' },
    } as unknown as createBillingPortalSessionResponse)
  })

  it('sends a non-empty Idempotency-Key that differs across invocations', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const { result } = renderHook(() => useCreatePortalSession(), {
      wrapper: createWrapper(queryClient),
    })

    await result.current.mutateAsync({ data: { return_url: null } })
    await result.current.mutateAsync({ data: { return_url: null } })

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledTimes(2)
    })

    const firstCallInit = mockCreate.mock.calls[0]?.[1] as RequestInit
    const secondCallInit = mockCreate.mock.calls[1]?.[1] as RequestInit
    const firstKey = (firstCallInit.headers as Record<string, string>)[
      'Idempotency-Key'
    ]
    const secondKey = (secondCallInit.headers as Record<string, string>)[
      'Idempotency-Key'
    ]

    expect(firstKey).toBeTruthy()
    expect(secondKey).toBeTruthy()
    expect(firstKey).not.toBe(secondKey)
  })
})
