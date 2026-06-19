import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { TooltipProvider } from '#/components/ui/tooltip'
import type { DashboardCard } from '#/shared/api/generated/model/dashboardCard'
import type { DashboardCardDeltaDirection } from '#/shared/api/generated/model/dashboardCardDeltaDirection'
import type { DashboardCardKey } from '#/shared/api/generated/model/dashboardCardKey'

import { MetricCard } from './MetricCard'

describe('MetricCard', () => {
  it('renders a success-colored badge for positive deltas', () => {
    renderMetricCard(makeCard({ direction: 'positive' }))

    expect(screen.getByTestId('metric-delta')).toHaveClass(
      'text-emerald-700',
    )
  })

  it('renders a danger-colored badge for negative deltas', () => {
    renderMetricCard(makeCard({ direction: 'negative' }))

    expect(screen.getByTestId('metric-delta')).toHaveClass('text-red-600')
  })

  it('shows an em dash and fallback tooltip when comparison is missing', async () => {
    const user = userEvent.setup()
    renderMetricCard(makeCard({ hasComparison: false }))

    const badge = screen.getByTestId('metric-delta')
    expect(badge).toHaveTextContent('—')

    await user.hover(badge)

    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Sin datos del período anterior para comparar',
    )
  })

  it('shows the backend tooltip when comparison exists', async () => {
    const user = userEvent.setup()
    renderMetricCard(makeCard({ tooltip: 'Subió 44 videos.' }))

    await user.hover(screen.getByTestId('metric-delta'))

    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Subió 44 videos.',
    )
  })

  it('shows the metric definition from the info icon', async () => {
    const user = userEvent.setup()
    renderMetricCard(makeCard({ key: 'views' }))

    await user.hover(
      screen.getByRole('button', { name: 'Definición de Vistas' }),
    )

    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Suma de vistas acumuladas de todos los videos al fin del período.',
    )
  })
})

function renderMetricCard(card: DashboardCard) {
  return render(
    <TooltipProvider>
      <MetricCard card={card} />
    </TooltipProvider>,
  )
}

function makeCard({
  key = 'videos_published',
  direction = 'positive',
  hasComparison = true,
  tooltip = 'Comparación del backend.',
}: {
  key?: DashboardCardKey
  direction?: DashboardCardDeltaDirection
  hasComparison?: boolean
  tooltip?: string
} = {}): DashboardCard {
  return {
    key,
    type: 'flow',
    current_value: 286,
    current_display: '286',
    delta: {
      kind: 'vs_previous_period',
      value: 44,
      display: '+44',
      tooltip,
      direction,
      has_comparison: hasComparison,
    },
  }
}
