import { expect, test } from '../../support/fixtures'
import { ConversationPage } from '../../poms/conversation.pom'
import {
  createCaptureFailedFault,
  getCurrentOfferId,
  sendPaidOffer,
  STRIPE_TEST_MODE_ENABLED,
} from '../../support/paid-offers'

test.describe('Offers: paid offer accept flow', () => {
  test('offers.paid.accept_captures_hold_and_marks_offer_accepted', async ({
    chatPairOfferReady,
  }) => {
    test.skip(!STRIPE_TEST_MODE_ENABLED, 'Requires backend with STRIPE_TEST_MODE=1')
    test.setTimeout(180_000)

    await sendPaidOffer(chatPairOfferReady)

    const creatorChat = new ConversationPage(chatPairOfferReady.creatorPage)
    await creatorChat.goto(chatPairOfferReady.conversationId)

    await chatPairOfferReady.creatorPage
      .getByRole('button', { name: /Aceptar|Accept/i })
      .click()

    await expect(
      creatorChat.timeline.getByRole('article', { name: /Oferta aceptada/i }),
    ).toBeVisible({ timeout: 30_000 })
    await expect(creatorChat.timeline).not.toContainText(/Stripe/i)
    await expect(creatorChat.timeline).not.toContainText(/PaymentIntent/i)
    await expect(creatorChat.timeline).not.toContainText(/\bcapture\b/i)
  })

  test('offers.paid.accept_capture_failed_keeps_offer_sent', async ({
    chatPairOfferReady,
  }) => {
    test.skip(!STRIPE_TEST_MODE_ENABLED, 'Requires backend with STRIPE_TEST_MODE=1')
    test.setTimeout(180_000)

    await sendPaidOffer(chatPairOfferReady)
    const offerId = await getCurrentOfferId(chatPairOfferReady)
    await createCaptureFailedFault(offerId)

    const creatorChat = new ConversationPage(chatPairOfferReady.creatorPage)
    await creatorChat.goto(chatPairOfferReady.conversationId)

    await chatPairOfferReady.creatorPage
      .getByRole('button', { name: /Aceptar|Accept/i })
      .click()

    await expect(
      chatPairOfferReady.creatorPage.getByText(/No se pudo procesar el pago/i),
    ).toBeVisible({ timeout: 15_000 })
    await expect(
      chatPairOfferReady.creatorPage.getByRole('button', {
        name: /Aceptar|Accept/i,
      }),
    ).toBeVisible({ timeout: 15_000 })
    await expect(
      creatorChat.timeline.getByRole('article', { name: /Oferta aceptada/i }),
    ).toHaveCount(0)
    await expect(creatorChat.timeline).toContainText(/Oferta enviada/i)
    await expect(creatorChat.timeline).not.toContainText(/Stripe/i)
    await expect(creatorChat.timeline).not.toContainText(/PaymentIntent/i)
    await expect(creatorChat.timeline).not.toContainText(/\bcapture\b/i)
  })
})
