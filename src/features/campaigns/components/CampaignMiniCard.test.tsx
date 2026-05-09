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
    configurationComplete: false,
    configurationCurrentStep: 'targeting',
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

  const configurationRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/campaigns/$campaignId/configuration/$step',
    component: () => <div>Campaign configuration</div>,
  })

  const router = createRouter({
    routeTree: rootRoute.addChildren([
      sourceRoute,
      campaignRoute,
      configurationRoute,
    ]),
    history: createMemoryHistory({ initialEntries: ['/source'] }),
  })

  await router.load()

  return {
    router,
    ...render(<RouterProvider router={router} />),
  }
}

describe('CampaignMiniCard', () => {
  it('shows pending configuration badge and CTA for incomplete drafts', () => {
    render(<CampaignMiniCard {...makeProps({ campaignId: undefined })} />)

    expect(screen.getByText('Configuración pendiente')).toBeInTheDocument()
    expect(screen.getByText('Retomar configuración')).toBeInTheDocument()
  })

  it('does not show pending badge for complete drafts', () => {
    render(
      <CampaignMiniCard
        {...makeProps({
          campaignId: undefined,
          configurationComplete: true,
        })}
      />,
    )

    expect(
      screen.queryByText('Configuración pendiente'),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Retomar configuración')).not.toBeInTheDocument()
  })

  it('does not show pending badge for incomplete drafts without a current configuration step', () => {
    render(
      <CampaignMiniCard
        {...makeProps({
          campaignId: undefined,
          configurationComplete: false,
          configurationCurrentStep: null,
        })}
      />,
    )

    expect(
      screen.queryByText('Configuración pendiente'),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Retomar configuración')).not.toBeInTheDocument()
  })

  it('does not show pending badge for active campaigns', () => {
    render(
      <CampaignMiniCard
        {...makeProps({
          campaignId: undefined,
          status: 'active',
          configurationComplete: false,
        })}
      />,
    )

    expect(
      screen.queryByText('Configuración pendiente'),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Retomar configuración')).not.toBeInTheDocument()
  })

  it('navigates incomplete drafts to the current configuration step', async () => {
    const user = userEvent.setup()
    const { router } = await renderLinkedCard(makeProps())

    await user.click(screen.getByRole('link', { name: /summer glow 2026/i }))

    expect(router.state.location.pathname).toBe(
      `/campaigns/${campaignId}/configuration/targeting`,
    )
  })

  it('navigates complete drafts to the campaign detail', async () => {
    const user = userEvent.setup()
    const { router } = await renderLinkedCard(
      makeProps({ configurationComplete: true }),
    )

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
