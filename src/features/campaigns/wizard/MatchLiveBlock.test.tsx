import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getTrackedEvents, resetTrackedEvents } from '#/shared/analytics/track'
import { MatchLiveBlock } from './MatchLiveBlock'
import { useCreatorCountQuery } from './queries'

vi.mock('./queries', () => ({
  useCreatorCountQuery: vi.fn(),
}))

const mockUseCreatorCountQuery = vi.mocked(useCreatorCountQuery)
const successHeaders = new Headers()

describe('MatchLiveBlock', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    resetTrackedEvents()
    mockUseCreatorCountQuery.mockReturnValue({
      data: undefined,
      isPending: false,
      isLoading: false,
      queryKey: [],
    } as unknown as ReturnType<typeof useCreatorCountQuery>)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('shows an em dash when count is unavailable', () => {
    mockUseCreatorCountQuery.mockReturnValue({
      data: {
        status: 200,
        data: {
          available: false,
          count: null,
          computed_at: '2026-01-01T00:00:00Z',
        },
        headers: successHeaders,
      },
      isPending: false,
      isLoading: false,
      queryKey: [],
    } as unknown as ReturnType<typeof useCreatorCountQuery>)

    render(
      <MatchLiveBlock
        platforms={['instagram']}
        interests={['beauty']}
        creator_country="AR"
        min_creator_tier_slug="micro"
      />,
    )

    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByText('No disponible en este momento')).toBeInTheDocument()
  })

  it('shows the formatted count when count is available', () => {
    mockUseCreatorCountQuery.mockReturnValue({
      data: {
        status: 200,
        data: {
          available: true,
          count: 1234,
          computed_at: '2026-01-01T00:00:00Z',
        },
        headers: successHeaders,
      },
      isPending: false,
      isLoading: false,
      queryKey: [],
    } as unknown as ReturnType<typeof useCreatorCountQuery>)

    render(
      <MatchLiveBlock
        platforms={['instagram']}
        interests={['beauty']}
        creator_country="AR"
        min_creator_tier_slug="micro"
      />,
    )

    expect(screen.getByText('1.234')).toBeInTheDocument()
    expect(screen.getByText('Creadores disponibles')).toBeInTheDocument()
    expect(getTrackedEvents()).toEqual([
      expect.objectContaining({
        event: 'campaign_wizard_match_count_seen',
        payload: {
          count: 1234,
          filters: {
            platforms: ['instagram'],
            interests: ['beauty'],
            creator_country: 'AR',
            min_creator_tier_slug: 'micro',
          },
        },
      }),
    ])
  })

  it('keeps passing previous filters until the debounce delay completes', () => {
    const { rerender } = render(
      <MatchLiveBlock
        platforms={['instagram']}
        interests={['beauty']}
        creator_country="AR"
        min_creator_tier_slug="micro"
      />,
    )

    rerender(
      <MatchLiveBlock
        platforms={['youtube']}
        interests={['gaming']}
        creator_country="AR"
        min_creator_tier_slug="macro"
      />,
    )

    expect(mockUseCreatorCountQuery).toHaveBeenLastCalledWith({
      platforms: ['instagram'],
      interests: ['beauty'],
      creator_country: 'AR',
      min_creator_tier_slug: 'micro',
    })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(mockUseCreatorCountQuery).toHaveBeenLastCalledWith({
      platforms: ['youtube'],
      interests: ['gaming'],
      creator_country: 'AR',
      min_creator_tier_slug: 'macro',
    })
  })
})
