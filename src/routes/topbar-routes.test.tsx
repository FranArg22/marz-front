import type { ComponentType, ReactNode } from 'react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

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

const mockNavigate = vi.fn()
const mockRouter = { navigate: mockNavigate }
let mockParams: Record<string, string> = {}

function setupRouterMock() {
  vi.doMock('@tanstack/react-router', () => ({
    createFileRoute: () => (options: Record<string, unknown>) => ({
      options,
      useParams: () => mockParams,
    }),
    Link: ({ children, to, ...props }: { children: ReactNode; to: string }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
    useParams: () => mockParams,
    useRouter: () => mockRouter,
    useNavigate: () => mockNavigate,
  }))
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : null
}

function getRouteComponent(module: unknown): ComponentType {
  const moduleRecord = asRecord(module)
  const routeRecord = asRecord(moduleRecord?.Route)
  const optionsRecord = asRecord(routeRecord?.options)
  const component = optionsRecord?.component

  if (typeof component !== 'function') {
    throw new Error('Route component missing in test module')
  }

  return component as ComponentType
}

async function renderRouteComponent(importRoute: () => Promise<unknown>) {
  setupRouterMock()

  const [appTopbarModule, topbarContextModule, routeModule] = await Promise.all(
    [
      import('#/features/identity/app-shell/AppTopbar'),
      import('#/features/identity/app-shell/TopbarContext'),
      importRoute(),
    ],
  )
  const { AppTopbar } = appTopbarModule
  const { TopbarProvider } = topbarContextModule
  const Component = getRouteComponent(routeModule)

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <TopbarProvider>
        <AppTopbar />
        <Component />
      </TopbarProvider>
    </QueryClientProvider>,
  )
}

describe('route topbar integration', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mockParams = {}
  })

  afterEach(() => {
    vi.doUnmock('@tanstack/react-router')
  })

  it('declares Campaigns list title and action in the shell topbar', async () => {
    await renderRouteComponent(() => import('./_brand/campaigns.index'))

    expect(
      await screen.findByRole('heading', { name: 'Campañas' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /nueva campaña/i }),
    ).toHaveAttribute('href', '/campaigns/new')
    expect(screen.getByTestId('app-topbar')).toHaveAttribute(
      'data-height',
      '56px',
    )
  })

  it.skip('resets contextual topbar state when moving through Campaigns, Chats, and Inbox', async () => {
    setupRouterMock()
    const [
      appTopbarModule,
      topbarContextModule,
      campaignsModule,
      inboxModule,
    ] = await Promise.all([
      import('#/features/identity/app-shell/AppTopbar'),
      import('#/features/identity/app-shell/TopbarContext'),
      import('./_brand/campaigns.index'),
      import('./inbox'),
    ])
    const { AppTopbar } = appTopbarModule
    const { TopbarProvider } = topbarContextModule
    const Campaigns = getRouteComponent(campaignsModule)
    const Inbox = getRouteComponent(inboxModule)

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <TopbarProvider>
          <AppTopbar />
          <Campaigns />
        </TopbarProvider>
      </QueryClientProvider>,
    )

    expect(await screen.findByText('Campañas')).toBeInTheDocument()

    rerender(
      <QueryClientProvider client={queryClient}>
        <TopbarProvider>
          <AppTopbar />
          <main>Chats</main>
        </TopbarProvider>
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('Marz')).toBeInTheDocument()
    })
    expect(screen.queryByText('Campañas')).not.toBeInTheDocument()

    rerender(
      <QueryClientProvider client={queryClient}>
        <TopbarProvider>
          <AppTopbar />
          <Inbox />
        </TopbarProvider>
      </QueryClientProvider>,
    )

    expect(await screen.findByText('Inbox')).toBeInTheDocument()
    expect(screen.queryByText('Campañas')).not.toBeInTheDocument()
  })

  it('keeps route files free of duplicate route-level header markup', () => {
    const files = [
      'src/routes/_brand/campaigns.index.tsx',
      'src/routes/_brand/campaigns.new.tsx',
      'src/routes/inbox.tsx',
      'src/routes/workspace.tsx',
      'src/routes/workspace.index.tsx',
      'src/routes/workspace.conversations.$conversationId.tsx',
    ]

    for (const file of files) {
      const source = readFileSync(resolve(process.cwd(), file), 'utf8')

      expect(source).not.toContain('<header')
    }
  })
})
