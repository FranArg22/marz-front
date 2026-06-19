import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { DashboardTopCreatorsResponse } from '#/shared/api/generated/model/dashboardTopCreatorsResponse'

import { TopCreatorsTable } from './TopCreatorsTable'

describe('TopCreatorsTable', () => {
  it('renders five skeleton rows while loading', () => {
    renderTable({ data: undefined, isLoading: true, isError: false })

    expect(screen.getAllByTestId('top-creator-skeleton')).toHaveLength(5)
  })

  it('renders one row per creator', () => {
    renderTable({
      data: makeResponse(2),
      isLoading: false,
      isError: false,
    })

    expect(screen.getAllByTestId('top-creator-row')).toHaveLength(2)
    expect(screen.getByText('@creator1')).toBeInTheDocument()
    expect(screen.getByText('@creator2')).toBeInTheDocument()
  })

  it('calls onSortChange when selecting Engagement', async () => {
    const user = userEvent.setup()
    const onSortChange = vi.fn()

    renderTable({
      data: makeResponse(1),
      isLoading: false,
      isError: false,
      onSortChange,
    })

    await user.click(
      screen.getByRole('combobox', { name: 'Ordenar top creators' }),
    )
    await user.click(screen.getByRole('option', { name: 'Engagement' }))

    expect(onSortChange).toHaveBeenCalledWith('engagement')
  })
})

function renderTable({
  data,
  isLoading,
  isError,
  currentSort = 'views',
  onSortChange = vi.fn(),
}: {
  data: DashboardTopCreatorsResponse | undefined
  isLoading: boolean
  isError: boolean
  currentSort?: 'views' | 'videos' | 'cpm' | 'engagement'
  onSortChange?: (sort: 'views' | 'videos' | 'cpm' | 'engagement') => void
}) {
  return render(
    <TopCreatorsTable
      data={data}
      isLoading={isLoading}
      isError={isError}
      currentSort={currentSort}
      onSortChange={onSortChange}
    />,
  )
}

function makeResponse(count: number): DashboardTopCreatorsResponse {
  return {
    range: {
      preset: '14d',
      start: '2026-06-01',
      end: '2026-06-14',
    },
    sort_by: 'views',
    creators: Array.from({ length: count }, (_, index) => {
      const n = index + 1
      return {
        account_id: `creator-${n}`,
        handle: `@creator${n}`,
        avatar_url: null,
        country: n % 2 === 0 ? null : 'AR',
        metrics: {
          videos: n,
          views: n * 1000,
          spend: n * 200,
          spend_display: `$${n * 200}`,
          cpm: 12.5,
          engagement_rate: 0.034,
        },
      }
    }),
  }
}
