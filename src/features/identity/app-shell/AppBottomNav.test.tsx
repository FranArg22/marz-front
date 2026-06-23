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

import { AppBottomNav } from './AppBottomNav'

const ALL_PATHS = [
  '/inbox',
  '/workspace',
  '/discover/campaigns',
  '/earnings',
  '/settings',
  '/inicio',
  '/discovery',
  '/campaigns',
  '/creators',
  '/videos',
  '/payments',
  '/ajustes',
]

function renderBottomNav(
  accountKind: 'brand' | 'creator' = 'creator',
  pathname = '/inbox',
  inboxHasBadge = false,
) {
  const rootRoute = createRootRoute({
    component: () => (
      <AppBottomNav
        accountKind={accountKind}
        pathname={pathname}
        inboxHasBadge={inboxHasBadge}
      />
    ),
  })

  const children = ALL_PATHS.map((path) =>
    createRoute({ getParentRoute: () => rootRoute, path, component: () => null }),
  )

  const router = createRouter({
    routeTree: rootRoute.addChildren(children),
    history: createMemoryHistory({ initialEntries: [pathname] }),
  })

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('AppBottomNav', () => {
  describe('creator', () => {
    it('renders the five creator items as links pointing to their routes', async () => {
      renderBottomNav('creator', '/inbox')

      const nav = await screen.findByTestId('app-bottom-nav')

      expect(within(nav).getByRole('link', { name: 'Inbox' })).toHaveAttribute(
        'href',
        '/inbox',
      )
      expect(
        within(nav).getByRole('link', { name: 'Workspace' }),
      ).toHaveAttribute('href', '/workspace')
      expect(
        within(nav).getByRole('link', { name: 'Campañas' }),
      ).toHaveAttribute('href', '/discover/campaigns')
      expect(
        within(nav).getByRole('link', { name: 'Ganancias' }),
      ).toHaveAttribute('href', '/earnings')
      expect(
        within(nav).getByRole('link', { name: 'Ajustes' }),
      ).toHaveAttribute('href', '/settings')
    })

    it('does not render a Menú button when every item fits', async () => {
      renderBottomNav('creator', '/inbox')

      const nav = await screen.findByTestId('app-bottom-nav')

      expect(
        within(nav).queryByRole('button', { name: 'Menú' }),
      ).not.toBeInTheDocument()
    })

    it('marks the item resolved by the pathname as the current page', async () => {
      renderBottomNav('creator', '/earnings')

      const nav = await screen.findByTestId('app-bottom-nav')

      expect(
        within(nav).getByRole('link', { name: 'Ganancias' }),
      ).toHaveAttribute('aria-current', 'page')
      expect(
        within(nav).getByRole('link', { name: 'Inbox' }),
      ).not.toHaveAttribute('aria-current')
    })
  })

  describe('brand', () => {
    it('shows the four primary tabs plus a Menú button for the overflow', async () => {
      renderBottomNav('brand', '/inicio')

      const nav = await screen.findByTestId('app-bottom-nav')

      for (const name of ['Dashboard', 'Explorar', 'Inbox', 'Workspace']) {
        expect(within(nav).getByRole('link', { name })).toBeInTheDocument()
      }
      expect(
        within(nav).getByRole('button', { name: 'Menú' }),
      ).toBeInTheDocument()
      // Overflow items are not direct tabs.
      expect(
        within(nav).queryByRole('link', { name: 'Pagos' }),
      ).not.toBeInTheDocument()
    })

    it('opens the menu popover with the grouped sections in sidebar order', async () => {
      const user = userEvent.setup()
      renderBottomNav('brand', '/inicio')

      await user.click(await screen.findByRole('button', { name: 'Menú' }))

      const menu = await screen.findByRole('dialog')
      const links = within(menu).getAllByRole('link')

      expect(links.map((link) => link.textContent)).toEqual([
        'Campañas',
        'Creadores',
        'Videos',
        'Pagos',
        'Ajustes',
      ])
      expect(within(menu).getByRole('link', { name: 'Pagos' })).toHaveAttribute(
        'href',
        '/payments',
      )
    })

    it('marks the Menú button as current when an overflow section is active', async () => {
      renderBottomNav('brand', '/payments')

      const nav = await screen.findByTestId('app-bottom-nav')
      const menuButton = within(nav).getByRole('button', { name: 'Menú' })

      // The sliding indicator sits on the Menú slot (last position).
      const indicator = nav.querySelector('[aria-hidden="true"]')
      expect(indicator).toHaveStyle({
        width: 'calc((100% - 0.75rem) / 5)',
        transform: 'translateX(400%)',
      })
      expect(menuButton).toBeInTheDocument()
    })
  })

  it('shows the inbox notification dot only when inboxHasBadge is true', async () => {
    const { unmount } = renderBottomNav('creator', '/workspace', true)

    const inboxLink = await screen.findByRole('link', { name: 'Inbox' })
    expect(inboxLink.querySelector('.bg-red-600')).toBeInTheDocument()

    unmount()
    renderBottomNav('creator', '/workspace', false)

    const inboxLinkNoBadge = await screen.findByRole('link', { name: 'Inbox' })
    expect(
      inboxLinkNoBadge.querySelector('.bg-red-600'),
    ).not.toBeInTheDocument()
  })

  it('is hidden from the md breakpoint upward', async () => {
    renderBottomNav('creator', '/inbox')

    expect(await screen.findByTestId('app-bottom-nav')).toHaveClass('md:hidden')
  })

  it('is axe-clean', async () => {
    const { container } = renderBottomNav('brand', '/inicio')

    await screen.findByTestId('app-bottom-nav')
    expect(await axe(container)).toHaveNoViolations()
  })
})
