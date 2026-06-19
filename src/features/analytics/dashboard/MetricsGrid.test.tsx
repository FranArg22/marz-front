import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { TooltipProvider } from '#/components/ui/tooltip'
import type { DashboardCard } from '#/shared/api/generated/model/dashboardCard'
import type { DashboardCardsResponse } from '#/shared/api/generated/model/dashboardCardsResponse'
import type { DashboardCardKey } from '#/shared/api/generated/model/dashboardCardKey'

import { MetricsGrid } from './MetricsGrid'

describe('MetricsGrid', () => {
  it('renders eight card skeletons while loading', () => {
    renderMetricsGrid({
      data: undefined,
      isLoading: true,
      isError: false,
      onRetry: vi.fn(),
    })

    expect(screen.getAllByTestId('metric-card-skeleton')).toHaveLength(8)
  })

  it('renders eight cards with labels in the fixed design order', () => {
    renderMetricsGrid({
      data: makeResponse(),
      isLoading: false,
      isError: false,
      onRetry: vi.fn(),
    })

    expect(screen.getAllByTestId('metric-card')).toHaveLength(8)
    const labels = screen
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent)

    expect(labels).toEqual([
      'Videos publicados',
      'Creadores activados',
      'Vistas',
      'Gasto Total',
      'Likes',
      'Comentarios',
      'Engagement',
      'CPM',
    ])
  })
})

function renderMetricsGrid(props: Parameters<typeof MetricsGrid>[0]) {
  return render(
    <TooltipProvider>
      <MetricsGrid {...props} />
    </TooltipProvider>,
  )
}

function makeResponse(): DashboardCardsResponse {
  const cards: DashboardCard[] = [
    makeCard('cpm', '$1.42'),
    makeCard('engagement', '8%'),
    makeCard('comments', '12.3K'),
    makeCard('likes', '1.9M'),
    makeCard('spend', '$18.4K'),
    makeCard('views', '30.3M'),
    makeCard('creators_activated', '26'),
    makeCard('videos_published', '286'),
  ]

  return { cards }
}

function makeCard(key: DashboardCardKey, currentDisplay: string): DashboardCard {
  return {
    key,
    type: 'flow',
    current_value: 1,
    current_display: currentDisplay,
    delta: {
      kind: 'vs_previous_period',
      value: 1,
      display: '+1',
      tooltip: `Tooltip ${key}`,
      direction: 'positive',
      has_comparison: true,
    },
  }
}
