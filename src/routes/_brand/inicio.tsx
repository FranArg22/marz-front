import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { DashboardPage } from '#/features/analytics/dashboard/DashboardPage'

const rangePresetSchema = z
  .enum(['7d', '14d', '30d'])
  .catch('14d')
  .default('14d')

const dashboardSearchSchema = z
  .object({
    campaign_ids: z.array(z.string().uuid()).optional().default([]),
    creator_ids: z.array(z.string().uuid()).optional().default([]),
    platforms: z
      .array(z.enum(['instagram', 'tiktok', 'youtube']))
      .optional()
      .default([]),
    countries: z.array(z.string().length(2)).optional().default([]),
    status: z.enum(['active', 'inactive', 'all']).optional().default('active'),
    range_preset: rangePresetSchema,
    range_start: z.string().optional(),
    range_end: z.string().optional(),
    chart_series: z
      .array(z.enum(['oferta', 'vistas', 'gasto']))
      .optional()
      .default(['oferta', 'vistas', 'gasto']),
    chart_grouping: z.enum(['day', 'week', 'month']).optional().default('day'),
    top_videos_sort: z
      .enum(['views', 'cpm', 'engagement'])
      .optional()
      .default('views'),
    top_creators_sort: z
      .enum(['views', 'videos', 'cpm', 'engagement'])
      .optional()
      .default('views'),
  })
  .transform((search) => ({
    ...search,
    range_start: undefined,
    range_end: undefined,
  }))

export type DashboardSearch = z.infer<typeof dashboardSearchSchema>

export const Route = createFileRoute('/_brand/inicio')({
  validateSearch: dashboardSearchSchema,
  component: DashboardPage,
})
