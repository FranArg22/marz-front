import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

let mockServerMeResult: { ok: boolean; body: Record<string, unknown> | null } =
  { ok: false, body: null }

const routeMocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  redirect: vi.fn((opts: Record<string, unknown>) => ({
    __redirect: opts,
  })),
  useSearch: vi.fn(),
  useRouteContext: vi.fn(),
}))

const toastMock = vi.hoisted(() =>
  Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
  }),
)
const mockUsePendingInviteClaim = vi.hoisted(() => vi.fn())

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

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({
    options,
    useSearch: routeMocks.useSearch,
    useRouteContext: routeMocks.useRouteContext,
  }),
  redirect: routeMocks.redirect,
  useNavigate: () => routeMocks.navigate,
  useRouterState: ({
    select,
  }: {
    select: (state: { location: { pathname: string } }) => string
  }) => select({ location: { pathname: '/inbox' } }),
}))

vi.mock('sonner', () => ({
  toast: toastMock,
}))

vi.mock('#/shared/analytics/track', () => ({
  track: vi.fn(),
}))

vi.mock('#/shared/auth/getServerMe', () => ({
  getServerMe: () => Promise.resolve(mockServerMeResult),
}))

vi.mock('#/shared/api/generated/accounts/accounts', () => ({
  getMeQueryKey: () => ['/v1/me'],
}))

vi.mock('#/features/identity/app-shell/AppShell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('#/features/discovery/invite/usePendingInviteClaim', () => ({
  usePendingInviteClaim: mockUsePendingInviteClaim,
}))

vi.mock('#/features/inbox/InboxPage', () => ({
  InboxPage: () => null,
}))

import { redirect } from '@tanstack/react-router'

interface QueryClientMock {
  getQueryData: ReturnType<typeof vi.fn>
  getQueryState: ReturnType<typeof vi.fn>
  setQueryData: ReturnType<typeof vi.fn>
}

function makeQueryClient(): QueryClientMock {
  return {
    getQueryData: vi.fn(() => undefined),
    getQueryState: vi.fn(() => undefined),
    setQueryData: vi.fn(),
  }
}

async function callBeforeLoad(queryClient = makeQueryClient()) {
  const { Route } = await import('./inbox')
  const beforeLoad = (
    Route.options as unknown as {
      beforeLoad: (opts: {
        context: { queryClient: ReturnType<typeof makeQueryClient> }
        location: { pathname: string }
      }) => Promise<{ accountId: string; sessionKind: 'brand' | 'creator' }>
    }
  ).beforeLoad
  return beforeLoad({
    context: { queryClient },
    location: { pathname: '/inbox' },
  })
}

async function renderInboxRoute(search: Record<string, unknown>) {
  const { Route } = await import('./inbox')

  routeMocks.useSearch.mockReturnValue(search)
  routeMocks.useRouteContext.mockReturnValue({
    accountId: 'account_1',
    sessionKind: 'brand',
  })

  const Component = Route.options.component as React.ComponentType
  render(React.createElement(Component))
}

async function renderInboxRouteForKind(
  sessionKind: 'brand' | 'creator',
  search: Record<string, unknown> = {},
) {
  const { Route } = await import('./inbox')

  routeMocks.useSearch.mockReturnValue(search)
  routeMocks.useRouteContext.mockReturnValue({
    accountId: 'account_1',
    sessionKind,
  })

  const Component = Route.options.component as React.ComponentType
  render(React.createElement(Component))
}

function expectSearchParamCleaned() {
  expect(routeMocks.navigate).toHaveBeenCalledWith({
    search: expect.any(Function),
    replace: true,
  })
  const [navigateArg] = routeMocks.navigate.mock.calls[0] ?? []
  if (!navigateArg) throw new Error('Expected navigate to be called')

  const typedNavigateArg = navigateArg as {
    search: (prev: Record<string, unknown>) => Record<string, unknown>
  }
  expect(
    typedNavigateArg.search({
      campaign_id: '00000000-0000-0000-0000-000000000000',
      send_offer_result: 'success',
    }),
  ).toEqual({
    campaign_id: '00000000-0000-0000-0000-000000000000',
  })
}

