import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { redirect } from '@tanstack/react-router'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

const navigateMock = vi.fn()
vi.mock('@tanstack/react-router', async () => {
  const actual =
    await vi.importActual<typeof import('@tanstack/react-router')>(
      '@tanstack/react-router',
    )
  return {
    ...actual,
    useNavigate: () => navigateMock,
    Link: ({
      to,
      params,
      children,
      ...props
    }: {
      to: string
      params?: Record<string, string>
      children: React.ReactNode
      [key: string]: unknown
    }) => {
      const href = params
        ? Object.entries(params).reduce(
            (acc, [key, value]) => acc.replace(`$${key}`, value),
            to,
          )
        : to
      return (
        <a href={href} {...props}>
          {children}
        </a>
      )
    },
  }
})

const useBillingSubscriptionMock = vi.fn()
vi.mock('#/features/billing/hooks/useBillingSubscription', () => ({
  useBillingSubscription: (opts?: { refetchInterval?: number | false }) =>
    useBillingSubscriptionMock(opts),
}))

const goToMock = vi.fn()
vi.mock('#/features/identity/onboarding/brand/store', () => ({
  useBrandOnboardingStore: <T,>(selector?: (s: { goTo: typeof goToMock }) => T) => {
    const state = { goTo: goToMock }
    return selector ? selector(state) : state
  },
}))

import { Route } from './brand.billing-callback'

function callValidateSearch(input: Record<string, unknown>) {
  const validateSearch = (
    Route.options as unknown as {
      validateSearch: (s: Record<string, unknown>) => unknown
    }
  ).validateSearch
  return validateSearch(input)
}

function callBeforeLoad(search: Record<string, unknown>) {
  const beforeLoad = (
    Route.options as unknown as {
      beforeLoad: (opts: { search: Record<string, unknown> }) => unknown
    }
  ).beforeLoad
  return beforeLoad({ search })
}

const Component = (
  Route.options as unknown as { component: () => ReactElement }
).component

describe('/onboarding/brand/billing-callback search/beforeLoad', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('validateSearch parses checkout param as optional string', () => {
    expect(callValidateSearch({ checkout: 'success' })).toEqual({
      checkout: 'success',
    })
    expect(callValidateSearch({ checkout: 'cancelled' })).toEqual({
      checkout: 'cancelled',
    })
    expect(callValidateSearch({})).toEqual({})
  })

  it('beforeLoad redirects to paywall when checkout=cancelled', () => {
    let thrown: unknown
    try {
      callBeforeLoad({ checkout: 'cancelled' })
    } catch (e) {
      thrown = e
    }
    expect(thrown).toEqual(
      redirect({
        to: '/onboarding/brand/$step',
        params: { step: 'paywall' },
      }),
    )
  })

  it('beforeLoad redirects to paywall when checkout param is invalid', () => {
    let thrown: unknown
    try {
      callBeforeLoad({ checkout: 'bogus' })
    } catch (e) {
      thrown = e
    }
    expect(thrown).toEqual(
      redirect({
        to: '/onboarding/brand/$step',
        params: { step: 'paywall' },
      }),
    )
  })

  it('beforeLoad redirects to paywall when checkout param is missing', () => {
    let thrown: unknown
    try {
      callBeforeLoad({})
    } catch (e) {
      thrown = e
    }
    expect(thrown).toEqual(
      redirect({
        to: '/onboarding/brand/$step',
        params: { step: 'paywall' },
      }),
    )
  })

  it('beforeLoad does nothing when checkout=success', () => {
    expect(() => callBeforeLoad({ checkout: 'success' })).not.toThrow()
  })
})

describe('/onboarding/brand/billing-callback component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('navigates to confirmation step when subscription becomes trialing', () => {
    useBillingSubscriptionMock.mockReturnValue({
      data: { status: 200, data: { status: 'trialing' } },
    })

    render(<Component />)

    expect(goToMock).toHaveBeenCalled()
    expect(navigateMock).toHaveBeenCalledWith({
      to: '/onboarding/brand/$step',
      params: { step: 'confirmation' },
      replace: true,
    })
  })

  it('navigates to confirmation step when subscription becomes active', () => {
    useBillingSubscriptionMock.mockReturnValue({
      data: { status: 200, data: { status: 'active' } },
    })

    render(<Component />)

    expect(navigateMock).toHaveBeenCalledWith({
      to: '/onboarding/brand/$step',
      params: { step: 'confirmation' },
      replace: true,
    })
  })

  it('shows timeout fallback when subscription stays incomplete for 30s', () => {
    vi.useFakeTimers()
    useBillingSubscriptionMock.mockReturnValue({
      data: { status: 200, data: { status: 'incomplete' } },
    })

    render(<Component />)

    expect(
      screen.getByText('Activando tu plan…'),
    ).toBeInTheDocument()
    expect(navigateMock).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(30_000)
    })

    expect(
      screen.getByText('Estamos demorando, refrescá en unos minutos'),
    ).toBeInTheDocument()
    const cta = screen.getByRole('link', { name: 'Volver al paywall' })
    expect(cta).toHaveAttribute('href', '/onboarding/brand/paywall')
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('configures the subscription poll with 2s refetch interval', () => {
    useBillingSubscriptionMock.mockReturnValue({
      data: { status: 200, data: { status: 'incomplete' } },
    })

    render(<Component />)

    expect(useBillingSubscriptionMock).toHaveBeenCalledWith({
      refetchInterval: 2_000,
    })
  })
})
