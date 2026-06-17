import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { axe } from 'vitest-axe'
import { describe, expect, it } from 'vitest'

import { AppSidebar } from './AppSidebar'

function renderSidebar(
  pathname = '/workspace',
  accountKind: 'brand' | 'creator' = 'brand',
) {
  const rootRoute = createRootRoute({
    component: () => (
      <AppSidebar accountKind={accountKind} pathname={pathname} />
    ),
  })

  const workspaceRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/workspace',
    component: () => null,
  })

  const inboxRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/inbox',
    component: () => null,
  })

  const paymentsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/payments',
    component: () => null,
  })

  const settingsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/ajustes',
    component: () => null,
  })

  const offersRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/offers',
    component: () => null,
  })

  const earningsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/earnings',
    component: () => null,
  })

  const router = createRouter({
    routeTree: rootRoute.addChildren([
      workspaceRoute,
      inboxRoute,
      paymentsRoute,
      settingsRoute,
      offersRoute,
      earningsRoute,
    ]),
    history: createMemoryHistory({ initialEntries: [pathname] }),
  })

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return {
    router,
    ...render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    ),
  }
}

describe('AppSidebar', () => {
  it('renders enabled items as links with the label as accessible name', async () => {
    renderSidebar('/workspace')

    const workspaceLink = await screen.findByRole('link', {
      name: 'Workspace',
    })

    expect(workspaceLink).toHaveAttribute('href', '/workspace')
  })

  it('renders disabled items as aria-disabled buttons without href and without navigation', async () => {
    const user = userEvent.setup()
    const { router } = renderSidebar('/workspace')

    const analyticsButton = await screen.findByRole('button', {
      name: 'Analytics',
    })
    await user.click(analyticsButton)

    expect(analyticsButton).toHaveAttribute('aria-disabled', 'true')
    expect(analyticsButton).not.toHaveAttribute('href')
    expect(router.state.location.pathname).toBe('/workspace')
  })

  it('marks only the item resolved by resolveActiveSidebarItem as active', async () => {
    renderSidebar('/workspace/conversations/123')

    await screen.findByRole('link', { name: 'Workspace' })
    const currentItems = screen.getAllByRole('link').filter((item) => {
      return item.getAttribute('aria-current') === 'page'
    })

    expect(currentItems).toHaveLength(1)
    expect(currentItems[0]).toHaveAccessibleName('Workspace')
  })

  it('marks inbox as active on /inbox', async () => {
    renderSidebar('/inbox')

    const inboxLink = await screen.findByRole('link', { name: 'Inbox' })

    expect(inboxLink).toHaveAttribute('aria-current', 'page')
  })

  it('renders payments for brand only and marks it active by pathname', async () => {
    const { unmount } = renderSidebar('/payments', 'brand')

    const paymentsLink = await screen.findByRole('link', {
      name: 'Payments & Spending',
    })

    expect(paymentsLink).toHaveAttribute('href', '/payments')
    expect(paymentsLink).toHaveAttribute('aria-current', 'page')

    unmount()
    renderSidebar('/workspace', 'creator')

    expect(
      screen.queryByRole('link', { name: 'Payments & Spending' }),
    ).not.toBeInTheDocument()
  })

  it('renders settings for brand only and marks it active by pathname', async () => {
    const { unmount } = renderSidebar('/ajustes', 'brand')

    const settingsLink = await screen.findByRole('link', {
      name: 'Ajustes',
    })

    expect(settingsLink).toHaveAttribute('href', '/ajustes')
    expect(settingsLink).toHaveAttribute('aria-current', 'page')

    unmount()
    renderSidebar('/workspace', 'creator')

    expect(
      screen.queryByRole('link', { name: 'Ajustes' }),
    ).not.toBeInTheDocument()
  })

  it('shows the enabled item label tooltip on hover and focus', async () => {
    const user = userEvent.setup()
    const { unmount } = renderSidebar('/workspace')

    const workspaceLink = await screen.findByRole('link', {
      name: 'Workspace',
    })

    await user.hover(workspaceLink)
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Workspace')

    unmount()
    renderSidebar('/workspace')

    await user.tab()
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Inbox')
  })

  it('shows Próximamente for disabled item tooltips', async () => {
    const user = userEvent.setup()
    renderSidebar('/workspace')

    const analyticsButton = await screen.findByRole('button', {
      name: 'Analytics',
    })

    await user.hover(analyticsButton)
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Próximamente')
  })

  it('shows disabled item tooltips when focused by keyboard', async () => {
    renderSidebar('/workspace')

    const analyticsButton = await screen.findByRole('button', {
      name: 'Analytics',
    })
    analyticsButton.focus()
    expect(analyticsButton).toHaveFocus()
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Próximamente')
  })

  it('gives every brand and creator sidebar item an accessible name without visible labels', async () => {
    const { unmount } = renderSidebar('/workspace', 'brand')
    const brandSidebar = await screen.findByTestId('app-sidebar')

    for (const name of [
      'Workspace',
      'Inbox',
      'Payments & Spending',
      'Campaigns',
      'Creators',
      'Videos',
      'Ajustes',
      'Analytics',
    ]) {
      expect(
        within(brandSidebar).getByRole(
          /Workspace|Inbox|Payments & Spending|Campaigns|Creators|Videos|Ajustes/.test(
            name,
          )
            ? 'link'
            : 'button',
          {
            name,
          },
        ),
      ).toBeInTheDocument()
    }
    expect(brandSidebar).toHaveTextContent('?')

    unmount()
    renderSidebar('/workspace', 'creator')
    const creatorSidebar = await screen.findByTestId('app-sidebar')

    for (const name of [
      'Workspace',
      'Inbox',
      'Campaigns',
      'Earnings',
      'Analytics',
    ]) {
      expect(
        within(creatorSidebar).getByRole(
          /Workspace|Inbox|Campaigns|Earnings/.test(name) ? 'link' : 'button',
          { name },
        ),
      ).toBeInTheDocument()
    }
    expect(
      within(creatorSidebar).queryByRole('button', { name: 'Creators' }),
    ).not.toBeInTheDocument()
    expect(
      within(creatorSidebar).queryByRole('link', {
        name: 'Payments & Spending',
      }),
    ).not.toBeInTheDocument()
    expect(creatorSidebar).toHaveTextContent('?')
  })

  it('uses the 72px sidebar rail width', async () => {
    renderSidebar('/workspace')

    const sidebar = await screen.findByTestId('app-sidebar')

    expect(sidebar).toHaveAttribute('data-width', '72px')
    expect(sidebar).toHaveClass('w-[72px]')
  })

  it('is axe-clean', async () => {
    const { container } = renderSidebar('/workspace')
    const sidebar = await screen.findByTestId('app-sidebar')

    expect(
      within(sidebar).getByRole('link', { name: 'Workspace' }),
    ).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })
})
