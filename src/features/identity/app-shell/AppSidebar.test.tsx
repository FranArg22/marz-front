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
  inboxHasBadge = false,
) {
  const rootRoute = createRootRoute({
    component: () => (
      <AppSidebar
        accountKind={accountKind}
        pathname={pathname}
        inboxHasBadge={inboxHasBadge}
      />
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
      name: 'Chat',
    })

    expect(workspaceLink).toHaveAttribute('href', '/workspace')
  })

  it('marks only the item resolved by resolveActiveSidebarItem as active', async () => {
    renderSidebar('/workspace/conversations/123')

    await screen.findByRole('link', { name: 'Chat' })
    const currentItems = screen.getAllByRole('link').filter((item) => {
      return item.getAttribute('aria-current') === 'page'
    })

    expect(currentItems).toHaveLength(1)
    expect(currentItems[0]).toHaveAccessibleName('Chat')
  })

  it('marks inbox as active on /inbox', async () => {
    renderSidebar('/inbox')

    const inboxLink = await screen.findByRole('link', {
      name: 'Inbox',
    })

    expect(inboxLink).toHaveAttribute('aria-current', 'page')
  })

  it('renders payments for brand only and marks it active by pathname', async () => {
    const { unmount } = renderSidebar('/payments', 'brand')

    const paymentsLink = await screen.findByRole('link', {
      name: 'Pagos',
    })

    expect(paymentsLink).toHaveAttribute('href', '/payments')
    expect(paymentsLink).toHaveAttribute('aria-current', 'page')

    unmount()
    renderSidebar('/workspace', 'creator')

    expect(
      screen.queryByRole('link', { name: 'Pagos' }),
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
      name: 'Chat',
    })

    await user.hover(workspaceLink)
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Chat')

    unmount()
    renderSidebar('/workspace')

    await user.tab()
    await user.tab()
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Explorar')
  })

  it('gives every brand and creator sidebar item an accessible name without visible labels', async () => {
    const { unmount } = renderSidebar('/workspace', 'brand')
    const brandSidebar = await screen.findByTestId('app-sidebar')

    for (const name of [
      'Chat',
      'Inbox',
      'Pagos',
      'Campañas',
      'Creadores',
      'Videos',
      'Ajustes',
      'Dashboard',
    ]) {
      expect(
        within(brandSidebar).getByRole(
          /Chat|Inbox|Pagos|Campañas|Creadores|Videos|Ajustes|Dashboard/.test(
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
    expect(within(brandSidebar).getAllByRole('img', { name: 'Marz' })).toHaveLength(2)

    unmount()
    renderSidebar('/workspace', 'creator')
    const creatorSidebar = await screen.findByTestId('app-sidebar')

    for (const name of ['Chat', 'Inbox', 'Campañas', 'Ganancias']) {
      expect(
        within(creatorSidebar).getByRole('link', { name }),
      ).toBeInTheDocument()
    }
    expect(
      within(creatorSidebar).queryByRole('button', { name: 'Creators' }),
    ).not.toBeInTheDocument()
    expect(
      within(creatorSidebar).queryByRole('link', {
        name: 'Pagos',
      }),
    ).not.toBeInTheDocument()
    expect(within(creatorSidebar).getAllByRole('img', { name: 'Marz' })).toHaveLength(2)
  })

  it('shows the inbox notification dot only when inboxHasBadge is true', async () => {
    const { unmount } = renderSidebar('/workspace', 'brand', true)

    const inboxLink = await screen.findByRole('link', {
      name: 'Inbox',
    })
    expect(inboxLink.querySelector('.bg-red-600')).toBeInTheDocument()

    unmount()
    renderSidebar('/workspace', 'brand', false)

    const inboxLinkNoBadge = await screen.findByRole('link', {
      name: 'Inbox',
    })
    expect(
      inboxLinkNoBadge.querySelector('.bg-red-600'),
    ).not.toBeInTheDocument()
  })

  it('uses the 59px sidebar rail width', async () => {
    renderSidebar('/workspace')

    const sidebar = await screen.findByTestId('app-sidebar')

    expect(sidebar).toHaveAttribute('data-width', '59px')
    expect(sidebar).toHaveClass('w-[59px]')
  })

  it('is axe-clean', async () => {
    const { container } = renderSidebar('/workspace')
    const sidebar = await screen.findByTestId('app-sidebar')

    expect(
      within(sidebar).getByRole('link', { name: 'Chat' }),
    ).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })
})
