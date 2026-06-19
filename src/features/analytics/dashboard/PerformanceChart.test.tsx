import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TooltipProvider } from '#/components/ui/tooltip'
import type { DashboardChartResponse } from '#/shared/api/generated/model/dashboardChartResponse'

import { PerformanceChart } from './PerformanceChart'

describe('PerformanceChart', () => {
  beforeEach(() => {
    globalThis.ResizeObserver = class {
      private callback: ResizeObserverCallback

      constructor(callback: ResizeObserverCallback) {
        this.callback = callback
      }

      observe(target: Element) {
        this.callback(
          [
            {
              target,
              contentRect: {
                width: 900,
                height: 210,
              },
            } as ResizeObserverEntry,
          ],
          this,
        )
      }

      unobserve() {}
      disconnect() {}
    }
  })

  it('shows a skeleton while loading', () => {
    render(
      <PerformanceChart
        data={undefined}
        isLoading
        isError={false}
        activeSeries={['oferta']}
        onRetry={vi.fn()}
        onClear={vi.fn()}
      />,
    )

    expect(screen.getByTestId('chart-skeleton')).toBeInTheDocument()
  })

  it('renders one point per bucket for oferta', () => {
    renderChart()

    expect(screen.getAllByTestId('chart-point-oferta')).toHaveLength(5)
  })

  it('shows oferta offers in the tooltip', async () => {
    const user = userEvent.setup()
    renderChart()
    const [firstPoint] = screen.getAllByTestId('chart-point-oferta')

    if (!firstPoint) throw new Error('Expected at least one oferta point')

    await user.hover(firstPoint)

    expect(await screen.findByText('@ana - Lanzamiento')).toBeInTheDocument()
    expect(screen.getByText('@leo - Always on')).toBeInTheDocument()
  })
})

function renderChart() {
  return render(
    <TooltipProvider>
      <PerformanceChart
        data={chartData}
        isLoading={false}
        isError={false}
        activeSeries={['oferta']}
        onRetry={vi.fn()}
        onClear={vi.fn()}
      />
    </TooltipProvider>,
  )
}

const chartData: DashboardChartResponse = {
  range: {
    preset: '14d',
    start: '2026-06-01',
    end: '2026-06-05',
  },
  grouping: 'day',
  buckets: [
    {
      bucket_start: '2026-06-01',
      bucket_end: '2026-06-02',
      oferta: {
        value: 2,
        offers: [
          {
            id: 'offer-1',
            creator_handle: '@ana',
            campaign_name: 'Lanzamiento',
          },
          {
            id: 'offer-2',
            creator_handle: '@leo',
            campaign_name: 'Always on',
          },
        ],
      },
    },
    {
      bucket_start: '2026-06-02',
      bucket_end: '2026-06-03',
      oferta: { value: 4, offers: [] },
    },
    {
      bucket_start: '2026-06-03',
      bucket_end: '2026-06-04',
      oferta: { value: 1, offers: [] },
    },
    {
      bucket_start: '2026-06-04',
      bucket_end: '2026-06-05',
      oferta: { value: 3, offers: [] },
    },
    {
      bucket_start: '2026-06-05',
      bucket_end: '2026-06-06',
      oferta: { value: 5, offers: [] },
    },
  ],
}
