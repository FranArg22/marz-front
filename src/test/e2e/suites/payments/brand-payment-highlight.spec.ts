import { expect, test } from '../../support/fixtures'
import { ConversationPage } from '../../poms/conversation.pom'
import { PaymentsFlow, PaymentsPage } from '../../poms/payments.pom'

test.describe('brand payments highlight navigation', () => {
  test('row click opens the conversation and highlights the payment card', async ({
    chatPairWithCompletedDeliverable,
  }) => {
    const { brandPage, conversationId, deliverableId } =
      chatPairWithCompletedDeliverable
    test.skip(
      !deliverableId,
      'TODO: needs `seed_deliverable_state=completed` from backend harness.',
    )

    const chat = new ConversationPage(brandPage)
    await chat.goto(conversationId)

    const flow = new PaymentsFlow(brandPage)
    await flow.markAsPaid()
    await flow.expectMarkedCardVisible()

    const payments = new PaymentsPage(brandPage)
    await payments.goto()
    const row = payments.row(/E2E Creator/i)
    await expect(row).toBeVisible({ timeout: 10_000 })
    await row.click()

    await expect(brandPage).toHaveURL(
      /\/workspace\/conversations\/[^?]+\?(.+&)?highlightPaymentId=/,
    )
    await flow.expectMarkedCardVisible()
    await expect(flow.highlightedCard).toBeVisible()
  })
})
