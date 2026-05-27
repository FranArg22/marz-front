import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { OfferDraftStatusStatus } from '#/shared/api/generated/model'

type RefetchInterval =
  | number
  | false
  | ((query: {
      state: {
        data?: { status: number; data: { status: OfferDraftStatusStatus } }
      }
    }) => number | false)

const useGetOfferDraftStatusMock = vi.fn()

vi.mock('#/shared/api/generated/offers/offers', () => ({
  useGetOfferDraftStatus: (
    offerDraftId: string,
    options?: {
      query?: {
        enabled?: boolean
        refetchInterval?: RefetchInterval
      }
    },
  ) => useGetOfferDraftStatusMock(offerDraftId, options),
}))

import { useDraftStatus } from './useDraftStatus'

function resolveRefetchInterval(
  refetchInterval: RefetchInterval | undefined,
  status: OfferDraftStatusStatus,
) {
  if (typeof refetchInterval !== 'function') return refetchInterval

  return refetchInterval({
    state: {
      data: {
        status: 200,
        data: { status },
      },
    },
  })
}

describe('useDraftStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('marks sent as terminal and stops polling', () => {
    useGetOfferDraftStatusMock.mockReturnValue({
      data: { status: 200, data: { status: 'sent' } },
      isLoading: false,
    })

    const { result } = renderHook(() =>
      useDraftStatus({ offerDraftId: 'draft_1' }),
    )
    const options = useGetOfferDraftStatusMock.mock.calls.at(-1)?.[1]

    expect(result.current.status).toBe('sent')
    expect(result.current.isTerminal).toBe(true)
    expect(
      resolveRefetchInterval(options.query.refetchInterval, 'sent'),
    ).toBe(false)
  })

  it('keeps polling pending drafts every 2s', () => {
    useGetOfferDraftStatusMock.mockReturnValue({
      data: { status: 200, data: { status: 'pending' } },
      isLoading: false,
    })

    const { result } = renderHook(() =>
      useDraftStatus({ offerDraftId: 'draft_1' }),
    )
    const options = useGetOfferDraftStatusMock.mock.calls.at(-1)?.[1]

    expect(result.current.status).toBe('pending')
    expect(result.current.isTerminal).toBe(false)
    expect(
      resolveRefetchInterval(options.query.refetchInterval, 'pending'),
    ).toBe(2_000)
  })

  it('stops polling after timeout regardless of status', () => {
    vi.useFakeTimers()
    useGetOfferDraftStatusMock.mockReturnValue({
      data: { status: 200, data: { status: 'pending' } },
      isLoading: false,
    })

    const { result } = renderHook(() =>
      useDraftStatus({ offerDraftId: 'draft_1' }),
    )

    act(() => {
      vi.advanceTimersByTime(30_000)
    })

    const options = useGetOfferDraftStatusMock.mock.calls.at(-1)?.[1]

    expect(result.current.timedOut).toBe(true)
    expect(
      resolveRefetchInterval(options.query.refetchInterval, 'pending'),
    ).toBe(false)
  })
})
