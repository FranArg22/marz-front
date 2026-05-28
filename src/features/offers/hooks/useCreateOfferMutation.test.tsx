import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import { createOffer } from '#/shared/api/generated/offers/offers'
import type { createOfferResponse } from '#/shared/api/generated/offers/offers'
import { generateIdempotencyKey } from '#/shared/api/idempotency'

import { useCreateOfferMutation } from './useCreateOfferMutation'

vi.mock('#/shared/api/generated/offers/offers', () => ({
  createOffer: vi.fn(),
}))

vi.mock('#/shared/api/idempotency', () => ({
  generateIdempotencyKey: vi.fn(),
}))

const mockCreateSingleOffer = vi.mocked(createOffer)
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
    } as createOfferResponse)
  })

  it('injects Idempotency-Key and maps create offer request fields', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
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
      offer_draft_id: 'draft-1',
      return_to: { kind: 'conversation', id: 'conv-1' },
    })

    await waitFor(() => {
      expect(mockCreateSingleOffer).toHaveBeenCalledWith(
        expect.objectContaining({
          offer_mode: 'same_content',
          offer_draft_id: 'draft-1',
          return_to: { kind: 'conversation', id: 'conv-1' },
          conversation_id: 'conv-1',
          amount: '1000.00',
          description: '',
          bonus_terms: null,
          platforms: ['instagram'],
          deliverables: [
            { position: 1, platform: 'instagram', format: '', quantity: 1 },
          ],
        }),
        {
          headers: {
            'Idempotency-Key': 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          },
        },
      )
    })
  })

  it('serializes percentage bonus to OfferBonusTerms', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
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
      bonus_terms: {
        enabled: true,
        speed_bonus_windows: [
          { window_hours: 24, bonus_amount: { type: 'percentage', value: 25 } },
        ],
      },
    })

    await waitFor(() => {
      expect(mockCreateSingleOffer).toHaveBeenCalledWith(
        expect.objectContaining({
          bonus_terms: {
            speed_bonus_windows: [
              {
                window_hours: 24,
                bonus_amount: { type: 'percentage', value: 25 },
              },
            ],
          },
        }),
        expect.anything(),
      )
    })
  })

  it('forwards fixed bonus amount as decimal string', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
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
      bonus_terms: {
        enabled: true,
        speed_bonus_windows: [
          {
            window_hours: 24,
            bonus_amount: { type: 'fixed', amount_usd: 250 },
          },
        ],
      },
    })

    await waitFor(() => {
      expect(mockCreateSingleOffer).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: '1000.00',
          bonus_terms: {
            speed_bonus_windows: [
              {
                window_hours: 24,
                bonus_amount: { type: 'fixed', amount: '250.00' },
              },
            ],
          },
        }),
        expect.anything(),
      )
    })
  })
})