describe('/inbox route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockServerMeResult = { ok: false, body: null }
  })

  it('validates search with inboxSearchSchema', async () => {
    const { Route } = await import('./inbox')
    const validateSearch = (
      Route.options as unknown as {
        validateSearch: (search: Record<string, unknown>) => unknown
      }
    ).validateSearch

    expect(validateSearch({ campaign_id: 'not-a-uuid' })).toEqual({
      campaign_id: undefined,
    })
    expect(
      validateSearch({
        campaign_id: '00000000-0000-0000-0000-000000000000',
      }),
    ).toEqual({ campaign_id: '00000000-0000-0000-0000-000000000000' })
    expect(validateSearch({ send_offer_result: 'failed' })).toEqual({
      send_offer_result: 'failed',
    })
  })

  it('redirects to /auth when not authenticated', async () => {
    await expect(callBeforeLoad()).rejects.toEqual(redirect({ to: '/auth' }))
  })

  it('redeems pending invite tokens only for creator sessions', async () => {
    await renderInboxRouteForKind('creator')

    expect(mockUsePendingInviteClaim).toHaveBeenCalledWith({ enabled: true })
  })

  it('does not redeem pending invite tokens for brand sessions', async () => {
    await renderInboxRouteForKind('brand')

    expect(mockUsePendingInviteClaim).toHaveBeenCalledWith({ enabled: false })
  })

  it('redirects to redirect_to when onboarding is incomplete', async () => {
    mockServerMeResult = {
      ok: true,
      body: {
        id: 'acct_brand_pending',
        kind: 'brand',
        onboarding_status: 'onboarding_pending',
        redirect_to: '/onboarding/brand',
      },
    }

    await expect(callBeforeLoad()).rejects.toEqual(
      redirect({ to: '/onboarding/brand' }),
    )
  })

  it('redirects to /auth when kind is invalid', async () => {
    mockServerMeResult = {
      ok: true,
      body: {
        id: 'acct_invalid_kind',
        kind: 'admin',
        onboarding_status: 'onboarded',
        redirect_to: null,
      },
    }

    await expect(callBeforeLoad()).rejects.toEqual(redirect({ to: '/auth' }))
  })

  it('returns brand AppShell context for an onboarded brand session', async () => {
    mockServerMeResult = {
      ok: true,
      body: {
        id: 'acct_brand_1',
        kind: 'brand',
        onboarding_status: 'onboarded',
        redirect_to: null,
      },
    }

    await expect(callBeforeLoad()).resolves.toEqual({
      accountId: 'acct_brand_1',
      sessionKind: 'brand',
    })
  })

  it('returns creator AppShell context for an onboarded creator session', async () => {
    mockServerMeResult = {
      ok: true,
      body: {
        id: 'acct_creator_1',
        kind: 'creator',
        onboarding_status: 'onboarded',
        redirect_to: null,
      },
    }

    await expect(callBeforeLoad()).resolves.toEqual({
      accountId: 'acct_creator_1',
      sessionKind: 'creator',
    })
  })

  it('uses cached queryClient data when fresh', async () => {
    const queryClient = makeQueryClient()
    queryClient.getQueryData.mockReturnValue({
      status: 200,
      data: {
        id: 'acct_creator_cached',
        kind: 'creator',
        onboarding_status: 'onboarded',
        redirect_to: null,
      },
    })
    queryClient.getQueryState.mockReturnValue({ dataUpdatedAt: Date.now() })

    await expect(callBeforeLoad(queryClient)).resolves.toEqual({
      accountId: 'acct_creator_cached',
      sessionKind: 'creator',
    })
  })

  it('shows a success toast and clears send_offer_result', async () => {
    await renderInboxRoute({ send_offer_result: 'success' })

    await waitFor(() => {
      expect(toastMock.success).toHaveBeenCalledWith('Offer enviada')
    })
    expectSearchParamCleaned()
  })

  it('shows a neutral toast and clears send_offer_result', async () => {
    await renderInboxRoute({ send_offer_result: 'cancelled' })

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith('Volviste sin enviar la offer')
    })
    expectSearchParamCleaned()
  })

  it('shows an error toast and clears send_offer_result', async () => {
    await renderInboxRoute({ send_offer_result: 'failed' })

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith(
        'No pudimos procesar tu tarjeta. Probá de nuevo o gestioná tu tarjeta.',
      )
    })
    expectSearchParamCleaned()
  })

  it('does not show an extra toast without send_offer_result', async () => {
    await renderInboxRoute({})

    expect(toastMock).not.toHaveBeenCalled()
    expect(toastMock.success).not.toHaveBeenCalled()
    expect(toastMock.error).not.toHaveBeenCalled()
    expect(routeMocks.navigate).not.toHaveBeenCalled()
  })
})
