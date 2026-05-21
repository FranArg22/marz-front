import { randomUUID } from 'node:crypto'

import {
  resetInbox,
  seedInboxItems,
  setInboxItemStatus,
  test,
  expect,
} from '../../support/fixtures'
import type { BulkSeedInboxItem } from '#/shared/api/test-generated/model'
import { InboxPage } from '../../poms/inbox.pom'

function newSourceRefId(): string {
  return randomUUID()
}

function buildItem(overrides: Partial<BulkSeedInboxItem>): BulkSeedInboxItem {
  const sourceRefId = overrides.source_ref?.id ?? newSourceRefId()
  return {
    recipient_account_id: '',
    section: 'action',
    kind: 'draft_review',
    status: 'pending',
    occurred_at: new Date().toISOString(),
    payload: { ref_id: sourceRefId },
    source_ref: { type: 'deliverable', id: sourceRefId },
    ...overrides,
  }
}

test.describe('Inbox · smoke', () => {
  test('ESC-1: brand entra al Inbox desde el sidebar', async ({
    page,
    onboardedBrandUser,
  }) => {
    const me = await onboardedBrandUser.onboardFull('brand')
    const workspaceId = me.brand_workspace?.id
    expect(workspaceId).toBeTruthy()

    await seedInboxItems([
      buildItem({
        recipient_account_id: me.id,
        brand_workspace_id: workspaceId,
        section: 'action',
        kind: 'draft_review',
      }),
    ])

    try {
      await onboardedBrandUser.signIn(page)
      const inbox = new InboxPage(page)
      await inbox.goto()
      await expect(inbox.actionSection).toBeVisible({ timeout: 8000 })
    } finally {
      await resetInbox(workspaceId!)
    }
  })

  test('ESC-5: action items arriba, waiting abajo, con contadores', async ({
    page,
    onboardedBrandUser,
  }) => {
    const me = await onboardedBrandUser.onboardFull('brand')
    const workspaceId = me.brand_workspace?.id
    expect(workspaceId).toBeTruthy()

    const actionItems: BulkSeedInboxItem[] = [
      buildItem({
        recipient_account_id: me.id,
        brand_workspace_id: workspaceId,
        section: 'action',
        kind: 'draft_review',
        occurred_at: '2026-05-18T15:00:00Z',
      }),
      buildItem({
        recipient_account_id: me.id,
        brand_workspace_id: workspaceId,
        section: 'action',
        kind: 'link_review',
        occurred_at: '2026-05-18T15:01:00Z',
        source_ref: { type: 'link', id: newSourceRefId() },
      }),
      buildItem({
        recipient_account_id: me.id,
        brand_workspace_id: workspaceId,
        section: 'action',
        kind: 'application_received',
        occurred_at: '2026-05-18T15:02:00Z',
        source_ref: { type: 'application', id: newSourceRefId() },
      }),
    ]
    const waitingItems: BulkSeedInboxItem[] = [
      buildItem({
        recipient_account_id: me.id,
        brand_workspace_id: workspaceId,
        section: 'waiting',
        kind: 'offer_sent_waiting',
        occurred_at: '2026-05-18T15:03:00Z',
        source_ref: { type: 'offer', id: newSourceRefId() },
      }),
      buildItem({
        recipient_account_id: me.id,
        brand_workspace_id: workspaceId,
        section: 'waiting',
        kind: 'invite_sent_waiting',
        occurred_at: '2026-05-18T15:04:00Z',
        source_ref: { type: 'invite', id: newSourceRefId() },
      }),
    ]

    await seedInboxItems([...actionItems, ...waitingItems])

    try {
      await onboardedBrandUser.signIn(page)
      const inbox = new InboxPage(page)
      await inbox.goto()
      await inbox.expectActionCount(3)
      await inbox.expectWaitingCount(2)
    } finally {
      await resetInbox(workspaceId!)
    }
  })

  test('ESC-22: mark as read elimina el item de la lista', async ({
    page,
    onboardedBrandUser,
  }) => {
    const me = await onboardedBrandUser.onboardFull('brand')
    const workspaceId = me.brand_workspace?.id
    expect(workspaceId).toBeTruthy()

    const [itemId] = await seedInboxItems([
      buildItem({
        recipient_account_id: me.id,
        brand_workspace_id: workspaceId,
        section: 'action',
        kind: 'draft_review',
      }),
    ])
    expect(itemId).toBeTruthy()

    try {
      await onboardedBrandUser.signIn(page)
      const inbox = new InboxPage(page)
      await inbox.goto()
      await expect(inbox.actionSection.getByRole('listitem')).toHaveCount(1)

      await inbox.markFirstActionItemRead()
      await expect(inbox.actionSection.getByRole('listitem')).toHaveCount(0)
    } finally {
      if (itemId) await setInboxItemStatus(itemId, 'read').catch(() => {})
      await resetInbox(workspaceId!)
    }
  })

  test('ESC-28: empty state unificado cuando no hay items', async ({
    page,
    onboardedBrandUser,
  }) => {
    const me = await onboardedBrandUser.onboardFull('brand')
    const workspaceId = me.brand_workspace?.id
    expect(workspaceId).toBeTruthy()

    await resetInbox(workspaceId!)

    await onboardedBrandUser.signIn(page)
    const inbox = new InboxPage(page)
    await inbox.goto()
    await inbox.expectEmpty()
  })

  test('ESC-31: items de otro workspace no aparecen', async ({
    page,
    onboardedBrandUser,
    browser,
  }) => {
    const me = await onboardedBrandUser.onboardFull('brand')
    const workspaceId = me.brand_workspace?.id
    expect(workspaceId).toBeTruthy()

    const otherContext = await browser.newContext()
    let otherWorkspaceId: string | undefined
    try {
      const otherEmail = `other.${Date.now().toString(36)}+clerk_test@example.com`
      const otherCreate = await fetch(
        `${process.env.API_URL ?? 'http://localhost:8080'}/v1/test/accounts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Test-Secret': process.env.MARZ_TEST_SECRET ?? '',
          },
          body: JSON.stringify({
            clerk_user_id: `user_other_${Date.now()}`,
            email: otherEmail,
            full_name: 'Other Workspace Brand',
            kind: 'brand',
            onboarding_status: 'onboarded',
            workspace_name: 'Other Workspace',
          }),
        },
      )
      expect(otherCreate.ok).toBeTruthy()
      const otherBody = (await otherCreate.json()) as {
        id: string
        workspace_id: string | null
      }
      otherWorkspaceId = otherBody.workspace_id ?? undefined
      expect(otherBody.id).toBeTruthy()

      await seedInboxItems([
        buildItem({
          recipient_account_id: otherBody.id,
          brand_workspace_id: otherBody.workspace_id ?? undefined,
          section: 'action',
          kind: 'draft_review',
        }),
      ])

      await onboardedBrandUser.signIn(page)
      const inbox = new InboxPage(page)
      await inbox.goto()
      await inbox.expectEmpty()
    } finally {
      await resetInbox(workspaceId!)
      if (otherWorkspaceId) await resetInbox(otherWorkspaceId)
      await otherContext.close()
    }
  })
})
