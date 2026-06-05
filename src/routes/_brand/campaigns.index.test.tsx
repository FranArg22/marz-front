import { render, screen } from '@testing-library/react'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TooltipProvider } from '#/components/ui/tooltip'
import { useCampaignsList } from '#/features/campaigns/hooks/useCampaignsList'
import { useCampaignQuotaQuery } from '#/features/campaigns/wizard/queries'

import { CampaignsPage } from './campaigns.index'

vi.mock('#/features/campaigns/hooks/useCampaignsList', () => ({
  useCampaignsList: vi.fn(),
}))

vi.mock('#/features/campaigns/wizard/queries', () => ({
  useCampaignQuotaQuery: vi.fn(),
}))

vi.mock('#/features/identity/app-shell/useRouteTopbar', () => ({
  useRouteTopbar: vi.fn(),
}))

vi.mock('#/features/identity/session/BrandSessionContext', () => ({
  useBrandSession: () => ({
    account: { id: 'account-1' },
    brandWorkspace: { id: 'workspace-1', name: 'Workspace' },
  }),
}))

const mockUseCampaignsList = vi.mocked(useCampaignsList)
const mockUseCampaignQuotaQuery = vi.mocked(useCampaignQuotaQuery)

describe('CampaignsPage campaign quota CTA', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.scrollTo = vi.fn()
    mockUseCampaignsList.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useCampaignsList>)
  })

  it('keeps Nueva campaña enabled when can_create_more is true', async () => {
    mockQuota({ canCreateMore: true })

    await renderPage()

    expect(
      screen.getByRole('link', { name: 'Nueva campaña' }),
    ).toHaveAttribute('href', '/campaigns/new')
  })

  it('disables Nueva campaña and shows billing CTA when can_create_more is false', async () => {
    mockQuota({ canCreateMore: false, plan: 'Starter' })

    await renderPage()

    expect(
      screen.getByRole('button', { name: 'Nueva campaña' }),
    ).toBeDisabled()
    expect(screen.getByRole('link', { name: 'Ver planes' })).toHaveAttribute(
      'href',
      '/billing',
    )
  })

  it('keeps Nueva campaña enabled while quota is loading', async () => {
    mockUseCampaignQuotaQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as unknown as ReturnType<typeof useCampaignQuotaQuery>)

    await renderPage()

    expect(
      screen.getByRole('link', { name: 'Nueva campaña' }),
    ).toHaveAttribute('href', '/campaigns/new')
  })
})

function mockQuota({
  canCreateMore,
  plan = 'Growth',
}: {
  canCreateMore: boolean
  plan?: string
}) {
  mockUseCampaignQuotaQuery.mockReturnValue({
    data: {
      status: 200,
      headers: new Headers(),
      data: {
        plan,
        subscription_status: 'active',
        max_active_campaigns: 1,
        current_active_count: canCreateMore ? 0 : 1,
        can_create_more: canCreateMore,
        publish_to_board: true,
      },
    },
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof useCampaignQuotaQuery>)
}

async function renderPage() {
  const rootRoute = createRootRoute({
    component: () => <Outlet />,
  })

  const sourceRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: 'source',
    component: CampaignsPage,
  })

  const newCampaignRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/campaigns/new',
    component: () => null,
  })

  const billingRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/billing',
    component: () => null,
  })

  const router = createRouter({
    routeTree: rootRoute.addChildren([
      sourceRoute,
      newCampaignRoute,
      billingRoute,
    ]),
    history: createMemoryHistory({ initialEntries: ['/source'] }),
  })

  await router.load()

  return render(
    <TooltipProvider>
      <RouterProvider router={router} />
    </TooltipProvider>,
  )
}
