import { describe, it, expect, vi, beforeEach } from 'vitest'
import { redirect } from '@tanstack/react-router'

import { ApiError } from '#/shared/api/mutator'

vi.mock('#/features/billing/components/BillingPage', () => ({
  BillingPage: () => null,
}))

interface MockQueryClient {
  ensureQueryData: ReturnType<typeof vi.fn>
}

function makeQueryClient(): MockQueryClient {
  return { ensureQueryData: vi.fn() }
}

async function callLoader(queryClient: MockQueryClient) {
  const { Route } = await import('./billing')
  const loader = (
    Route.options as unknown as {
      loader: (opts: {
        context: { queryClient: MockQueryClient }
      }) => Promise<void>
    }
  ).loader
  return loader({ context: { queryClient } })
}

describe('/_brand/billing loader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to / when subscription endpoint returns 404 response object', async () => {
    const queryClient = makeQueryClient()
    queryClient.ensureQueryData.mockResolvedValue({
      status: 404,
      data: { code: 'no_subscription', message: 'no sub' },
    })

    await expect(callLoader(queryClient)).rejects.toEqual(redirect({ to: '/' }))
  })

  it('redirects to / when ApiError 404 is thrown', async () => {
    const queryClient = makeQueryClient()
    queryClient.ensureQueryData.mockRejectedValue(
      new ApiError(404, 'no_subscription', 'not found'),
    )

    await expect(callLoader(queryClient)).rejects.toEqual(redirect({ to: '/' }))
  })

  it('does not redirect when subscription is active', async () => {
    const queryClient = makeQueryClient()
    queryClient.ensureQueryData.mockResolvedValue({
      status: 200,
      data: { plan: 'starter', status: 'active' },
    })

    await expect(callLoader(queryClient)).resolves.toBeUndefined()
  })

  it('rethrows non-404 errors', async () => {
    const queryClient = makeQueryClient()
    const boom = new ApiError(500, 'internal', 'server error')
    queryClient.ensureQueryData.mockRejectedValue(boom)

    await expect(callLoader(queryClient)).rejects.toBe(boom)
  })
})
