import { test, expect } from '../../support/fixtures'
import { ConversationPage } from '../../poms/conversation.pom'
import { DeliverablePanel } from '../../poms/deliverable-panel.pom'

const WS_TIMEOUT = 2_000

test.describe('link submit/approve live panel updates', () => {
  test('creator submit link updates the brand panel without refresh', async ({
    chatPair,
  }) => {
    const { conversationId, brandPage, creatorPage } = chatPair
    const url = `https://www.youtube.com/watch?v=live${Date.now()}`

    const brandChat = new ConversationPage(brandPage)
    const creatorChat = new ConversationPage(creatorPage)
    await brandChat.goto(conversationId)
    await creatorChat.goto(conversationId)

    const creatorPanel = new DeliverablePanel(creatorPage)
    const brandPanel = new DeliverablePanel(brandPage)

    test.skip(
      (await creatorPanel.submitLinkButton().count()) === 0,
      'TODO: needs `seed_deliverable_state=draft_approved` from backend harness so creator sees the submit-link CTA.',
    )

    await creatorPanel.expectVisible()
    await creatorPanel.submitLink(url)

    await brandPanel.expectContains('Link submitted', WS_TIMEOUT)
    await expect(brandPanel.root.getByRole('link', { name: url })).toBeVisible({
      timeout: WS_TIMEOUT,
    })
  })

  test('approving a link updates brand and creator panels without refresh', async ({
    chatPair,
  }) => {
    const { conversationId, brandPage, creatorPage } = chatPair

    const brandChat = new ConversationPage(brandPage)
    const creatorChat = new ConversationPage(creatorPage)
    await brandChat.goto(conversationId)
    await creatorChat.goto(conversationId)

    const brandPanel = new DeliverablePanel(brandPage)
    const creatorPanel = new DeliverablePanel(creatorPage)

    test.skip(
      (await brandPanel.approveLinkButton().count()) === 0,
      'TODO: needs `seed_deliverable_state=link_submitted` from backend harness so brand sees the approve-link CTA.',
    )

    await creatorPanel.expectVisible(10_000)
    await brandPanel.approveLinkButton().click()

    await brandPanel.expectContains('Link approved', WS_TIMEOUT)
    await creatorPanel.expectContains('Link approved', WS_TIMEOUT)
    await expect(brandPanel.root.getByRole('link').first()).toBeVisible({
      timeout: WS_TIMEOUT,
    })
    await expect(creatorPanel.root.getByRole('link').first()).toBeVisible({
      timeout: WS_TIMEOUT,
    })
  })
})
