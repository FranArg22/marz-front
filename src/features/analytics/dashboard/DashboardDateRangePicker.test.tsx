import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { DashboardDateRangePicker } from './DashboardDateRangePicker'

let mockPlan = 'growth'

vi.mock('#/features/identity/session/BrandSessionContext', () => ({
  useBrandSession: () => ({
    account: { id: 'account-1' },
    brandWorkspace: { id: 'workspace-1', name: 'Workspace', plan: mockPlan },
  }),
}))

const dashboardSearchSchema = z.object({
  campaign_ids: z.array(z.string().uuid()).optional().default([]),
  creator_ids: z.array(z.string().uuid()).optional().default([]),
  platforms: z
    .array(z.enum(['instagram', 'tiktok', 'youtube']))
    .optional()
    .default([]),
  countries: z.array(z.string().length(2)).optional().default([]),
  status: z.enum(['active', 'inactive', 'all']).optional().default('active'),
  range_preset: z
    .enum(['7d', '14d', '30d', 'custom'])
    .optional()
    .default('14d'),
  range_start: z.string().optional(),
  range_end: z.string().optional(),
  chart_series: z
    .array(z.enum(['oferta', 'vistas', 'gasto']))
    .optional()
    .default(['oferta', 'vistas']),
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

describe('DashboardDateRangePicker', () => {
  beforeEach(() => {
    mockPlan = 'growth'
    window.scrollTo = vi.fn()
  })

  it('disables paid presets for free workspaces', async () => {
    mockPlan = 'free'

    await renderPicker({ range_preset: '7d' })

    expect(
      screen.getByRole('option', { name: 'Últimos 7 días' }),
    ).not.toBeDisabled()
    expect(
      screen.getByRole('option', { name: 'Últimos 14 días' }),
    ).toBeDisabled()
    expect(
      screen.getByRole('option', { name: 'Últimos 30 días' }),
    ).toBeDisabled()
    expect(
      screen.getByRole('option', { name: 'Personalizado' }),
    ).toBeDisabled()
  })

  it('updates range_preset when selecting 30d', async () => {
    const user = userEvent.setup()
    const router = await renderPicker()

    await user.selectOptions(screen.getByRole('combobox', { name: 'Rango' }), [
      '30d',
    ])

    await waitFor(() => {
      expect(router.state.location.search).toMatchObject({
        range_preset: '30d',
      })
    })
  })

  it('shows custom inputs and writes range_start and range_end', async () => {
    const user = userEvent.setup()
    const router = await renderPicker()

    await user.selectOptions(screen.getByRole('combobox', { name: 'Rango' }), [
      'custom',
    ])
    await user.type(screen.getByLabelText('Desde'), '2026-06-01')
    await user.type(screen.getByLabelText('Hasta'), '2026-06-14')

    await waitFor(() => {
      expect(router.state.location.search).toMatchObject({
        range_preset: 'custom',
        range_start: '2026-06-01',
        range_end: '2026-06-14',
      })
    })
  })
})

async function renderPicker(
  initialSearch: Partial<z.input<typeof dashboardSearchSchema>> = {},
) {
  const rootRoute = createRootRoute()
  const inicioRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/inicio',
    validateSearch: dashboardSearchSchema,
    component: DashboardDateRangePicker,
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([inicioRoute]),
    history: createMemoryHistory({ initialEntries: ['/inicio'] }),
  })

  await router.navigate({ to: '/inicio', search: initialSearch })
  render(<RouterProvider router={router} />)

  return router
}
