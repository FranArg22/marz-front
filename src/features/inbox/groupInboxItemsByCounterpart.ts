import { InboxItemKind } from '#/shared/api/generated/model'

import type { InboxItem } from './api/inbox'

const HARD_ITEM_PRIORITY: Partial<Record<InboxItem['kind'], number>> = {
  [InboxItemKind.InboxItemKindDraftReview]: 0,
  [InboxItemKind.InboxItemKindLinkReview]: 1,
  [InboxItemKind.InboxItemKindOfferReceived]: 2,
  [InboxItemKind.InboxItemKindApplicationReceived]: 3,
  [InboxItemKind.InboxItemKindDraftChangesRequested]: 4,
  [InboxItemKind.InboxItemKindLinkChangesRequested]: 5,
  [InboxItemKind.InboxItemKindDraftApprovedPublishLink]: 6,
  [InboxItemKind.InboxItemKindConnectionRequestReceived]: 7,
  [InboxItemKind.InboxItemKindMatchSuggested]: 8,
}

const LOWEST_HARD_PRIORITY = 99

export interface InboxCreatorBoxModel {
  canDismiss: boolean
  counterpart: {
    account_id: string | null
    display_name: string
    avatar_url: string | null
  }
  hardItems: InboxItem[]
  headlineItem: InboxItem
  id: string
  items: InboxItem[]
  newestOccurredAt: string
  softCount: number
}

export function groupInboxItemsByCounterpart(
  items: InboxItem[],
): InboxCreatorBoxModel[] {
  const groups = new Map<string, InboxItem[]>()

  for (const item of items) {
    const key = getCounterpartKey(item)
    groups.set(key, [...(groups.get(key) ?? []), item])
  }

  return Array.from(groups.entries())
    .map(([key, groupItems]) => createCreatorBox(key, groupItems))
    .sort(
      (first, second) =>
        Date.parse(second.newestOccurredAt) -
        Date.parse(first.newestOccurredAt),
    )
}

export function getCounterpartKey(item: InboxItem): string {
  const accountId = item.counterpart?.account_id ?? item.counterpart_account_id
  if (accountId) return accountId

  return getCounterpartName(item).toLowerCase()
}

function getCounterpartName(item: InboxItem): string {
  return (
    firstNonEmpty(
      item.counterpart?.display_name,
      item.counterpart_display_name,
      item.meta.primary,
    ) ?? ''
  )
}

function firstNonEmpty(
  ...values: (string | null | undefined)[]
): string | null {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return null
}

function createCreatorBox(
  key: string,
  groupItems: InboxItem[],
): InboxCreatorBoxModel {
  if (groupItems.length === 0) {
    throw new Error()
  }

  const items = groupItems.toSorted(compareItemsForHeadline)
  const headlineItem = items[0] as InboxItem
  const hardItems = items.filter(isHardInboxItem)
  const softCount = items.length - hardItems.length
  const counterpartName = getCounterpartName(headlineItem)
  const newestOccurredAt = groupItems.toSorted(
    (first, second) =>
      Date.parse(second.occurred_at) - Date.parse(first.occurred_at),
  )[0]?.occurred_at

  if (!newestOccurredAt) {
    throw new Error()
  }

  return {
    canDismiss: items.every((item) => item.can_mark_read),
    counterpart: {
      account_id:
        headlineItem.counterpart?.account_id ??
        headlineItem.counterpart_account_id ??
        null,
      display_name: counterpartName,
      avatar_url: firstNonEmpty(
        headlineItem.counterpart?.avatar_url,
        headlineItem.counterpart_avatar_url,
      ),
    },
    hardItems,
    headlineItem,
    id: key,
    items,
    newestOccurredAt,
    softCount,
  }
}

function compareItemsForHeadline(first: InboxItem, second: InboxItem) {
  const firstHard = isHardInboxItem(first)
  const secondHard = isHardInboxItem(second)

  if (firstHard !== secondHard) return firstHard ? -1 : 1

  if (firstHard && secondHard) {
    const priorityDelta =
      getHardItemPriority(first) - getHardItemPriority(second)
    if (priorityDelta !== 0) return priorityDelta
  }

  return Date.parse(second.occurred_at) - Date.parse(first.occurred_at)
}

function getHardItemPriority(item: InboxItem) {
  return HARD_ITEM_PRIORITY[item.kind] ?? LOWEST_HARD_PRIORITY
}

function isHardInboxItem(item: InboxItem) {
  return item.can_mark_read === false
}
