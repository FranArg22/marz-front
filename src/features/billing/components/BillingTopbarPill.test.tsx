import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { BillingTopbarPill } from './BillingTopbarPill'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce(
        (acc, str, i) => acc + str + (values[i] !== undefined ? values[i] : ''),
        '',
      ),
    { __lingui: true },
  ),
  plural: (value: number, forms: { one: string; other: string }) => {
    const template = value === 1 ? forms.one : forms.other
    return template.replace('#', String(value))
  },
}))

const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

const useMeMock = vi.fn()
vi.mock('#/shared/api/generated/accounts/accounts', () => ({
  useMe: () => useMeMock(),
}))

const useBillingSubscriptionMock = vi.fn()
vi.mock('../hooks/useBillingSubscription', () => ({
  useBillingSubscription: (opts?: unknown) => useBillingSubscriptionMock(opts),
}))

const portalMutateMock = vi.fn()
let portalPending = false
vi.mock('../hooks/useCreatePortalSession', () => ({
  useCreatePortalSession: () => ({
    mutate: portalMutateMock,
    isPending: portalPending,
  }),
}))

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

function setSession({
  kind = 'brand' as 'brand' | 'creator',
  plan = 'growth',
  sub,
  isLoading = false,
  isError = false,
}: {
  kind?: 'brand' | 'creator'
  plan?: string
  sub?: Record<string, unknown> | null
  isLoading?: boolean
  isError?: boolean
}) {
  useMeMock.mockReturnValue({
    data: { status: 200, data: { kind, brand_workspace: { plan } } },
  })
  useBillingSubscriptionMock.mockReturnValue({
    data: sub ? { status: 200, data: sub } : undefined,
    isLoading,
    isError,
  })
}

const originalLocation = window.location

beforeEach(() => {
  vi.clearAllMocks()
  portalPending = false
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      ...originalLocation,
      href: 'https://app.test/dashboard',
      assign: vi.fn(),
    },
  })
})

describe('BillingTopbarPill', () => {
  it('renders trial_ending pill with copy and state', () => {
    setSession({
      sub: {
        status: 'trialing',
        in_trial: true,
        days_until_trial_ends: 1,
        cancel_at: null,
      },
    })
    render(<BillingTopbarPill />, { wrapper })
    const btn = screen.getByRole('button')
    expect(btn).toHaveAttribute('data-pill-state', 'trial_ending')
    expect(btn.textContent).toContain('trial')
    expect(btn.textContent).toContain('1')
  })

  it('renders past_due pill', () => {
    setSession({
      sub: { status: 'past_due', in_trial: false, cancel_at: null },
    })
    render(<BillingTopbarPill />, { wrapper })
    const btn = screen.getByRole('button')
    expect(btn).toHaveAttribute('data-pill-state', 'past_due')
    expect(btn.textContent?.toLowerCase()).toContain('cobro')
  })

  it('renders canceled_pending pill with formatted date', () => {
    setSession({
      sub: {
        status: 'canceled',
        in_trial: false,
        cancel_at: '2026-06-15T00:00:00Z',
      },
    })
    render(<BillingTopbarPill />, { wrapper })
    const btn = screen.getByRole('button')
    expect(btn).toHaveAttribute('data-pill-state', 'canceled_pending')
    expect(btn.textContent?.toLowerCase()).toContain('cancelaste')
  })

  it('returns null when kind is creator', () => {
    setSession({
      kind: 'creator',
      sub: { status: 'past_due', in_trial: false, cancel_at: null },
    })
    const { container } = render(<BillingTopbarPill />, { wrapper })
    expect(container.firstChild).toBeNull()
  })

  it('returns null on active without trial ending', () => {
    setSession({
      sub: {
        status: 'active',
        in_trial: false,
        days_until_trial_ends: null,
        cancel_at: null,
      },
    })
    const { container } = render(<BillingTopbarPill />, { wrapper })
    expect(container.firstChild).toBeNull()
  })

  it('returns null on unpaid', () => {
    setSession({
      sub: {
        status: 'unpaid',
        in_trial: false,
        cancel_at: null,
      },
    })
    const { container } = render(<BillingTopbarPill />, { wrapper })
    expect(container.firstChild).toBeNull()
  })

  it('returns null while subscription is loading', () => {
    setSession({ isLoading: true })
    const { container } = render(<BillingTopbarPill />, { wrapper })
    expect(container.firstChild).toBeNull()
  })

  it('returns null on subscription error', () => {
    setSession({ isError: true })
    const { container } = render(<BillingTopbarPill />, { wrapper })
    expect(container.firstChild).toBeNull()
  })

  it('opens portal on trial_ending click and redirects on success', async () => {
    setSession({
      sub: {
        status: 'trialing',
        in_trial: true,
        days_until_trial_ends: 2,
        cancel_at: null,
      },
    })
    portalMutateMock.mockImplementation((_args, opts) => {
      opts?.onSuccess?.({
        status: 201,
        data: { portal_url: 'https://stripe.test/portal/xyz' },
      })
    })

    const user = userEvent.setup()
    render(<BillingTopbarPill />, { wrapper })
    await user.click(screen.getByRole('button'))

    expect(portalMutateMock).toHaveBeenCalledWith(
      { data: { return_url: 'https://app.test/dashboard' } },
      expect.any(Object),
    )
    expect(window.location.assign).toHaveBeenCalledWith(
      'https://stripe.test/portal/xyz',
    )
  })

  it('navigates to subscription settings on canceled_pending click', async () => {
    setSession({
      sub: {
        status: 'canceled',
        in_trial: false,
        cancel_at: '2026-06-15T00:00:00Z',
      },
    })

    const user = userEvent.setup()
    render(<BillingTopbarPill />, { wrapper })
    await user.click(screen.getByRole('button'))

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/ajustes/suscripcion' })
    expect(portalMutateMock).not.toHaveBeenCalled()
  })
})
