import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getGetAnalyticsDashboardOnboardingChecklistQueryKey } from '#/shared/api/generated/analytics/analytics'
import { useApproveDraft as useApproveDraftGenerated } from '#/shared/api/generated/deliverables/deliverables'

import { useApproveDraftMutation } from './draftUpload'

vi.mock('#/shared/api/generated/deliverables/deliverables', () => ({
  useApproveDraft: vi.fn(),
}))

const mockUseApproveDraftGenerated = vi.mocked(useApproveDraftGenerated)

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

describe('draft upload mutation wrappers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseApproveDraftGenerated.mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn().mockResolvedValue({ status: 200, data: {} }),
    } as unknown as ReturnType<typeof useApproveDraftGenerated>)
  })

  it('invalidates the onboarding checklist after approving a draft', async () => {
    const queryClient = createQueryClient()
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(
      () => useApproveDraftMutation('deliverable-1'),
      {
        wrapper: createWrapper(queryClient),
      },
    )

    await result.current.mutateAsync()

    await waitFor(() => {
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: getGetAnalyticsDashboardOnboardingChecklistQueryKey(),
      })
    })
  })
})
