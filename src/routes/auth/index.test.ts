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

vi.mock('#/features/identity/auth/components/MagicLinkRequestForm', () => ({
  MagicLinkRequestForm: () => null,
}))

vi.mock('#/features/identity/auth/hooks/useAuthGuard', () => ({
  useAuthGuard: () => ({ showLoading: false }),
}))

vi.mock('#/shared/auth/getServerMe', () => ({
  getServerMe: () => Promise.resolve(mockServerMeResult),
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

describe('/auth beforeLoad', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockServerMeResult = { ok: false, body: null }
    mockGetBrandWorkspaceLandingTarget.mockResolvedValue('dashboard')
  })

  it('renders auth page when not authenticated', async () => {
    mockServerMeResult = { ok: false, body: null }
    await expect(callBeforeLoad()).resolves.toBeUndefined()
  })

  it('redirects onboarded brand to /inicio when landing target is dashboard', async () => {
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

  it('redirects onboarded brand to /campaigns/new when landing target is create_campaign', async () => {
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

  it('defaults onboarded brand to /inicio when landing target fails', async () => {
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

  it('redirects onboarded creator to /inbox', async () => {
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

  it('redirects incomplete onboarding to redirect_to', async () => {
    mockServerMeResult = {
      ok: true,
      body: {
        kind: 'brand',
        onboarding_status: 'onboarding_pending',
        redirect_to: '/onboarding/brand',
      },
    }

    await expect(callBeforeLoad()).rejects.toEqual(
      redirect({ to: '/onboarding/brand' }),
    )
  })
})
