import { describe, expect, it } from 'vitest'

import type { InboxItem } from './api/inbox'
import {
  getCounterpartKey,
  groupInboxItemsByCounterpart,
} from './groupInboxItemsByCounterpart'

describe('groupInboxItemsByCounterpart', () => {
  it('groups by counterpart inside one section and sorts boxes by newest item', () => {
    const boxes = groupInboxItemsByCounterpart([
      makeInboxItem({
        id: 'ana-old',
        occurred_at: '2026-06-01T10:00:00Z',
        counterpart: {
          account_id: 'ana',
          display_name: 'Ana',
          avatar_url: null,
        },
      }),
      makeInboxItem({
        id: 'bea-new',
        occurred_at: '2026-06-03T10:00:00Z',
        counterpart: {
          account_id: 'bea',
          display_name: 'Bea',
          avatar_url: null,
        },
      }),
      makeInboxItem({
        id: 'ana-new',
        occurred_at: '2026-06-02T10:00:00Z',
        counterpart: {
          account_id: 'ana',
          display_name: 'Ana',
          avatar_url: null,
        },
      }),
    ])

    expect(boxes).toHaveLength(2)
    expect(firstBox(boxes).counterpart.display_name).toBe('Bea')
    expect(boxes[1]?.items.map((item) => item.id)).toEqual([
      'ana-new',
      'ana-old',
    ])
  })

  it('keeps the same creator separate by section when called per section', () => {
    const actionBoxes = groupInboxItemsByCounterpart([
      makeInboxItem({ id: 'action', section: 'action' }),
    ])
    const waitingBoxes = groupInboxItemsByCounterpart([
      makeInboxItem({ id: 'waiting', section: 'waiting' }),
    ])

    expect(actionBoxes).toHaveLength(1)
    expect(waitingBoxes).toHaveLength(1)
    expect(getCounterpartKey(firstBox(actionBoxes).headlineItem)).toBe(
      getCounterpartKey(firstBox(waitingBoxes).headlineItem),
    )
  })

  it('prioritizes hard items before soft message replies', () => {
    const boxes = groupInboxItemsByCounterpart([
      makeInboxItem({
        id: 'message',
        kind: 'message_reply',
        title: 'Message',
        can_mark_read: true,
        occurred_at: '2026-06-03T10:00:00Z',
      }),
      makeInboxItem({
        id: 'review',
        kind: 'draft_review',
        title: 'Review draft',
        can_mark_read: false,
        occurred_at: '2026-06-01T10:00:00Z',
      }),
    ])

    const box = firstBox(boxes)

    expect(box.headlineItem.id).toBe('review')
    expect(box.softCount).toBe(1)
  })

  it('marks boxes with only soft items as dismissable', () => {
    const boxes = groupInboxItemsByCounterpart([
      makeInboxItem({ id: 'message-1', can_mark_read: true }),
      makeInboxItem({ id: 'message-2', can_mark_read: true }),
    ])

    expect(firstBox(boxes).canDismiss).toBe(true)
  })

  it('blocks dismissal when any hard item is present', () => {
    const boxes = groupInboxItemsByCounterpart([
      makeInboxItem({ id: 'message', can_mark_read: true }),
      makeInboxItem({
        id: 'offer',
        kind: 'offer_received',
        can_mark_read: false,
      }),
    ])

    expect(firstBox(boxes).canDismiss).toBe(false)
  })

  it('falls back to meta.primary when counterpart name is empty', () => {
    const boxes = groupInboxItemsByCounterpart([
      makeInboxItem({
        counterpart: {
          account_id: null,
          display_name: '',
          avatar_url: '',
        },
        counterpart_account_id: null,
        counterpart_display_name: '',
        counterpart_avatar_url: '',
        meta: { primary: 'Marca Real', secondary: 'Campaign', timestamp: '2h' },
      }),
    ])

    expect(firstBox(boxes).counterpart.display_name).toBe('Marca Real')
    expect(firstBox(boxes).counterpart.avatar_url).toBeNull()
  })
})

function firstBox(boxes: ReturnType<typeof groupInboxItemsByCounterpart>) {
  const box = boxes[0]
  if (!box) throw new Error()
  return box
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
