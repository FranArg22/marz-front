import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import { createBillingCheckoutSession } from '#/shared/api/generated/brand/brand'
import type { createBillingCheckoutSessionResponse } from '#/shared/api/generated/brand/brand'

import { useCreateCheckoutSession } from './useCreateCheckoutSession'

vi.mock('#/shared/api/generated/brand/brand', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('#/shared/api/generated/brand/brand')>()
  return { ...actual, createBillingCheckoutSession: vi.fn() }
})

const mockCreate = vi.mocked(createBillingCheckoutSession)

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

const payload = {
  plan: 'starter',
  interval: 'month',
  success_url: 'https://app.marz.test/billing?ok',
  cancel_url: 'https://app.marz.test/billing?cancel',
} as Parameters<typeof createBillingCheckoutSession>[0]

describe('useCreateCheckoutSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreate.mockResolvedValue({
      status: 201,
      data: { url: 'https://stripe.test/checkout/abc' },
    } as unknown as createBillingCheckoutSessionResponse)
  })

  it('sends a non-empty Idempotency-Key that differs across invocations', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const { result } = renderHook(() => useCreateCheckoutSession(), {
      wrapper: createWrapper(queryClient),
    })

    await result.current.mutateAsync({ data: payload })
    await result.current.mutateAsync({ data: payload })

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
