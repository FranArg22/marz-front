import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  acceptCampaignDiscoveryApplication,
  rejectCampaignDiscoveryApplication,
} from '#/shared/api/generated/campaigns/campaigns'
import { useIdempotencyKey } from '#/shared/api/idempotency'
import { ApiError } from '#/shared/api/mutator'

import {
  handleDiscoveryMutationError,
  useAcceptApplication,
  useRejectApplication,
} from './mutations'

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
  },
}))

vi.mock('#/shared/api/generated/campaigns/campaigns', () => ({
  acceptCampaignDiscoveryApplication: vi.fn(),
  rejectCampaignDiscoveryApplication: vi.fn(),
}))

const mockAcceptCampaignDiscoveryApplication = vi.mocked(
  acceptCampaignDiscoveryApplication,
)
const mockRejectCampaignDiscoveryApplication = vi.mocked(
  rejectCampaignDiscoveryApplication,
)

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

describe('campaign application mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    let keyIndex = 0
    vi.stubGlobal('crypto', {
      randomUUID: () => `idempotency-key-${++keyIndex}`,
    })
  })

  it('useAcceptApplication navigates to the new conversation on success', async () => {
    const onConversationReady = vi.fn()
    mockAcceptCampaignDiscoveryApplication.mockResolvedValueOnce({
      status: 200,
      headers: new Headers(),
      data: {
        application_id: 'application-1',
        status: 'accepted',
        decided_at: '2026-05-08T00:00:00Z',
        conversation: { id: 'conv-new' },
      },
    })

    const { result } = renderHook(
      () =>
        useAcceptApplication('campaign-1', {
          onConversationReady,
        }),
      { wrapper: createWrapper() },
    )

    act(() => {
      result.current.mutate({ applicationId: 'application-1' })
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(onConversationReady).toHaveBeenCalledWith('conv-new')
  })

  it('useRejectApplication rejects an application', async () => {
    mockRejectCampaignDiscoveryApplication.mockResolvedValueOnce({
      status: 200,
      headers: new Headers(),
      data: {
        application_id: 'application-1',
        status: 'rejected',
        decided_at: '2026-05-08T00:00:00Z',
        conversation: null,
      },
    })

    const { result } = renderHook(() => useRejectApplication('campaign-1'), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.mutate({ applicationId: 'application-1' })
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(mockRejectCampaignDiscoveryApplication).toHaveBeenCalledWith(
      'campaign-1',
      'application-1',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Idempotency-Key': 'idempotency-key-1',
        }),
      }),
    )
  })

  it('useIdempotencyKey reuses the key for the same payload and generates a new one for a different payload', () => {
    const { result } = renderHook(() =>
      useIdempotencyKey((payload: { message: string }) =>
        JSON.stringify(payload),
      ),
    )

    const first = result.current.get({ message: 'Hola' })
    const retry = result.current.get({ message: 'Hola' })
    const changed = result.current.get({ message: 'Chau' })

    expect(retry).toBe(first)
    expect(changed).not.toBe(first)
  })

  it.each([
    [
      'conversation_already_exists',
      'info',
      'Ya existe una conversación con este creator.',
    ],
    [
      'application_not_actionable',
      'error',
      'Esta aplicación ya no se puede modificar.',
    ],
  ] as const)(
    'handleDiscoveryMutationError shows the expected toast for 409 %s',
    (code, toastKind, message) => {
      handleDiscoveryMutationError(new ApiError(409, code, 'Conflict'))

      expect(toast[toastKind]).toHaveBeenCalledWith(message)
    },
  )
})
