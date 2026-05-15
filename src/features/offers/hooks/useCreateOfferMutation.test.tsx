import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import { createSingleOffer } from '#/shared/api/generated/offers/offers'
import type { createSingleOfferResponse } from '#/shared/api/generated/offers/offers'
import { generateIdempotencyKey } from '#/shared/api/idempotency'
import { getMessagesQueryKey } from '#/shared/queries/messages'
import { getConversationOffersQueryKey } from '#/shared/queries/offers'

import { useCreateOfferMutation } from './useCreateOfferMutation'

vi.mock('#/shared/api/generated/offers/offers', () => ({
  createSingleOffer: vi.fn(),
}))

vi.mock('#/shared/api/idempotency', () => ({
  generateIdempotencyKey: vi.fn(),
}))

const mockCreateSingleOffer = vi.mocked(createSingleOffer)
const mockGenerateIdempotencyKey = vi.mocked(generateIdempotencyKey)

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('useCreateOfferMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGenerateIdempotencyKey.mockReturnValue(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    )
    mockCreateSingleOffer.mockResolvedValue({
      status: 201,
      data: {},
    } as createSingleOfferResponse)
  })

  it('injects Idempotency-Key and invalidates offer queries', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useCreateOfferMutation(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({
      conversation_id: 'conv-1',
      campaign_id: '018f9b3f-2394-7a08-9cb8-b4bd3b8d0e12',
      creator_account_id: '018f9b3f-2394-7a08-9cb8-b4bd3b8d0e13',
      offer_mode: 'same_content',
      amount: 1000,
      tentative_publish_date: '2099-12-30',
      offer_deadline: '2099-12-31',
      platforms: ['instagram'],
      bonus_terms: { enabled: false, speed_bonus_windows: [] },
    })

    await waitFor(() => {
      expect(mockCreateSingleOffer).toHaveBeenCalledWith(
        expect.objectContaining({
          offer_mode: 'same_content',
          conversation_id: 'conv-1',
        }),
        {
          headers: {
            'Idempotency-Key': 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          },
        },
      )
    })

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: getConversationOffersQueryKey('conv-1'),
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: getMessagesQueryKey('conv-1'),
      })
    })
  })
})
