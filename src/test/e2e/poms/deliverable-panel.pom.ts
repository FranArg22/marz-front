import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Right-side deliverable panel inside a conversation: shows drafts, links,
 * stages and the actions to submit / approve / request changes.
 */
export class DeliverablePanel {
  readonly root: Locator

  constructor(public readonly page: Page) {
    this.root = page.locator('[data-testid="deliverable-list-panel"]')
  }

  get draftRows(): Locator {
    return this.root.locator('[data-testid="draft-version-row"]')
  }

  submitLinkButton(): Locator {
    return this.page.getByRole('button', { name: /^submit link$/i })
  }

  approveLinkButton(): Locator {
    return this.page.getByRole('button', { name: /approve link/i })
  }

  approveDraftButton(): Locator {
    return this.page.getByRole('button', { name: /aprobar video borrador/i })
  }

  requestChangesButton(): Locator {
    return this.page.getByRole('button', { name: /request changes/i })
  }

  async expectVisible(timeoutMs = 5_000): Promise<void> {
    await expect(this.root).toBeVisible({ timeout: timeoutMs })
  }

  async expectContains(
    text: string | RegExp,
    timeoutMs = 2_000,
  ): Promise<void> {
    await expect(this.root.getByText(text)).toBeVisible({ timeout: timeoutMs })
  }

  async submitLink(url: string): Promise<void> {
    await this.submitLinkButton().click()
    const sheet = this.page.getByRole('dialog', { name: /submit link/i })
    await sheet.getByLabel(/published url/i).fill(url)
    await sheet.getByRole('button', { name: /send link/i }).click()
    await expect(sheet).not.toBeVisible({ timeout: 15_000 })
  }
}
