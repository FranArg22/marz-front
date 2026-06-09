import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createDiscoveryConnectionRequest,
  type createDiscoveryConnectionRequestResponse,
} from '#/shared/api/generated/brand/brand'
import { GetDiscoveryCreatorsSort } from '#/shared/api/generated/model'
import { ApiError } from '#/shared/api/mutator'

import { useCreateConnectionRequestMutation } from './useCreateConnectionRequestMutation'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}))

vi.mock('#/shared/api/generated/brand/brand', async () => {
  const actual =
    await vi.importActual<typeof import('#/shared/api/generated/brand/brand')>(
      '#/shared/api/generated/brand/brand',
    )

  return {
    ...actual,
    createDiscoveryConnectionRequest: vi.fn(),
  }
})

const mockCreateDiscoveryConnectionRequest = vi.mocked(
  createDiscoveryConnectionRequest,
)

const appliedParams = { sort: GetDiscoveryCreatorsSort.recommended }

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function createWrapper(queryClient = createTestQueryClient()) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

function createSuccessResponse(): createDiscoveryConnectionRequestResponse {
  return {
    status: 201,
    headers: new Headers(),
    data: {
      connection_request_id: 'connection-request-1',
      status: 'pending',
      expires_at: '2026-06-10T00:00:00Z',
      pair_state_kind: 'connection_pending',
    },
  }
}

describe('useCreateConnectionRequestMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    let keyIndex = 0
    vi.stubGlobal('crypto', {
      randomUUID: () => `idempotency-key-${++keyIndex}`,
    })
  })

  it('shows success toast, invalidates discovery grid, and sends Idempotency-Key on success', async () => {
    const queryClient = createTestQueryClient()
    const invalidateQueries = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue()
    mockCreateDiscoveryConnectionRequest.mockResolvedValueOnce(
      createSuccessResponse(),
    )

    const { result } = renderHook(
      () => useCreateConnectionRequestMutation(appliedParams),
      { wrapper: createWrapper(queryClient) },
    )

    act(() => {
      result.current.mutate({
        creator_account_id: 'creator-1',
        note: 'Hola',
      })
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockCreateDiscoveryConnectionRequest).toHaveBeenCalledWith(
      { creator_account_id: 'creator-1', note: 'Hola' },
      expect.objectContaining({
        headers: expect.objectContaining({
          'Idempotency-Key': 'idempotency-key-1',
        }),
      }),
    )
    expect(toast.success).toHaveBeenCalledWith('Invitación enviada')
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['discovery', 'creators', appliedParams],
    })
  })

  it('shows info toast for 409 already_pending without generic error toast', async () => {
    mockCreateDiscoveryConnectionRequest.mockRejectedValueOnce(
      new ApiError(409, 'already_pending', 'Conflict'),
    )

    const { result } = renderHook(
      () => useCreateConnectionRequestMutation(appliedParams),
      { wrapper: createWrapper() },
    )

    act(() => {
      result.current.mutate({
        creator_account_id: 'creator-1',
        note: null,
      })
    })

    await waitFor(() => {
      expect(toast.info).toHaveBeenCalledWith(
        'Ya enviaste una invitación a este creator.',
      )
    })
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('shows info toast for 409 has_conversation', async () => {
    mockCreateDiscoveryConnectionRequest.mockRejectedValueOnce(
      new ApiError(409, 'has_conversation', 'Conflict'),
    )

    const { result } = renderHook(
      () => useCreateConnectionRequestMutation(appliedParams),
      { wrapper: createWrapper() },
    )

    act(() => {
      result.current.mutate({
        creator_account_id: 'creator-1',
        note: null,
      })
    })

    await waitFor(() => {
      expect(toast.info).toHaveBeenCalledWith(
        'Ya tenés una conversación con este creator.',
      )
    })
  })

  it('shows info toast for 409 has_active_offer', async () => {
    mockCreateDiscoveryConnectionRequest.mockRejectedValueOnce(
      new ApiError(409, 'has_active_offer', 'Conflict'),
    )

    const { result } = renderHook(
      () => useCreateConnectionRequestMutation(appliedParams),
      { wrapper: createWrapper() },
    )

    act(() => {
      result.current.mutate({
        creator_account_id: 'creator-1',
        note: null,
      })
    })

    await waitFor(() => {
      expect(toast.info).toHaveBeenCalledWith(
        'Ya tenés una oferta activa con este creator.',
      )
    })
  })

  it('shows generic error toast for generic errors', async () => {
    mockCreateDiscoveryConnectionRequest.mockRejectedValueOnce(
      new Error('Network error'),
    )

    const { result } = renderHook(
      () => useCreateConnectionRequestMutation(appliedParams),
      { wrapper: createWrapper() },
    )

    act(() => {
      result.current.mutate({
        creator_account_id: 'creator-1',
        note: null,
      })
    })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Algo salió mal. Intentá de nuevo.',
      )
    })
  })
})
