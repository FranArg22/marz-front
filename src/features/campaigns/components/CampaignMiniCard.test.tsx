import { describe, expect, it, vi } from 'vitest'
import type { ComponentProps } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'

import { CampaignMiniCard } from './CampaignMiniCard'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce(
        (acc, str, index) => acc + str + (values[index] ?? ''),
        '',
      ),
    { __lingui: true },
  ),
}))

const campaignId = '00000000-0000-4000-8000-000000000001'

function makeProps(
  overrides: Partial<ComponentProps<typeof CampaignMiniCard>> = {},
): ComponentProps<typeof CampaignMiniCard> {
  return {
    campaignId,
    name: 'Summer Glow 2026',
    startDate: '30 jun',
    status: 'draft',
    creators: 6,
    budget: '$42K',
    videos: { done: 3, total: 8 },
    platforms: ['YouTube', 'Instagram'],
    ...overrides,
  }
}

async function renderLinkedCard(
  props: ComponentProps<typeof CampaignMiniCard>,
) {
  const rootRoute = createRootRoute({
    component: () => <Outlet />,
  })

  const sourceRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: 'source',
    component: () => <CampaignMiniCard {...props} />,
  })

  const campaignRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/campaigns/$campaignId',
    component: () => <div>Campaign detail</div>,
  })

  const router = createRouter({
    routeTree: rootRoute.addChildren([sourceRoute, campaignRoute]),
    history: createMemoryHistory({ initialEntries: ['/source'] }),
  })

  await router.load()

  return {
    router,
    ...render(<RouterProvider router={router} />),
  }
}

describe('CampaignMiniCard', () => {
  it('renders campaign name and stats', () => {
    render(<CampaignMiniCard {...makeProps({ campaignId: undefined })} />)

    expect(screen.getByText('Summer Glow 2026')).toBeInTheDocument()
    expect(screen.getByText('$42K')).toBeInTheDocument()
  })

  it('navigates to the campaign detail', async () => {
    const user = userEvent.setup()
    const { router } = await renderLinkedCard(makeProps())

    await user.click(screen.getByRole('link', { name: /summer glow 2026/i }))

    expect(router.state.location.pathname).toBe(`/campaigns/${campaignId}`)
  })

  it('is axe-clean', async () => {
    const { container } = render(
      <CampaignMiniCard {...makeProps({ campaignId: undefined })} />,
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})
