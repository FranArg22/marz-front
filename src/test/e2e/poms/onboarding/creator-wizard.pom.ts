import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Creator onboarding wizard (`/onboarding/creator/*`).
 * Step-specific routes: `/birthday`, `/channels`, etc.
 */
export class CreatorOnboardingWizard {
  readonly continueButton: Locator

  constructor(public readonly page: Page) {
    this.continueButton = page.getByRole('button', { name: /Continuar/i })
  }

  async goto(): Promise<void> {
    await this.page.goto('/onboarding/creator')
  }

  async gotoBirthday(): Promise<void> {
    await this.page.goto('/onboarding/creator/birthday')
    await expect(
      this.page.getByRole('heading', { name: /¿Cuándo es tu cumpleaños\?/i }),
    ).toBeVisible()
  }

  async gotoChannels(): Promise<void> {
    await this.page.goto('/onboarding/creator/channels')
    await expect(
      this.page.getByRole('button', { name: /Agregar canal/i }),
    ).toBeVisible()
  }

  // --- Birthday step (Radix Select) ---

  birthdayTrigger(label: RegExp): Locator {
    return this.page.getByLabel(label)
  }

  async pickBirthdayOption(
    label: RegExp,
    optionName: string,
  ): Promise<void> {
    await this.page.getByRole('combobox', { name: label }).click()
    await this.page
      .getByRole('option', { name: optionName, exact: true })
      .click()
  }

  async fillBirthday(
    day: string,
    month: string,
    year: string | number,
  ): Promise<void> {
    await this.pickBirthdayOption(/Día/i, day)
    await this.pickBirthdayOption(/Mes/i, month)
    await this.pickBirthdayOption(/Año/i, String(year))
  }

  // --- Channels step ---

  private readonly platformHeaderPattern = /Instagram|TikTok|YouTube/

  channelHeaders(): Locator {
    return this.page
      .getByRole('button')
      .filter({ hasText: this.platformHeaderPattern })
  }

  addChannelButton(): Locator {
    return this.page.getByRole('button', { name: /Agregar canal/i })
  }

  async addChannel(): Promise<void> {
    const headers = this.channelHeaders()
    const before = await headers.count()
    await this.addChannelButton().click()
    await expect(headers).toHaveCount(before + 1)
  }

  async expandChannel(name: RegExp): Promise<void> {
    const header = this.page.getByRole('button', { name }).first()
    if ((await header.getAttribute('aria-expanded')) !== 'true') {
      await header.click()
    }
    await expect(header).toHaveAttribute('aria-expanded', 'true')
  }

  firstHandleInput(): Locator {
    return this.page.getByPlaceholder('tu_handle')
  }

  firstAmountInput(): Locator {
    return this.page.getByPlaceholder('0.00')
  }

  async scrollChannelsToTop(): Promise<void> {
    await this.page.evaluate(() => {
      const main = document.querySelector('main')
      if (main) main.scrollTop = 0
    })
  }

  // --- Kind selector (auth/kind) ---

  async gotoKindSelector(): Promise<void> {
    await this.page.goto('/auth/kind')
    await expect(
      this.page.getByRole('heading', { name: /Qué te trae por acá/i }),
    ).toBeVisible()
  }
}
