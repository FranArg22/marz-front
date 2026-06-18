import { describe, expect, it } from 'vitest'
import { ZodError, type z } from 'zod'

import { Route } from './inicio'

const dashboardSearchSchema = Route.options.validateSearch as z.ZodType

describe('/_brand/inicio validateSearch', () => {
  it('applies defaults without params', () => {
    expect(dashboardSearchSchema.parse({})).toEqual({
      campaign_ids: [],
      creator_ids: [],
      platforms: [],
      countries: [],
      status: 'active',
      range_preset: '14d',
      chart_series: ['oferta', 'vistas'],
      chart_grouping: 'day',
      top_videos_sort: 'views',
      top_creators_sort: 'views',
    })
  })

  it('parses custom range params', () => {
    expect(
      dashboardSearchSchema.parse({
        range_preset: 'custom',
        range_start: '2026-06-01',
        range_end: '2026-06-14',
      }),
    ).toEqual({
      campaign_ids: [],
      creator_ids: [],
      platforms: [],
      countries: [],
      status: 'active',
      range_preset: 'custom',
      range_start: '2026-06-01',
      range_end: '2026-06-14',
      chart_series: ['oferta', 'vistas'],
      chart_grouping: 'day',
      top_videos_sort: 'views',
      top_creators_sort: 'views',
    })
  })

  it('rejects unknown platforms', () => {
    expect(() =>
      dashboardSearchSchema.parse({ platforms: ['instagram', 'unknown'] }),
    ).toThrow(ZodError)
  })
})
