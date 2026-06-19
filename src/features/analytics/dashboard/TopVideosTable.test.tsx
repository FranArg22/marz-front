import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { DashboardTopVideosResponse } from '#/shared/api/generated/model/dashboardTopVideosResponse'

import { TopVideosTable } from './TopVideosTable'

describe('TopVideosTable', () => {
  it('renders five skeleton rows while loading', () => {
    renderTable({ data: undefined, isLoading: true, isError: false })

    expect(screen.getAllByTestId('top-video-skeleton')).toHaveLength(5)
  })

  it('renders one row per video with creator handles', () => {
    renderTable({
      data: makeResponse(3),
      isLoading: false,
      isError: false,
    })

    expect(screen.getAllByTestId('top-video-row')).toHaveLength(3)
    expect(screen.getByText('@creator1')).toBeInTheDocument()
    expect(screen.getByText('@creator2')).toBeInTheDocument()
    expect(screen.getByText('@creator3')).toBeInTheDocument()
  })

  it('calls onSortChange when selecting CPM', async () => {
    const user = userEvent.setup()
    const onSortChange = vi.fn()

    renderTable({
      data: makeResponse(1),
      isLoading: false,
      isError: false,
      onSortChange,
    })

    await user.click(screen.getByRole('combobox', { name: 'Ordenar top videos' }))
    await user.click(screen.getByRole('option', { name: 'CPM' }))

    expect(onSortChange).toHaveBeenCalledWith('cpm')
  })

  it('renders the empty placeholder when there are no videos', () => {
    renderTable({
      data: { range: makeRange(), sort_by: 'views', videos: [] },
      isLoading: false,
      isError: false,
    })

    expect(screen.getByText('Sin datos para estos filtros')).toBeInTheDocument()
  })

  it('marks the active metric header as sorted', () => {
    renderTable({
      data: makeResponse(1),
      isLoading: false,
      isError: false,
      currentSort: 'cpm',
    })

    const header = screen.getByRole('columnheader', { name: 'CPM' })

    expect(header).toHaveAttribute('aria-sort', 'descending')
    expect(
      within(screen.getByRole('table', { name: 'Top videos' })).getByRole(
        'columnheader',
        { name: 'Vistas' },
      ),
    ).not.toHaveAttribute('aria-sort')
  })
})

function renderTable({
  data,
  isLoading,
  isError,
  currentSort = 'views',
  onSortChange = vi.fn(),
  onRetry = vi.fn(),
  onClear = vi.fn(),
}: {
  data: DashboardTopVideosResponse | undefined
  isLoading: boolean
  isError: boolean
  currentSort?: 'views' | 'cpm' | 'engagement'
  onSortChange?: (sort: 'views' | 'cpm' | 'engagement') => void
  onRetry?: () => void
  onClear?: () => void
}) {
  return render(
    <TopVideosTable
      data={data}
      isLoading={isLoading}
      isError={isError}
      currentSort={currentSort}
      onSortChange={onSortChange}
      onRetry={onRetry}
      onClear={onClear}
    />,
  )
}

function makeResponse(count: number): DashboardTopVideosResponse {
  return {
    range: makeRange(),
    sort_by: 'views',
    videos: Array.from({ length: count }, (_, index) => {
      const n = index + 1
      return {
        video_link_id: `video-${n}`,
        platform: n % 2 === 0 ? 'tiktok' : 'instagram',
        thumbnail_url: null,
        title: `Video ${n}`,
        video_url: `https://example.com/videos/${n}`,
        creator: {
          id: `creator-${n}`,
          handle: `@creator${n}`,
          avatar_url: null,
        },
        metrics: {
          views: n * 1000,
          likes: n * 100,
          comments: n * 10,
          engagement_rate: 0.034,
          cpm: 12.5,
        },
        published_at: '2026-06-01T00:00:00Z',
      }
    }),
  }
}

function makeRange() {
  return {
    preset: '14d',
    start: '2026-06-01',
    end: '2026-06-14',
  }
}
