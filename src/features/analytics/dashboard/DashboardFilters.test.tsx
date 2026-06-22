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

import { useListCampaigns } from '#/shared/api/generated/campaigns/campaigns'

import { DashboardFilters } from './DashboardFilters'

vi.mock('#/shared/api/generated/campaigns/campaigns', () => ({
  useListCampaigns: vi.fn(),
}))

vi.mock('#/shared/api/generated/lookups/lookups', () => ({
  useListCountries: vi.fn(() => ({
    data: {
      status: 200,
      data: { items: [{ code: 'AR', label_es: 'Argentina' }] },
    },
  })),
}))

vi.mock('#/features/identity/session/BrandSessionContext', () => ({
  useBrandSession: () => ({
    account: { id: 'account-1' },
    brandWorkspace: { id: 'workspace-1', name: 'Workspace', plan: 'growth' },
  }),
}))

const mockUseListCampaigns = vi.mocked(useListCampaigns)

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
    .enum(['7d', '14d', '30d'])
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

describe('DashboardFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.scrollTo = vi.fn()
    mockUseListCampaigns.mockReturnValue({
      data: {
        status: 200,
        headers: new Headers(),
        data: {
          data: [
            {
              campaign_id: '11111111-1111-4111-8111-111111111111',
              name: 'Summer launch',
              status: 'active',
              created_at: '2026-06-01T00:00:00.000Z',
              updated_at: '2026-06-01T00:00:00.000Z',
            },
          ],
          next_cursor: null,
        },
      },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useListCampaigns>)
  })

  it('updates platforms in search params when the platform filter changes', async () => {
    const user = userEvent.setup()
    const router = await renderFilters()

    await user.click(screen.getByRole('button', { name: 'Plataforma' }))
    await user.click(screen.getByRole('checkbox', { name: 'Instagram' }))
    await user.click(screen.getByRole('checkbox', { name: 'YouTube' }))

    await waitFor(() => {
      expect(router.state.location.search).toMatchObject({
        platforms: ['instagram', 'youtube'],
      })
    })
  })

  it('resets filters to defaults with Limpiar', async () => {
    const user = userEvent.setup()
    const router = await renderFilters({
      campaign_ids: ['11111111-1111-4111-8111-111111111111'],
      creator_ids: ['22222222-2222-4222-8222-222222222222'],
      platforms: ['instagram'],
      countries: ['AR'],
      status: 'inactive',
    })

    await user.click(screen.getByRole('button', { name: 'Limpiar' }))

    await waitFor(() => {
      expect(router.state.location.search).toMatchObject({
        campaign_ids: [],
        creator_ids: [],
        platforms: [],
        countries: [],
        status: 'active',
      })
    })
  })

  it('exposes filter controls as pills', async () => {
    await renderFilters()

    expect(screen.getByRole('button', { name: 'Campañas' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Creadores' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Plataforma' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'País' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Estado/ }),
    ).toBeInTheDocument()
  })
})

async function renderFilters(
  initialSearch: Partial<z.input<typeof dashboardSearchSchema>> = {},
) {
  const rootRoute = createRootRoute()
  const inicioRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/inicio',
    validateSearch: dashboardSearchSchema,
    component: DashboardFilters,
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([inicioRoute]),
    history: createMemoryHistory({ initialEntries: ['/inicio'] }),
  })

  await router.navigate({ to: '/inicio', search: initialSearch })
  render(<RouterProvider router={router} />)

  return router
}
