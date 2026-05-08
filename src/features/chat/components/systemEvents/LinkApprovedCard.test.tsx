import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { LinkApprovedCard } from './LinkApprovedCard'
import type { MessageItem } from '#/features/chat/types'
import type { DeliverableStatus } from '#/features/deliverables/types'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

const mockUseGetConversationDeliverablesQuery = vi.fn()

vi.mock('#/features/deliverables/api/conversationDeliverables', () => ({
  useGetConversationDeliverablesQuery: (...args: unknown[]) =>
    mockUseGetConversationDeliverablesQuery(...args),
}))

function makeMessage(): MessageItem {
  return {
    id: 'msg-1',
    conversation_id: 'conv-1',
    author_account_id: 'system',
    type: 'system_event',
    text_content: null,
    event_type: 'LinkApproved',
    payload: {
      snapshot: {
        deliverable_id: 'del-1',
        deliverable_display_label: 'YouTube Video',
      },
    },
    created_at: '2026-05-08T12:00:00Z',
    read_by_self: false,
  }
}

function mockDeliverable(status: DeliverableStatus) {
  mockUseGetConversationDeliverablesQuery.mockReturnValue({
    data: { deliverables: [{ id: 'del-1', status }] },
  })
}

describe('LinkApprovedCard', () => {
  beforeEach(() => {
    mockUseGetConversationDeliverablesQuery.mockReset()
    mockDeliverable('completed')
  })

  it.each([
    ['brand owner', { kind: 'brand' as const, role: 'owner' as const }, true],
    [
      'brand member',
      { kind: 'brand' as const, role: 'member' as const },
      false,
    ],
    ['brand admin', { kind: 'brand' as const, role: 'admin' as const }, false],
    ['creator', { kind: 'creator' as const, role: undefined }, false],
  ])(
    'shows Mark as paid for %s only when allowed',
    (_label, viewer, visible) => {
      render(
        <LinkApprovedCard
          message={makeMessage()}
          conversationId="conv-1"
          viewer={viewer}
        />,
      )

      const button = screen.queryByRole('button', { name: /mark as paid/i })
      expect(Boolean(button)).toBe(visible)
    },
  )

  it('hides Mark as paid when the deliverable is already paid', () => {
    mockDeliverable('paid')

    render(
      <LinkApprovedCard
        message={makeMessage()}
        conversationId="conv-1"
        viewer={{ kind: 'brand', role: 'owner' }}
      />,
    )

    expect(
      screen.queryByRole('button', { name: /mark as paid/i }),
    ).not.toBeInTheDocument()
  })

  it('calls onMarkAsPaid with the correct deliverable id', async () => {
    const user = userEvent.setup()
    const onMarkAsPaid = vi.fn()
    render(
      <LinkApprovedCard
        message={makeMessage()}
        conversationId="conv-1"
        viewer={{ kind: 'brand', role: 'owner' }}
        onMarkAsPaid={onMarkAsPaid}
      />,
    )

    await user.click(screen.getByRole('button', { name: /mark as paid/i }))

    expect(onMarkAsPaid).toHaveBeenCalledWith('del-1')
  })
})
