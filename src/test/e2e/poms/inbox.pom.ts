import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Inbox page: `/inbox`. Two sections (action / waiting), counters, and per-row
 * actions like "mark as read".
 */
export class InboxPage {
  readonly actionSection: Locator
  readonly waitingSection: Locator
  readonly emptySection: Locator

  constructor(public readonly page: Page) {
    this.actionSection = page.locator(
      'section[aria-labelledby="action-title"]',
    )
    this.waitingSection = page.locator(
      'section[aria-labelledby="waiting-title"]',
    )
    this.emptySection = page.locator(
      'section[aria-labelledby="inbox-empty-title"]',
    )
  }

  async goto(): Promise<void> {
    await this.page.goto('/inbox')
    await expect(this.page).toHaveURL(/\/inbox/)
  }

  async expectActionCount(count: number): Promise<void> {
    await expect(this.actionSection.locator('h2 + span')).toHaveText(
      String(count),
    )
    await expect(this.actionSection.getByRole('listitem')).toHaveCount(count)
  }

  async expectWaitingCount(count: number): Promise<void> {
    await expect(this.waitingSection.locator('h2 + span')).toHaveText(
      String(count),
    )
    await expect(this.waitingSection.getByRole('listitem')).toHaveCount(count)
  }

  async expectEmpty(): Promise<void> {
    await expect(this.emptySection).toBeVisible()
    await expect(this.actionSection).toHaveCount(0)
    await expect(this.waitingSection).toHaveCount(0)
  }

  async markFirstActionItemRead(): Promise<void> {
    await this.actionSection
      .getByRole('button', { name: /^marcar como leído$/i })
      .click()
  }
}
