import { expect, test } from '../fixtures'

test.describe('mark as paid', () => {
  test('brand owner marks a completed deliverable as paid', async ({
    chatPairWithCompletedDeliverable,
  }) => {
    await chatPairWithCompletedDeliverable.brandPage.goto(
      `/workspace/conversations/${chatPairWithCompletedDeliverable.conversationId}`,
    )

    await expect(
      chatPairWithCompletedDeliverable.brandPage.locator(
        '[data-testid="message-timeline"]',
      ),
    ).toBeVisible({ timeout: 10_000 })

    const markAsPaidButton =
      chatPairWithCompletedDeliverable.brandPage.getByRole('button', {
        name: /mark as paid/i,
      })
    await expect(markAsPaidButton).toBeVisible({ timeout: 10_000 })
    await markAsPaidButton.click()

    const sheet = chatPairWithCompletedDeliverable.brandPage.getByRole(
      'dialog',
      {
        name: /mark as paid/i,
      },
    )
    await expect(sheet).toBeVisible()
    await sheet.getByRole('button', { name: /^confirm$/i }).click()

    const confirmDialog = chatPairWithCompletedDeliverable.brandPage.getByRole(
      'dialog',
      {
        name: /confirm payment/i,
      },
    )
    await expect(confirmDialog).toBeVisible()
    await confirmDialog.getByRole('button', { name: /^confirm$/i }).click()

    await expect(
      chatPairWithCompletedDeliverable.brandPage.locator(
        '[data-testid="payment-marked-card"]',
      ),
    ).toBeVisible({ timeout: 10_000 })
  })

  test('programmatic guard rejects non-owner mark as paid invocation', async ({
    chatPairWithCompletedDeliverable,
  }) => {
    const { creatorPage, deliverableId } = chatPairWithCompletedDeliverable

    expect(deliverableId).toBeTruthy()

    const response = await creatorPage.request.post(
      `/v1/deliverables/${deliverableId}/mark-as-paid`,
      {
        data: { amount: '10.00' },
      },
    )

    expect(response.status()).toBe(403)
  })
})
