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

    // Distinct counterpart names so the 3 action / 2 waiting items stay as
    // separate creator boxes (grouping is by counterpart, keyed by name here).
    const actionItems: BulkSeedInboxItem[] = [
      buildItem({
        recipient_account_id: me.id,
        brand_workspace_id: workspaceId,
        section: 'action',
        kind: 'draft_review',
        occurred_at: '2026-05-18T15:00:00Z',
        counterpart_display_name: 'Creator A',
      }),
      buildItem({
        recipient_account_id: me.id,
        brand_workspace_id: workspaceId,
        section: 'action',
        kind: 'link_review',
        occurred_at: '2026-05-18T15:01:00Z',
        source_ref: { type: 'link', id: newSourceRefId() },
        counterpart_display_name: 'Creator B',
      }),
      buildItem({
        recipient_account_id: me.id,
        brand_workspace_id: workspaceId,
        section: 'action',
        kind: 'application_received',
        occurred_at: '2026-05-18T15:02:00Z',
        source_ref: { type: 'application', id: newSourceRefId() },
        counterpart_display_name: 'Creator C',
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
        counterpart_display_name: 'Creator D',
      }),
      buildItem({
        recipient_account_id: me.id,
        brand_workspace_id: workspaceId,
        section: 'waiting',
        kind: 'application_sent_waiting',
        occurred_at: '2026-05-18T15:04:00Z',
        source_ref: { type: 'application', id: newSourceRefId() },
        counterpart_display_name: 'Creator E',
      }),
    ]

    await seedInboxItems([...actionItems, ...waitingItems])

    try {
      await onboardedBrandUser.signIn(page)
      const inbox = new InboxPage(page)
      await inbox.goto()
      await inbox.expectActionBadge(3)
      await inbox.expectActionBoxes(3)
      await inbox.expectWaitingBadge(2)
      await inbox.expectWaitingBoxes(2)
    } finally {
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
        `${process.env.API_URL ?? process.env.VITE_API_URL ?? 'http://localhost:8080'}/v1/test/accounts`,
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

test.describe('Inbox · agrupación por creador', () => {
  test('agrupa varios items del mismo creador en una sola caja', async ({
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
        occurred_at: '2026-05-18T15:00:00Z',
        counterpart_display_name: 'Juan Creador',
      }),
      buildItem({
        recipient_account_id: me.id,
        brand_workspace_id: workspaceId,
        section: 'action',
        kind: 'message_reply',
        occurred_at: '2026-05-18T15:05:00Z',
        source_ref: { type: 'conversation', id: newSourceRefId() },
        counterpart_display_name: 'Juan Creador',
      }),
    ])

    try {
      await onboardedBrandUser.signIn(page)
      const inbox = new InboxPage(page)
      await inbox.goto()
      // 2 items, mismo creador → 1 caja; el badge cuenta items.
      await inbox.expectActionBadge(2)
      await inbox.expectActionBoxes(1)
      // El mensaje (blando) quedó plegado en la caja como resumen.
      await expect(
        inbox.actionSection.getByText(/mensajes de Juan Creador/i),
      ).toBeVisible()
    } finally {
      await resetInbox(workspaceId!)
    }
  })

  test('caja con item duro no se puede marcar como leída', async ({
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
        counterpart_display_name: 'Creador Duro',
      }),
    ])

    try {
      await onboardedBrandUser.signIn(page)
      const inbox = new InboxPage(page)
      await inbox.goto()
      await inbox.expectActionBoxes(1)
      // El duro mantiene la caja: sin botón de mark-read, con hint.
      await expect(inbox.markBoxReadButton(inbox.actionSection)).toHaveCount(0)
      await expect(
        inbox.actionSection.getByLabel(/se resuelve actuando/i),
      ).toBeVisible()
    } finally {
      await resetInbox(workspaceId!)
    }
  })

  test('caja de solo mensajes se puede marcar como leída y desaparece', async ({
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
        kind: 'message_reply',
        source_ref: { type: 'conversation', id: newSourceRefId() },
        counterpart_display_name: 'Creador Blando',
      }),
    ])

    try {
      await onboardedBrandUser.signIn(page)
      const inbox = new InboxPage(page)
      await inbox.goto()
      await inbox.expectActionBoxes(1)
      await expect(inbox.markBoxReadButton(inbox.actionSection)).toBeVisible()
      await inbox.markFirstActionBoxRead()
      await inbox.expectActionBoxes(0)
    } finally {
      if (itemId) await setInboxItemStatus(itemId, 'read').catch(() => {})
      await resetInbox(workspaceId!)
    }
  })

  test('muestra cross-context hint cuando el creador está en action y waiting', async ({
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
        kind: 'message_reply',
        source_ref: { type: 'conversation', id: newSourceRefId() },
        counterpart_display_name: 'Creador Doble',
      }),
      buildItem({
        recipient_account_id: me.id,
        brand_workspace_id: workspaceId,
        section: 'waiting',
        kind: 'offer_sent_waiting',
        source_ref: { type: 'offer', id: newSourceRefId() },
        counterpart_display_name: 'Creador Doble',
      }),
    ])

    try {
      await onboardedBrandUser.signIn(page)
      const inbox = new InboxPage(page)
      await inbox.goto()
      await inbox.expectActionBoxes(1)
      await inbox.expectWaitingBoxes(1)
      await expect(
        inbox.actionSection.getByText(/también esperás algo/i),
      ).toBeVisible()
    } finally {
      await resetInbox(workspaceId!)
    }
  })
})
