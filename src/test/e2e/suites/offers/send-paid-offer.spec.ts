import { createHash } from 'node:crypto'

import { expect, test } from '../../support/fixtures'
import {
  cancelStripeHostedCheckout,
  completeStripe3dsAuthentication,
  createHoldDeclinedFault,
  createPaidOfferReadyChatPair,
  dateDaysFromNow,
  fillPaidOfferDraft,
  openSendOfferSidesheet,
  PAID_OFFER_BASE_AMOUNT,
  PAID_OFFER_EXPECTED_BASE_AMOUNT,
  PAID_OFFER_EXPECTED_BONUS_AMOUNT,
  PAID_OFFER_SCA_CARD,
  setupPaidBrand,
  STRIPE_TEST_MODE_ENABLED,
  submitPaidOffer,
} from '../../support/paid-offers'
import { E2E_RUN_ID } from '../../support/env'

function buildPaidOfferUserKey(testInfo: {
  testId: string
  workerIndex: number
}): string {
  const testHash = createHash('sha1')
    .update(testInfo.testId)
    .digest('hex')
    .slice(0, 8)
  return `${testInfo.workerIndex}.${E2E_RUN_ID}.${testHash}`
}

test.describe('Offers: paid offer send flow', () => {
  test('offers.paid.send_summary_displays_base_amount_and_bonus', async ({
    chatPairOfferReady,
  }) => {
    test.skip(!STRIPE_TEST_MODE_ENABLED, 'Requires backend with STRIPE_TEST_MODE=1')
    test.setTimeout(180_000)

    await setupPaidBrand(chatPairOfferReady)
    await openSendOfferSidesheet(chatPairOfferReady)
    await fillPaidOfferDraft(chatPairOfferReady)

    const summary = chatPairOfferReady.brandPage.getByTestId(
      'offers.send.summary_block',
    )
    await expect(summary).toBeVisible()
    await expect(summary).toContainText(PAID_OFFER_EXPECTED_BASE_AMOUNT)
    await expect(summary).toContainText(PAID_OFFER_EXPECTED_BONUS_AMOUNT)
    await expect(summary).toContainText(
      /El cobro se realiza cuando el creator acepta/i,
    )
    await expect(summary).not.toContainText(/processing fee/i)
    await expect(summary).not.toContainText(/Stripe/i)
    await expect(summary).not.toContainText(/comision|comisión|fee/i)
  })

  test('offers.paid.send_creates_hold_and_sent_offer', async ({
    chatPairOfferReady,
  }) => {
    test.skip(!STRIPE_TEST_MODE_ENABLED, 'Requires backend with STRIPE_TEST_MODE=1')
    test.setTimeout(180_000)

    const chat = await setupPaidBrand(chatPairOfferReady)
    await openSendOfferSidesheet(chatPairOfferReady)
    await fillPaidOfferDraft(chatPairOfferReady)
    await submitPaidOffer(chatPairOfferReady)

    await expect(
      chatPairOfferReady.brandPage.getByTestId('offers.send.submit_button'),
    ).toBeHidden({ timeout: 30_000 })
    await expect(
      chat.timeline.getByRole('article', { name: /Oferta enviada/i }),
    ).toBeVisible({ timeout: 15_000 })
    await expect(chat.timeline).not.toContainText(/Stripe/i)
    await expect(chat.timeline).not.toContainText(/PaymentIntent/i)
    await expect(chat.timeline).not.toContainText(/\bhold\b/i)
    await expect(chat.timeline).not.toContainText(/\bcapture\b/i)
  })

  test('offers.paid.send_hold_declined_keeps_draft', async ({
    chatPairOfferReady,
  }) => {
    test.skip(!STRIPE_TEST_MODE_ENABLED, 'Requires backend with STRIPE_TEST_MODE=1')
    test.setTimeout(180_000)

    const chat = await setupPaidBrand(chatPairOfferReady)
    await openSendOfferSidesheet(chatPairOfferReady)
    await fillPaidOfferDraft(chatPairOfferReady)
    await createHoldDeclinedFault()
    await submitPaidOffer(chatPairOfferReady)

    await expect(
      chatPairOfferReady.brandPage.getByTestId('offers.send.error_banner'),
    ).toBeVisible({ timeout: 15_000 })
    await expect(
      chatPairOfferReady.brandPage.getByTestId('offers.send.submit_button'),
    ).toBeVisible()
    await expect(
      chatPairOfferReady.brandPage.getByLabel(/^(Monto|Amount)$/i),
    ).toHaveValue(PAID_OFFER_BASE_AMOUNT)
    await expect(
      chatPairOfferReady.brandPage.getByLabel(
        /Publicacion tentativa|Publicación tentativa/i,
      ),
    ).toHaveValue(dateDaysFromNow(7))
    await expect(
      chatPairOfferReady.brandPage.getByLabel(/Fecha limite|Fecha límite/i),
    ).toHaveValue(dateDaysFromNow(14))
    await expect(
      chat.timeline.getByRole('article', { name: /Oferta enviada/i }),
    ).toHaveCount(0)
  })

  test('offers.paid.sca_checkout_return_creates_sent_offer', async ({
    browser,
  }, testInfo) => {
    test.skip(!STRIPE_TEST_MODE_ENABLED, 'Requires backend with STRIPE_TEST_MODE=1')
    test.setTimeout(180_000)

    const { pair, chat, cleanup } = await createPaidOfferReadyChatPair(
      browser,
      buildPaidOfferUserKey(testInfo),
      { offersCardNumber: PAID_OFFER_SCA_CARD },
    )
    try {
      await openSendOfferSidesheet(pair)
      await fillPaidOfferDraft(pair)
      await submitPaidOffer(pair)

      await pair.brandPage.waitForURL(/checkout\.stripe\.com/, {
        timeout: 30_000,
      })

      const successReturn = pair.brandPage.waitForURL(
        /send_offer_result=success/,
        { timeout: 120_000 },
      )

      // Stripe test-mode Checkout renders the 3DS challenge in hosted UI/iframes;
      // the helper searches both the top page and Stripe frames for the "Complete"
      // authentication action before waiting for Marz's checkout-return polling.
      await completeStripe3dsAuthentication(pair.brandPage)
      await successReturn

      await pair.brandPage.waitForURL(
        new RegExp(`/workspace/conversations/${pair.conversationId}`),
        { timeout: 30_000 },
      )
      await expect(
        chat.timeline.getByRole('article', { name: /Oferta enviada/i }),
      ).toBeVisible({ timeout: 15_000 })
      await expect(chat.timeline).not.toContainText(/Stripe/i)
      await expect(chat.timeline).not.toContainText(/PaymentIntent/i)
      await expect(chat.timeline).not.toContainText(/\bhold\b/i)
      await expect(chat.timeline).not.toContainText(/\bcapture\b/i)
    } finally {
      await cleanup()
    }
  })

  test('offers.paid.sca_checkout_cancel_keeps_draft', async ({
    browser,
  }, testInfo) => {
    test.skip(!STRIPE_TEST_MODE_ENABLED, 'Requires backend with STRIPE_TEST_MODE=1')
    test.setTimeout(180_000)

    const { pair, chat, cleanup } = await createPaidOfferReadyChatPair(
      browser,
      buildPaidOfferUserKey(testInfo),
      { offersCardNumber: PAID_OFFER_SCA_CARD },
    )
    try {
      await openSendOfferSidesheet(pair)
      await fillPaidOfferDraft(pair)
      await submitPaidOffer(pair)

      await pair.brandPage.waitForURL(/checkout\.stripe\.com/, {
        timeout: 30_000,
      })

      const cancelReturn = pair.brandPage.waitForURL(
        /send_offer_result=cancelled/,
        { timeout: 120_000 },
      )
      await cancelStripeHostedCheckout(pair.brandPage)
      await cancelReturn

      await pair.brandPage.waitForURL(
        new RegExp(`/workspace/conversations/${pair.conversationId}`),
        { timeout: 30_000 },
      )
      await expect(
        chat.timeline.getByRole('article', { name: /Oferta enviada/i }),
      ).toHaveCount(0)

      await openSendOfferSidesheet(pair)
      await expect(pair.brandPage.getByTestId('offers.send.submit_button')).toBeVisible()
    } finally {
      await cleanup()
    }
  })
})
