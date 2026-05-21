import {
  bulkSeedTestInboxItems,
  resetTestWorkspace,
  setTestInboxItemStatus,
} from '#/shared/api/test-generated/test/test'
import type {
  BulkSeedInboxItem,
  SetTestInboxItemStatusRequestStatus,
} from '#/shared/api/test-generated/model'

export async function seedInboxItems(
  items: BulkSeedInboxItem[],
): Promise<string[]> {
  const res = await bulkSeedTestInboxItems({ items })
  return (res as { data: { item_ids: string[] } }).data.item_ids
}

export async function setInboxItemStatus(
  itemId: string,
  status: SetTestInboxItemStatusRequestStatus,
): Promise<void> {
  await setTestInboxItemStatus(itemId, { status })
}

export async function resetInbox(workspaceId: string): Promise<void> {
  await resetTestWorkspace({ workspace_id: workspaceId })
}
