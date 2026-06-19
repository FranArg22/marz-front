import type { DashboardSearch } from '#/routes/_brand/inicio'
import { Route } from '#/routes/_brand/inicio'
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

  useGetAnalyticsDashboardCards(cardsParams, { query: { staleTime: 60_000 } })
  useGetAnalyticsDashboardChart(chartParams, { query: { staleTime: 300_000 } })
  useGetAnalyticsDashboardTopVideos(topVideosParams, {
    query: { staleTime: 300_000 },
  })
  useGetAnalyticsDashboardTopCreators(topCreatorsParams, {
    query: { staleTime: 300_000 },
  })
  useGetAnalyticsDashboardOnboardingChecklist({
    query: { staleTime: 600_000 },
  })

  return (
    <main className="flex min-h-full flex-col gap-6 bg-background px-6 py-5 text-foreground">
      <DashboardFilters />

      <section
        data-testid="metrics-grid"
        className="min-h-40 rounded-lg border border-border bg-card"
      />
      <section
        data-testid="chart"
        className="min-h-80 rounded-lg border border-border bg-card"
      />
      <section
        data-testid="checklist"
        className="min-h-32 rounded-lg border border-border bg-card"
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <section
          data-testid="top-videos"
          className="min-h-80 rounded-lg border border-border bg-card"
        />
        <section
          data-testid="top-creators"
          className="min-h-80 rounded-lg border border-border bg-card"
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
