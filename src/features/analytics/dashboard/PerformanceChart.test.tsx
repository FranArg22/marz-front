import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TooltipProvider } from '#/components/ui/tooltip'
import type { DashboardChartResponse } from '#/shared/api/generated/model/dashboardChartResponse'

import {
  ChartTooltipBody,
  formatCountAxis,
  formatMoneyAxis,
  getDateTickInterval,
  getSeriesDomain,
  PerformanceChart,
} from './PerformanceChart'

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
        onSeriesChange={vi.fn()}
        grouping="day"
        rangePreset="14d"
        onGroupingChange={vi.fn()}
        onRetry={vi.fn()}
        onClear={vi.fn()}
      />,
    )

    expect(screen.getByTestId('chart-skeleton')).toBeInTheDocument()
  })

  it('renders a bar for the active series', () => {
    const { container } = renderChart()

    expect(screen.getByTestId('performance-chart')).toBeInTheDocument()
    expect(
      container.querySelectorAll('.recharts-bar').length,
    ).toBeGreaterThanOrEqual(1)
  })

  it('lists oferta offers in the tooltip body', () => {
    const [firstBucket] = chartData.buckets
    if (!firstBucket) throw new Error('Expected a seeded bucket')

    render(
      <ChartTooltipBody
        row={{
          bucket_start: firstBucket.bucket_start,
          bucket: firstBucket,
          oferta: firstBucket.oferta?.value,
        }}
        series={['oferta']}
      />,
    )

    expect(screen.getByText('@ana - Lanzamiento')).toBeInTheDocument()
    expect(screen.getByText('@leo - Always on')).toBeInTheDocument()
  })

  it('uses the real max as oferta domain for a single offer', () => {
    expect(getSeriesDomain('oferta', 1)).toEqual([0, 1])
  })

  it('uses independent padded domains for views and spend', () => {
    expect(getSeriesDomain('vistas', 20_000_000)).toEqual([0, 23_000_000])
    expect(getSeriesDomain('gasto', 2_500)).toEqual([0, 2_900])
  })

  it('formats compact axis labels without trailing zeroes', () => {
    expect(formatCountAxis(20_000_000)).toBe('20M')
    expect(formatCountAxis(20_500_000)).toBe('20.5M')
    expect(formatMoneyAxis(2_000)).toBe('$2k')
    expect(formatMoneyAxis(2_500)).toBe('$2.5k')
  })

  it('shows fewer date labels for 30 day ranges', () => {
    expect(getDateTickInterval('30d')).toBe(1)
    expect(getDateTickInterval('14d')).toBe(0)
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
        onSeriesChange={vi.fn()}
        grouping="day"
        rangePreset="14d"
        onGroupingChange={vi.fn()}
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
