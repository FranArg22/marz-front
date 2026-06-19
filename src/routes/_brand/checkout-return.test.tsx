import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getGetAnalyticsDashboardCardsQueryKey,
  getGetAnalyticsDashboardChartQueryKey,
} from '#/shared/api/generated/analytics/analytics'

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
  }
})

const useDraftStatusMock = vi.fn()
vi.mock('#/features/payments/hooks/useDraftStatus', () => ({
  useDraftStatus: (options: { offerDraftId: string; enabled?: boolean }) =>
    useDraftStatusMock(options),
}))

import { CheckoutReturnPage, Route } from './checkout-return'

const conversationSearch = {
  offer_draft_id: 'draft_1',
  return_to_kind: 'conversation' as const,
  return_to_id: 'conversation_1',
}

describe('/_brand/checkout-return route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('validates the Stripe return search params', () => {
    const validateSearch = (
      Route.options as unknown as {
        validateSearch: (search: Record<string, unknown>) => unknown
      }
    ).validateSearch

    expect(
      validateSearch({
        offer_draft_id: 'draft_1',
        return_to_kind: 'conversation',
        return_to_id: 'conversation_1',
        checkout: 'success',
      }),
    ).toEqual({
      offer_draft_id: 'draft_1',
      return_to_kind: 'conversation',
      return_to_id: 'conversation_1',
      checkout: 'success',
    })
  })

  it("checkout='cancel' navigates immediately with cancelled result", () => {
    useDraftStatusMock.mockReturnValue({
      status: undefined,
      isTerminal: false,
      timedOut: false,
      isLoading: false,
    })

    renderCheckout(
      <CheckoutReturnPage
        search={{ ...conversationSearch, checkout: 'cancel' }}
      />,
    )

    expect(navigateMock).toHaveBeenCalledWith({
      to: '/workspace/conversations/$conversationId',
      params: { conversationId: 'conversation_1' },
      search: { send_offer_result: 'cancelled' },
      replace: true,
    })
  })

  it("checkout='success' navigates with success when draft is sent", () => {
    useDraftStatusMock.mockReturnValue({
      status: 'sent',
      isTerminal: true,
      timedOut: false,
      isLoading: false,
    })

    renderCheckout(
      <CheckoutReturnPage
        search={{ ...conversationSearch, checkout: 'success' }}
      />,
    )

    expect(navigateMock).toHaveBeenCalledWith({
      to: '/workspace/conversations/$conversationId',
      params: { conversationId: 'conversation_1' },
      search: { send_offer_result: 'success' },
      replace: true,
    })
  })

  it("checkout='success' invalidates dashboard cards and chart when draft is sent", async () => {
    const queryClient = createQueryClient()
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')
    useDraftStatusMock.mockReturnValue({
      status: 'sent',
      isTerminal: true,
      timedOut: false,
      isLoading: false,
    })

    renderCheckout(
      <CheckoutReturnPage
        search={{ ...conversationSearch, checkout: 'success' }}
      />,
      queryClient,
    )

    await waitFor(() => {
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: getGetAnalyticsDashboardCardsQueryKey(),
      })
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: getGetAnalyticsDashboardChartQueryKey(),
      })
    })
  })

  it("checkout='success' navigates with failed when draft failed", () => {
    useDraftStatusMock.mockReturnValue({
      status: 'failed',
      isTerminal: true,
      timedOut: false,
      isLoading: false,
    })

    renderCheckout(
      <CheckoutReturnPage
        search={{ ...conversationSearch, checkout: 'success' }}
      />,
    )

    expect(navigateMock).toHaveBeenCalledWith({
      to: '/workspace/conversations/$conversationId',
      params: { conversationId: 'conversation_1' },
      search: { send_offer_result: 'failed' },
      replace: true,
    })
  })

  it("checkout='success' navigates with failed when draft is canceled", () => {
    useDraftStatusMock.mockReturnValue({
      status: 'canceled',
      isTerminal: true,
      timedOut: false,
      isLoading: false,
    })

    renderCheckout(
      <CheckoutReturnPage
        search={{ ...conversationSearch, checkout: 'success' }}
      />,
    )

    expect(navigateMock).toHaveBeenCalledWith({
      to: '/workspace/conversations/$conversationId',
      params: { conversationId: 'conversation_1' },
      search: { send_offer_result: 'failed' },
      replace: true,
    })
  })

  it('shows timeout error and does not navigate', () => {
    useDraftStatusMock.mockReturnValue({
      status: 'pending',
      isTerminal: false,
      timedOut: true,
      isLoading: false,
    })

    renderCheckout(
      <CheckoutReturnPage
        search={{ ...conversationSearch, checkout: 'success' }}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Tardamos más de lo esperado',
    )
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('retry remounts the polling content', async () => {
    const user = userEvent.setup()
    useDraftStatusMock
      .mockReturnValueOnce({
        status: 'pending',
        isTerminal: false,
        timedOut: true,
        isLoading: false,
      })
      .mockReturnValueOnce({
        status: 'pending',
        isTerminal: false,
        timedOut: false,
        isLoading: false,
      })

    renderCheckout(
      <CheckoutReturnPage
        search={{ ...conversationSearch, checkout: 'success' }}
      />,
    )

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    })

    expect(screen.getByRole('status')).toHaveTextContent(
      'Esperando confirmación…',
    )
    expect(useDraftStatusMock).toHaveBeenCalledTimes(2)
    expect(useDraftStatusMock).toHaveBeenLastCalledWith({
      offerDraftId: 'draft_1',
      enabled: true,
    })
  })
})

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function renderCheckout(ui: ReactElement, queryClient = createQueryClient()) {
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  )
}
