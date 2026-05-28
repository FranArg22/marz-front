import { expect, test } from '../../support/fixtures'
import { ConversationPage } from '../../poms/conversation.pom'
import {
  createCaptureFailedFault,
  getCurrentOffer,
  getCurrentOfferId,
  sendPaidOffer,
  STRIPE_TEST_MODE_ENABLED,
} from '../../support/paid-offers'

async function expectNoTechnicalPaymentCopy(chat: ConversationPage) {
  await expect(chat.timeline).not.toContainText(/Stripe/i)
  await expect(chat.timeline).not.toContainText(/PaymentIntent/i)
  await expect(chat.timeline).not.toContainText(/\bhold\b/i)
  await expect(chat.timeline).not.toContainText(/\bcapture\b/i)
}

test.describe('Offers: paid offer creator accept flow', () => {
  test('offers.paid.creator_accept_captures_hold', async ({
    chatPairOfferReady,
  }) => {
    test.skip(!STRIPE_TEST_MODE_ENABLED, 'Requires backend with STRIPE_TEST_MODE=1')
    test.setTimeout(180_000)

    await sendPaidOffer(chatPairOfferReady)

    const creatorChat = new ConversationPage(chatPairOfferReady.creatorPage)
    await creatorChat.goto(chatPairOfferReady.conversationId)

    await expect(creatorChat.offerSentCard()).toBeVisible()
    await creatorChat.acceptOfferButton().click()

    await expect(creatorChat.offerAcceptedCard()).toBeVisible({
      timeout: 30_000,
    })
    await expect
      .poll(async () => (await getCurrentOffer(chatPairOfferReady)).status, {
        timeout: 30_000,
      })
      .toBe('accepted')
    await expectNoTechnicalPaymentCopy(creatorChat)

    await chatPairOfferReady.creatorPage.reload()
    await creatorChat.waitForReady()
    await expect(creatorChat.offerAcceptedCard()).toHaveCount(1)
    await expectNoTechnicalPaymentCopy(creatorChat)
  })

  test('offers.paid.creator_accept_capture_failed', async ({
    chatPairOfferReady,
  }) => {
    test.skip(!STRIPE_TEST_MODE_ENABLED, 'Requires backend with STRIPE_TEST_MODE=1')
    test.setTimeout(180_000)

    await sendPaidOffer(chatPairOfferReady)
    const offerId = await getCurrentOfferId(chatPairOfferReady)
    await createCaptureFailedFault(offerId)

    const creatorChat = new ConversationPage(chatPairOfferReady.creatorPage)
    await creatorChat.goto(chatPairOfferReady.conversationId)

    await expect(creatorChat.offerSentCard()).toBeVisible()
    const acceptButton = creatorChat.acceptOfferButton()
    await expect(acceptButton).toBeEnabled()
    await acceptButton.click()

    await expect(
      chatPairOfferReady.creatorPage.getByText(/No se pudo procesar el pago/i),
    ).toBeVisible({ timeout: 15_000 })
    await expect
      .poll(async () => (await getCurrentOffer(chatPairOfferReady)).status, {
        timeout: 15_000,
      })
      .toBe('sent')
    await expect(creatorChat.offerAcceptedCard()).toHaveCount(0)
    await expect(creatorChat.offerSentCard()).toBeVisible()
    await expect(acceptButton).toBeVisible()
    await expectNoTechnicalPaymentCopy(creatorChat)
  })
})
