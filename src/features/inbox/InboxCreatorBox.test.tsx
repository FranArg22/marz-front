import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { InboxItem } from './api/inbox'
import { groupInboxItemsByCounterpart } from './groupInboxItemsByCounterpart'
import { useMarkInboxItemReadMutation } from './hooks/useMarkInboxItemReadMutation'
import { InboxCreatorBox } from './InboxCreatorBox'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock('#/features/identity/onboarding/hooks/useIsMobile', () => ({
  useIsMobile: () => false,
}))

vi.mock('./hooks/useMarkInboxItemReadMutation', () => ({
  useMarkInboxItemReadMutation: vi.fn(),
}))

const markReadMutate = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useMarkInboxItemReadMutation).mockReturnValue({
    mutate: markReadMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useMarkInboxItemReadMutation>)
})

describe('InboxCreatorBox', () => {
  it('renders headline, soft summary, and cross-context hint', async () => {
    renderCreatorBox({
      items: [
        makeInboxItem({
          id: 'hard',
          kind: 'offer_received',
          title: 'Decide offer',
          can_mark_read: false,
          preview: 'Offer preview',
        }),
        makeInboxItem({
          id: 'soft',
          kind: 'message_reply',
          title: 'Message',
          can_mark_read: true,
          preview: 'Message preview',
        }),
      ],
      hasWaitingContext: true,
    })

    expect(await screen.findByText('Ana Creator · Campaign')).toBeInTheDocument()
    expect(screen.getByText('Decide offer')).toBeInTheDocument()
    expect(screen.getByText('y 1 mensajes de Ana Creator')).toBeInTheDocument()
    expect(screen.getByText('También esperás algo')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Marcar caja como leída' }),
    ).not.toBeInTheDocument()
    expect(screen.getByLabelText('Se resuelve actuando')).toBeInTheDocument()
  })

  it('marks every soft item in the box as read', async () => {
    const user = userEvent.setup()
    renderCreatorBox({
      items: [
        makeInboxItem({ id: 'soft-1', can_mark_read: true }),
        makeInboxItem({ id: 'soft-2', can_mark_read: true }),
      ],
    })

    await user.click(
      await screen.findByRole('button', { name: 'Marcar caja como leída' }),
    )

    expect(markReadMutate).toHaveBeenCalledTimes(2)
    expect(markReadMutate).toHaveBeenNthCalledWith(
      1,
      { item_id: 'soft-1', read_reason: 'manual' },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
    expect(markReadMutate).toHaveBeenNthCalledWith(
      2,
      { item_id: 'soft-2', read_reason: 'manual' },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
  })
})

function renderCreatorBox({
  hasWaitingContext = false,
  items,
}: {
  hasWaitingContext?: boolean
  items: InboxItem[]
}) {
  const box = groupInboxItemsByCounterpart(items)[0]
  if (!box) throw new Error()
  const rootRoute = createRootRoute({
    component: Outlet,
  })
  const inboxRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/inbox',
    component: () => (
      <ul>
        <InboxCreatorBox
          accountKind="brand"
          box={box}
          hasWaitingContext={hasWaitingContext}
          tone="action"
        />
      </ul>
    ),
  })
  const conversationRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/workspace/conversations/$conversationId',
    component: () => null,
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([inboxRoute, conversationRoute]),
    history: createMemoryHistory({ initialEntries: ['/inbox'] }),
  })
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

function makeInboxItem(overrides: Partial<InboxItem> = {}): InboxItem {
  return {
    id: 'item-1',
    section: 'action',
    kind: 'message_reply',
    status: 'pending',
    campaign: { id: 'campaign-1', name: 'Campaign' },
    counterpart: {
      account_id: 'account-1',
      display_name: 'Ana Creator',
      avatar_url: null,
    },
    meta: {
      primary: 'Ana Creator',
      secondary: 'Campaign',
      timestamp: '2h',
    },
    title: 'Needs your answer',
    preview: 'Preview text',
    occurred_at: '2026-06-02T09:00:00Z',
    action_url: null,
    source_ref: {
      type: 'conversation',
      id: 'conversation-1',
    },
    secondary_ref: null,
    counterpart_account_id: 'account-1',
    counterpart_display_name: 'Ana Creator',
    counterpart_avatar_url: null,
    inline_actions: [],
    navigation_action: null,
    can_mark_read: true,
    metadata: {},
    ...overrides,
  }
}
