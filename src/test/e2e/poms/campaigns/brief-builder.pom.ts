import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Brand brief builder wizard (`/campaigns/new`). 4 phases:
 *   P1: URL + description input.
 *   P2: processing (waits for backend WS).
 *   P3: review brief (campaign name/objective/budget).
 *   P4: confirmation + handoff to campaign configuration.
 */
export class BriefBuilder {
  readonly analyzeButton: Locator
  readonly confirmButton: Locator
  readonly continueButton: Locator
  readonly configureCampaignButton: Locator

  constructor(public readonly page: Page) {
    this.analyzeButton = page.getByRole('button', { name: /analizar/i })
    this.confirmButton = page.getByRole('button', { name: /^confirmar/i })
    this.continueButton = page.getByRole('button', { name: /continuar/i })
    this.configureCampaignButton = page.getByRole('button', {
      name: /configurar campaña/i,
    })
  }

  async goto(): Promise<void> {
    await this.page.goto('/campaigns/new')
  }

  // P1
  async submitInput(url: string, description: string): Promise<void> {
    await this.page.getByLabel(/url de la campaña/i).fill(url)
    await this.page.getByLabel(/descripci/i).fill(description)
    await this.analyzeButton.click()
  }

  async expectProcessing(timeoutMs = 15_000): Promise<void> {
    await expect(this.page.getByText(/generando tu brief/i)).toBeVisible({
      timeout: timeoutMs,
    })
  }

  async expectReview(timeoutMs = 90_000): Promise<void> {
    await expect(this.page.getByText(/revisá tu brief/i)).toBeVisible({
      timeout: timeoutMs,
    })
  }

  // After reload P2/P3 should keep state, not bounce to P1.
  async waitForProgressOrReview(timeoutMs = 30_000): Promise<void> {
    await Promise.race([
      this.page
        .getByText(/generando tu brief/i)
        .waitFor({ state: 'visible', timeout: timeoutMs }),
      this.page
        .getByText(/revisá tu brief/i)
        .waitFor({ state: 'visible', timeout: timeoutMs }),
    ])
  }

  // P3 — fill required fields to enable Confirmar.
  async fillReview(params: {
    name: string
    budget: string | number
  }): Promise<void> {
    await this.page
      .getByLabel(/^nombre/i)
      .first()
      .fill(params.name)
    await this.page.getByRole('combobox').first().click()
    await this.page.getByRole('option').first().click()
    await this.page.getByLabel(/presupuesto/i).fill(String(params.budget))
  }

  async confirm(): Promise<void> {
    await this.confirmButton.click()
  }

  // P4
  async expectCampaignCreated(timeoutMs = 60_000): Promise<void> {
    await expect(this.page.getByText(/campaña creada/i)).toBeVisible({
      timeout: timeoutMs,
    })
  }

  async expectCreationError(timeoutMs = 10_000): Promise<void> {
    await expect(this.page.getByText(/error al crear la campaña/i)).toBeVisible({
      timeout: timeoutMs,
    })
  }

  async handoffToConfiguration(): Promise<void> {
    await this.configureCampaignButton.click()
  }
}
