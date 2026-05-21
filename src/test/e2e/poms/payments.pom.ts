import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Brand payments list (`/payments`) + mark-as-paid flow on the conversation
 * page. The flow:
 *   1. Click "Mark as paid" on the deliverable card.
 *   2. Sheet opens → confirm.
 *   3. Confirmation dialog → confirm.
 *   4. Card shows `[data-testid="payment-marked-card"]`.
 */
export class PaymentsFlow {
  readonly markAsPaidButton: Locator
  readonly paymentMarkedCard: Locator
  readonly highlightedCard: Locator

  constructor(public readonly page: Page) {
    this.markAsPaidButton = page.getByRole('button', { name: /mark as paid/i })
    this.paymentMarkedCard = page.locator('[data-testid="payment-marked-card"]')
    this.highlightedCard = page.locator('[data-highlighted="true"]')
  }

  async markAsPaid(): Promise<void> {
    await this.markAsPaidButton.click()
    await this.page
      .getByRole('dialog', { name: /mark as paid/i })
      .getByRole('button', { name: /^confirm$/i })
      .click()
    await this.page
      .getByRole('dialog', { name: /confirm payment/i })
      .getByRole('button', { name: /^confirm$/i })
      .click()
  }

  async expectMarkedCardVisible(timeoutMs = 10_000): Promise<void> {
    await expect(this.paymentMarkedCard).toBeVisible({ timeout: timeoutMs })
  }
}

export class PaymentsPage {
  constructor(public readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/payments')
  }

  row(name: RegExp | string): Locator {
    return this.page.getByRole('row', { name })
  }
}
