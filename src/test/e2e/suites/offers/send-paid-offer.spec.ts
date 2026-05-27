import { randomUUID } from 'node:crypto'

import { expect, getClerkSessionToken, test } from '../../support/fixtures'
import {
  createDraftStatusSentFault,
  createHoldDeclinedFault,
  createPaidOfferViaApi,
  createRequiresActionFault,
  dateDaysFromNow,
  fillPaidOfferDraft,
  openSendOfferSidesheet,
  PAID_OFFER_BASE_AMOUNT,
  PAID_OFFER_EXPECTED_BASE_AMOUNT,
  PAID_OFFER_EXPECTED_BONUS_AMOUNT,
  setupPaidBrand,
  STRIPE_TEST_MODE_ENABLED,
  submitPaidOffer,
} from '../../support/paid-offers'

const STRIPE_CHECKOUT_URL =
  'https://checkout.stripe.com/c/pay/cs_test_e2e_paid_offer_requires_action'

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

  test('offers.paid.send_requires_action_checkout_completes_offer', async ({
    chatPairOfferReady,
  }) => {
    test.skip(!STRIPE_TEST_MODE_ENABLED, 'Requires backend with STRIPE_TEST_MODE=1')
    test.setTimeout(180_000)

    const offerDraftId = randomUUID()
    const chat = await setupPaidBrand(chatPairOfferReady)
    await openSendOfferSidesheet(chatPairOfferReady)
    await fillPaidOfferDraft(chatPairOfferReady)
    const brandToken = await getClerkSessionToken(chatPairOfferReady.brandPage)
    await createRequiresActionFault({
      offerDraftId,
      checkoutUrl: STRIPE_CHECKOUT_URL,
    })
    await submitPaidOffer(chatPairOfferReady)

    await chatPairOfferReady.brandPage.waitForURL(/checkout\.stripe\.com/, {
      timeout: 30_000,
    })

    await createPaidOfferViaApi(chatPairOfferReady, offerDraftId, brandToken)
    await createDraftStatusSentFault(offerDraftId)
    await chatPairOfferReady.brandPage.goto(
      `/_brand/checkout-return?offer_draft_id=${offerDraftId}` +
        `&return_to_kind=conversation&return_to_id=${chatPairOfferReady.conversationId}` +
        '&checkout=success',
    )

    await chatPairOfferReady.brandPage.waitForURL(
      new RegExp(`/workspace/conversations/${chatPairOfferReady.conversationId}`),
      { timeout: 30_000 },
    )
    await expect(
      chat.timeline.getByRole('article', { name: /Oferta enviada/i }),
    ).toBeVisible({ timeout: 15_000 })
    await expect(chat.timeline).not.toContainText(/Stripe/i)
    await expect(chat.timeline).not.toContainText(/PaymentIntent/i)
  })

  test('offers.paid.send_checkout_cancel_keeps_draft_without_offer', async ({
    chatPairOfferReady,
  }) => {
    test.skip(!STRIPE_TEST_MODE_ENABLED, 'Requires backend with STRIPE_TEST_MODE=1')
    test.setTimeout(180_000)

    const offerDraftId = randomUUID()
    const chat = await setupPaidBrand(chatPairOfferReady)
    await openSendOfferSidesheet(chatPairOfferReady)
    await fillPaidOfferDraft(chatPairOfferReady)
    await createRequiresActionFault({
      offerDraftId,
      checkoutUrl: STRIPE_CHECKOUT_URL,
    })
    await submitPaidOffer(chatPairOfferReady)

    await chatPairOfferReady.brandPage.waitForURL(/checkout\.stripe\.com/, {
      timeout: 30_000,
    })
    await chatPairOfferReady.brandPage.goto(
      `/_brand/checkout-return?offer_draft_id=${offerDraftId}` +
        `&return_to_kind=conversation&return_to_id=${chatPairOfferReady.conversationId}` +
        '&checkout=cancel',
    )

    await chatPairOfferReady.brandPage.waitForURL(
      new RegExp(`/workspace/conversations/${chatPairOfferReady.conversationId}`),
      { timeout: 30_000 },
    )
    await expect(
      chat.timeline.getByRole('article', { name: /Oferta enviada/i }),
    ).toHaveCount(0)
  })
})
