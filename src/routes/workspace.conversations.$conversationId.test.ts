import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const routeMocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  useParams: vi.fn(),
  useSearch: vi.fn(),
  useRouteContext: vi.fn(),
}))

const toastMock = vi.hoisted(() =>
  Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
  }),
)

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
    useParams: routeMocks.useParams,
    useSearch: routeMocks.useSearch,
    useRouteContext: routeMocks.useRouteContext,
  }),
  useNavigate: () => routeMocks.navigate,
}))

vi.mock('sonner', () => ({
  toast: toastMock,
}))

vi.mock('#/features/chat/components/ConversationContextHeader', () => ({
  ConversationContextHeader: () => null,
}))

vi.mock('#/features/chat/components/ConversationView', () => ({
  ConversationView: () => null,
}))

vi.mock('#/features/chat/queries', () => ({
  useConversationDetailQuery: () => ({
    data: {
      counterpart: {
        display_name: 'Creator',
        id: 'creator_1',
      },
    },
  }),
}))

vi.mock('#/features/offers/components/ConversationOffersPanel', () => ({
  ConversationOffersPanel: () => null,
}))

vi.mock('#/features/offers/components/SendOfferSidesheet', () => ({
  SendOfferSidesheet: () => null,
}))

vi.mock('#/features/offers/hooks/useCanSendOffer', () => ({
  useCanSendOffer: () => true,
}))

vi.mock('#/features/offers/store/sendOfferWizardStore', () => ({
  useSendOfferWizard: (selector: (state: { open: () => void }) => unknown) =>
    selector({ open: vi.fn() }),
}))

vi.mock('#/features/payments/components/MarkAsPaidDialog', () => ({
  MarkAsPaidDialog: () => null,
}))

vi.mock('#/features/deliverables/components/SubmitLinkSidesheet', () => ({
  SubmitLinkSidesheet: () => null,
}))

vi.mock('#/features/deliverables/components/UploadDraftDialog', () => ({
  UploadDraftDialog: () => null,
}))

vi.mock('#/features/deliverables/api/conversationDeliverables', () => ({
  useGetConversationDeliverablesQuery: () => ({
    data: {
      deliverables: [],
      offer_mode: null,
    },
  }),
}))

import { conversationSearchSchema, Route } from './workspace.conversations.$conversationId'

function renderConversationRoute(search: Record<string, unknown>) {
  routeMocks.useParams.mockReturnValue({ conversationId: 'conversation_1' })
  routeMocks.useSearch.mockReturnValue(search)
  routeMocks.useRouteContext.mockReturnValue({
    accountId: 'account_1',
    sessionKind: 'brand',
    viewerRole: 'owner',
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
      highlightPaymentId: '33333333-3333-4333-8333-333333333333',
      send_offer_result: 'success',
    }),
  ).toEqual({
    highlightPaymentId: '33333333-3333-4333-8333-333333333333',
  })
}

describe('/workspace/conversations/$conversationId route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('accepts an optional highlightPaymentId uuid search param', () => {
    expect(conversationSearchSchema.parse({})).toEqual({})
    expect(
      conversationSearchSchema.parse({
        highlightPaymentId: '33333333-3333-4333-8333-333333333333',
      }),
    ).toEqual({
      highlightPaymentId: '33333333-3333-4333-8333-333333333333',
    })
  })

  it('accepts an optional send_offer_result search param', () => {
    expect(
      conversationSearchSchema.parse({ send_offer_result: 'success' }),
    ).toEqual({ send_offer_result: 'success' })
  })

  it('rejects invalid highlightPaymentId values', () => {
    expect(() =>
      conversationSearchSchema.parse({ highlightPaymentId: 'payment-1' }),
    ).toThrow()
  })

  it('shows a success toast and clears send_offer_result', async () => {
    renderConversationRoute({ send_offer_result: 'success' })

    await waitFor(() => {
      expect(toastMock.success).toHaveBeenCalledWith('Offer enviada')
    })
    expectSearchParamCleaned()
  })

  it('shows a neutral toast and clears send_offer_result', async () => {
    renderConversationRoute({ send_offer_result: 'cancelled' })

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith('Volviste sin enviar la offer')
    })
    expectSearchParamCleaned()
  })

  it('shows an error toast and clears send_offer_result', async () => {
    renderConversationRoute({ send_offer_result: 'failed' })

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith(
        'No pudimos procesar tu tarjeta. Probá de nuevo o gestioná tu tarjeta.',
      )
    })
    expectSearchParamCleaned()
  })

  it('does not show an extra toast without send_offer_result', () => {
    renderConversationRoute({})

    expect(toastMock).not.toHaveBeenCalled()
    expect(toastMock.success).not.toHaveBeenCalled()
    expect(toastMock.error).not.toHaveBeenCalled()
    expect(routeMocks.navigate).not.toHaveBeenCalled()
  })
})
