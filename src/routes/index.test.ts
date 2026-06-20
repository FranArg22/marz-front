import { describe, it, expect, vi, beforeEach } from 'vitest'
import { redirect } from '@tanstack/react-router'
import type { ReactNode } from 'react'

let mockServerMeResult: { ok: boolean; body: Record<string, unknown> | null } =
  { ok: false, body: null }
const mockGetBrandWorkspaceLandingTarget = vi.fn()

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

vi.mock('@lingui/react/macro', () => ({
  Trans: ({ children }: { children?: ReactNode }) => children,
}))

vi.mock('#/shared/auth/getServerMe', () => ({
  getServerMe: () => Promise.resolve(mockServerMeResult),
}))

vi.mock('#/shared/analytics/track', () => ({
  track: vi.fn(),
}))

vi.mock('#/shared/api/generated/accounts/accounts', () => ({
  getMeQueryKey: () => ['/v1/me'],
}))

vi.mock('#/shared/auth/getServerBrandWorkspaceLandingTarget', () => ({
  getServerBrandWorkspaceLandingTarget: () =>
    mockGetBrandWorkspaceLandingTarget(),
}))

function makeQueryClient() {
  return {
    getQueryData: vi.fn(() => undefined),
    getQueryState: vi.fn(() => undefined),
    setQueryData: vi.fn(),
  }
}

async function callBeforeLoad(queryClient = makeQueryClient()) {
  const { Route } = await import('./index')
  const beforeLoad = (
    Route.options as unknown as {
      beforeLoad: (opts: {
        context: { queryClient: ReturnType<typeof makeQueryClient> }
      }) => Promise<void>
    }
  ).beforeLoad
  return beforeLoad({ context: { queryClient } })
}

describe('/ beforeLoad', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockServerMeResult = { ok: false, body: null }
    mockGetBrandWorkspaceLandingTarget.mockResolvedValue('dashboard')
  })

  it('redirects to /auth when not authenticated', async () => {
    mockServerMeResult = { ok: false, body: null }
    await expect(callBeforeLoad()).rejects.toEqual(redirect({ to: '/auth' }))
  })

  it('fires analytics when not authenticated', async () => {
    const { track } = await import('#/shared/analytics/track')
    mockServerMeResult = { ok: false, body: null }
    try {
      await callBeforeLoad()
    } catch {
      // redirect thrown
    }
    expect(track).toHaveBeenCalledWith('onboarding_redirect_enforced', {
      from: '/',
      to: '/auth',
      reason: 'no_session',
    })
  })

  it('redirects to redirect_to when onboarding incomplete', async () => {
    mockServerMeResult = {
      ok: true,
      body: {
        kind: null,
        onboarding_status: 'kind_pending',
        redirect_to: '/auth/kind',
      },
    }
    await expect(callBeforeLoad()).rejects.toEqual(
      redirect({ to: '/auth/kind' }),
    )
  })

  it('redirects to /auth when onboarding incomplete and no redirect_to', async () => {
    mockServerMeResult = {
      ok: true,
      body: {
        kind: null,
        onboarding_status: 'kind_pending',
        redirect_to: null,
      },
    }
    await expect(callBeforeLoad()).rejects.toEqual(redirect({ to: '/auth' }))
  })

  it('redirects to /inicio for onboarded brand when landing target is dashboard', async () => {
    mockServerMeResult = {
      ok: true,
      body: {
        kind: 'brand',
        onboarding_status: 'onboarded',
        redirect_to: null,
      },
    }
    mockGetBrandWorkspaceLandingTarget.mockResolvedValue('dashboard')

    await expect(callBeforeLoad()).rejects.toEqual(redirect({ to: '/inicio' }))
  })

  it('redirects to /campaigns/new for onboarded brand when landing target is create_campaign', async () => {
    mockServerMeResult = {
      ok: true,
      body: {
        kind: 'brand',
        onboarding_status: 'onboarded',
        redirect_to: null,
      },
    }
    mockGetBrandWorkspaceLandingTarget.mockResolvedValue('create_campaign')

    await expect(callBeforeLoad()).rejects.toEqual(
      redirect({ to: '/campaigns/new' }),
    )
  })

  it('defaults to /inicio for onboarded brand when landing target fails', async () => {
    mockServerMeResult = {
      ok: true,
      body: {
        kind: 'brand',
        onboarding_status: 'onboarded',
        redirect_to: null,
      },
    }
    mockGetBrandWorkspaceLandingTarget.mockRejectedValue(new Error('failed'))

    await expect(callBeforeLoad()).rejects.toEqual(redirect({ to: '/inicio' }))
  })

  it('redirects to /inbox for onboarded creator', async () => {
    mockServerMeResult = {
      ok: true,
      body: {
        kind: 'creator',
        onboarding_status: 'onboarded',
        redirect_to: null,
      },
    }
    await expect(callBeforeLoad()).rejects.toEqual(redirect({ to: '/inbox' }))
  })
})
