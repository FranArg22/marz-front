import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Brand onboarding wizard (`/onboarding/brand`). Steps B1..B14.
 * Methods are step-scoped and assert the step header before acting.
 */
export class BrandOnboardingWizard {
  readonly continueButton: Locator

  constructor(public readonly page: Page) {
    this.continueButton = page.getByRole('button', { name: 'Continuar' })
  }

  async goto(): Promise<void> {
    await this.page.goto('/onboarding/brand')
    await this.expectStep(1)
  }

  async expectStep(n: number): Promise<void> {
    await expect(this.page.getByText(`Paso ${n} de 14`)).toBeVisible()
  }

  async continue(): Promise<void> {
    await this.continueButton.click()
  }

  // B1 — identity
  async fillIdentity(brandName: string, website: string): Promise<void> {
    await this.expectStep(1)
    await this.page.getByLabel('Nombre de la marca').fill(brandName)
    await this.page.getByLabel('Sitio web').fill(website)
  }

  // B2 — vertical
  async pickVertical(name: string): Promise<void> {
    await this.expectStep(2)
    await this.page.getByRole('radio', { name, exact: true }).click()
  }

  // B4 — objective
  async pickObjective(name: RegExp): Promise<void> {
    await this.expectStep(4)
    await this.page.getByRole('radio', { name }).click()
  }

  // B5 — experience + sourcing intent
  async pickExperienceAndSourcing(
    experience: RegExp | string,
    sourcing: RegExp,
  ): Promise<void> {
    await this.expectStep(5)
    await this.page
      .getByRole('radio', typeof experience === 'string'
        ? { name: experience }
        : { name: experience })
      .click()
    await this.page.getByRole('radio', { name: sourcing }).click()
  }

  // B6 — budget slider. nudges: number of ArrowRight presses from idx 0.
  async pickBudget(nudges: number): Promise<void> {
    await this.expectStep(6)
    const slider = this.page.getByRole('slider').first()
    await slider.focus()
    for (let i = 0; i < nudges; i += 1) {
      await this.page.keyboard.press('ArrowRight')
    }
  }

  // B8 — timing
  async pickTiming(name: RegExp | string): Promise<void> {
    await this.expectStep(8)
    await this.page
      .getByRole('radio', typeof name === 'string' ? { name } : { name })
      .click()
  }

  // B9 — contact
  async fillContact(name: string, role: string, whatsapp: string): Promise<void> {
    await this.expectStep(9)
    await this.page.getByLabel('Nombre').fill(name)
    await this.page.getByLabel('Cargo').fill(role)
    await this.page.getByLabel('WhatsApp').fill(whatsapp)
  }

  // B11 — attribution
  async pickAttribution(name: RegExp | string): Promise<void> {
    await this.expectStep(11)
    await this.page
      .getByRole('radio', typeof name === 'string' ? { name } : { name })
      .click()
  }

  // B13 — paywall fallback (no plan)
  async chooseNoPlanFallback(): Promise<void> {
    await this.page
      .getByRole('button', {
        name: /Prefiero seguir sin acceso a la red de creadores/,
      })
      .click()
  }

  // B14 — confirmation
  async confirmAndStart(): Promise<void> {
    const start = this.page.getByTestId('onboarding-start-btn')
    await expect(start).toBeVisible()
    await start.click()
  }
}
