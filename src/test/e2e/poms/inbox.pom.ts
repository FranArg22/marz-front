import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Inbox page: `/inbox`. Two sections (action / waiting). Items are grouped into
 * one box per creator (counterpart) within each section. The count badge shows
 * the number of underlying items; each `listitem` is a creator box.
 */
export class InboxPage {
  readonly actionSection: Locator
  readonly waitingSection: Locator
  readonly emptySection: Locator

  constructor(public readonly page: Page) {
    this.actionSection = page.locator('section[aria-labelledby="action-title"]')
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

  /** Item count shown in the section badge (not the number of boxes). */
  async expectActionBadge(count: number): Promise<void> {
    await expect(this.actionSection.locator('h2 + span')).toHaveText(
      String(count),
    )
  }

  async expectWaitingBadge(count: number): Promise<void> {
    await expect(this.waitingSection.locator('h2 + span')).toHaveText(
      String(count),
    )
  }

  /** Number of creator boxes (grouped) in the action section. */
  async expectActionBoxes(count: number): Promise<void> {
    await expect(this.actionSection.getByRole('listitem')).toHaveCount(count)
  }

  async expectWaitingBoxes(count: number): Promise<void> {
    await expect(this.waitingSection.getByRole('listitem')).toHaveCount(count)
  }

  async expectEmpty(): Promise<void> {
    await expect(this.emptySection).toBeVisible()
    await expect(this.actionSection).toHaveCount(0)
    await expect(this.waitingSection).toHaveCount(0)
  }

  markBoxReadButton(section: Locator): Locator {
    return section.getByRole('button', { name: /^marcar caja como leída$/i })
  }

  async markFirstActionBoxRead(): Promise<void> {
    await this.markBoxReadButton(this.actionSection).first().click()
  }
}
