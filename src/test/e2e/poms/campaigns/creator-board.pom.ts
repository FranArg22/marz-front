import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Creator-side campaign discovery board (`/discover/campaigns`).
 * Filters, sort, brief modal, apply dialog.
 */
export class CreatorCampaignBoard {
  readonly heading: Locator

  constructor(public readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Campañas activas' })
  }

  campaignCard(name: string): Locator {
    return this.page.getByRole('article', { name })
  }

  async openCategoryFilter(label: string): Promise<void> {
    await this.page.getByRole('button', { name: 'Categoría' }).click()
    await this.page.locator('label').filter({ hasText: label }).click()
  }

  async openInterestFilter(label: string): Promise<void> {
    await this.page.getByRole('button', { name: 'Intereses' }).click()
    await this.page.locator('label').filter({ hasText: label }).click()
  }

  async sortBy(optionName: string): Promise<void> {
    await this.page
      .getByRole('combobox', { name: 'Ordenar campañas' })
      .click()
    await this.page.getByRole('option', { name: optionName }).click()
  }

  async openBrief(card: Locator): Promise<void> {
    await card.getByRole('button', { name: 'Ver brief' }).click()
    await expect(this.page.getByRole('dialog')).toBeVisible()
  }

  async closeBrief(): Promise<void> {
    await this.page.keyboard.press('Escape')
    await expect(this.page.getByRole('dialog')).toBeHidden()
  }

  async apply(card: Locator, message: string): Promise<void> {
    await card.getByRole('button', { name: 'Postularme' }).click()
    const dialog = this.page.getByRole('dialog', { name: 'Postularme' })
    await expect(dialog).toBeVisible()
    await this.page.getByLabel('Mensaje').fill(message)
    await this.page
      .getByRole('button', { name: 'Enviar postulación' })
      .click()
    await expect(dialog).toBeHidden()
  }

  async expectAppliedBadge(card: Locator): Promise<void> {
    await expect(card.getByText('Postulación enviada')).toBeVisible()
  }
}
