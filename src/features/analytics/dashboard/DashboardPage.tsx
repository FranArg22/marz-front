import type { DashboardSearch } from '#/routes/_brand/inicio'
import { Route } from '#/routes/_brand/inicio'
import { useNavigate } from '@tanstack/react-router'
import {
  useGetAnalyticsDashboardCards,
  useGetAnalyticsDashboardChart,
  useGetAnalyticsDashboardOnboardingChecklist,
  useGetAnalyticsDashboardTopCreators,
  useGetAnalyticsDashboardTopVideos,
} from '#/shared/api/generated/analytics/analytics'
import type { GetAnalyticsDashboardCardsParams } from '#/shared/api/generated/model/getAnalyticsDashboardCardsParams'
import type { GetAnalyticsDashboardChartParams } from '#/shared/api/generated/model/getAnalyticsDashboardChartParams'
import type { GetAnalyticsDashboardTopCreatorsParams } from '#/shared/api/generated/model/getAnalyticsDashboardTopCreatorsParams'
import type { GetAnalyticsDashboardTopVideosParams } from '#/shared/api/generated/model/getAnalyticsDashboardTopVideosParams'

import { DashboardFilters } from './DashboardFilters'
import { MetricsGrid } from './MetricsGrid'
import { OnboardingChecklist } from './OnboardingChecklist'
import { ChartConfigPopover } from './ChartConfigPopover'
import type { ChartGrouping } from './ChartConfigPopover'
import { ChartSeriesChips } from './ChartSeriesChips'
import type { ChartSeries } from './ChartSeriesChips'
import { PerformanceChart } from './PerformanceChart'
import { TopCreatorsTable } from './TopCreatorsTable'
import { TopVideosTable } from './TopVideosTable'

type CommonDashboardParams = {
  'campaign_ids[]'?: string[]
  'creator_ids[]'?: string[]
  'platforms[]'?: DashboardSearch['platforms']
  'countries[]'?: string[]
  status?: Exclude<DashboardSearch['status'], 'all'>
  range_preset?: DashboardSearch['range_preset']
  range_start?: string
  range_end?: string
}

export function DashboardPage() {
  const search = Route.useSearch()
  const navigate = useNavigate()
  const commonParams = buildCommonParams(search)

  const cardsParams: GetAnalyticsDashboardCardsParams = commonParams
  const chartParams: GetAnalyticsDashboardChartParams = {
    ...commonParams,
    'series[]': search.chart_series,
    grouping: search.chart_grouping,
  }
  const topVideosParams: GetAnalyticsDashboardTopVideosParams = {
    ...commonParams,
    sort_by: search.top_videos_sort,
  }
  const topCreatorsParams: GetAnalyticsDashboardTopCreatorsParams = {
    ...commonParams,
    sort_by: search.top_creators_sort,
  }

  const cardsQuery = useGetAnalyticsDashboardCards(cardsParams, {
    query: { staleTime: 60_000 },
  })
  const chartQuery = useGetAnalyticsDashboardChart(chartParams, {
    query: { staleTime: 300_000 },
  })
  const topVideosQuery = useGetAnalyticsDashboardTopVideos(topVideosParams, {
    query: { staleTime: 300_000 },
  })
  const topCreatorsQuery = useGetAnalyticsDashboardTopCreators(
    topCreatorsParams,
    {
      query: { staleTime: 300_000 },
    },
  )
  const checklistQuery = useGetAnalyticsDashboardOnboardingChecklist({
    query: { staleTime: 600_000 },
  })

  return (
    <main className="flex min-h-full flex-col gap-6 bg-background px-6 py-5 text-foreground">
      <DashboardFilters />

      <MetricsGrid
        data={
          cardsQuery.data?.status === 200 ? cardsQuery.data.data : undefined
        }
        isLoading={cardsQuery.isPending}
        isError={cardsQuery.isError}
      />
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-end gap-3">
          <ChartSeriesChips
            activeSeries={search.chart_series}
            onChange={(newSeries: ChartSeries[]) => {
              void navigate({
                to: '.',
                search: (prev) => ({ ...prev, chart_series: newSeries }),
                replace: true,
              })
            }}
          />
          <ChartConfigPopover
            currentGrouping={search.chart_grouping}
            currentPreset={search.range_preset}
            onChange={(newGrouping: ChartGrouping) => {
              void navigate({
                to: '.',
                search: (prev) => ({
                  ...prev,
                  chart_grouping: newGrouping,
                }),
                replace: true,
              })
            }}
          />
        </div>
        <PerformanceChart
          data={
            chartQuery.data?.status === 200 ? chartQuery.data.data : undefined
          }
          isLoading={chartQuery.isPending}
          isError={chartQuery.isError}
          activeSeries={search.chart_series}
        />
      </div>
      <OnboardingChecklist
        data={
          checklistQuery.data?.status === 200
            ? checklistQuery.data.data
            : undefined
        }
        isLoading={checklistQuery.isPending}
        isError={checklistQuery.isError}
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <TopVideosTable
          data={
            topVideosQuery.data?.status === 200
              ? topVideosQuery.data.data
              : undefined
          }
          isLoading={topVideosQuery.isPending}
          isError={topVideosQuery.isError}
          currentSort={search.top_videos_sort}
          onSortChange={(sort) => {
            void navigate({
              to: '.',
              search: (prev) => ({ ...prev, top_videos_sort: sort }),
              replace: true,
            })
          }}
        />
        <TopCreatorsTable
          data={
            topCreatorsQuery.data?.status === 200
              ? topCreatorsQuery.data.data
              : undefined
          }
          isLoading={topCreatorsQuery.isPending}
          isError={topCreatorsQuery.isError}
          currentSort={search.top_creators_sort}
          onSortChange={(sort) => {
            void navigate({
              to: '.',
              search: (prev) => ({ ...prev, top_creators_sort: sort }),
              replace: true,
            })
          }}
        />
      </div>
    </main>
  )
}

function buildCommonParams(search: DashboardSearch): CommonDashboardParams {
  return {
    'campaign_ids[]': search.campaign_ids.length
      ? search.campaign_ids
      : undefined,
    'creator_ids[]': search.creator_ids.length ? search.creator_ids : undefined,
    'platforms[]': search.platforms.length ? search.platforms : undefined,
    'countries[]': search.countries.length ? search.countries : undefined,
    status: search.status !== 'all' ? search.status : undefined,
    range_preset: search.range_preset,
    range_start: search.range_start,
    range_end: search.range_end,
  }
}
