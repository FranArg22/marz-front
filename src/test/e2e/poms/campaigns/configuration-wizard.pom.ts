import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Campaign configuration wizard (`/campaigns/:id/configuration/:step`).
 * Steps: content_type → pricing_model → targeting → bonus → review.
 */
export class CampaignConfigurationWizard {
  readonly continueButton: Locator
  readonly activateButton: Locator

  constructor(public readonly page: Page) {
    this.continueButton = this.page.getByRole('button', { name: /continuar/i })
    this.activateButton = this.page.getByRole('button', {
      name: 'Activar campaña',
    })
  }

  async resumeFromList(): Promise<void> {
    await this.page.getByText('Retomar configuración').click()
  }

  async expectStepURL(
    campaignId: string,
    step: 'content_type' | 'pricing_model' | 'targeting' | 'bonus' | 'review',
  ): Promise<void> {
    await expect(this.page).toHaveURL(
      new RegExp(`/campaigns/${campaignId}/configuration/${step}(?:\\?.*)?$`),
    )
  }

  // Content type
  influencerPostsCard(): Locator {
    return this.page.getByRole('button', { name: /influencer posts/i })
  }

  ugcVideosCard(): Locator {
    return this.page.getByRole('button', { name: /ugc videos/i })
  }

  async selectContentType(option: 'influencer_posts' | 'ugc_videos'): Promise<void> {
    const button =
      option === 'influencer_posts'
        ? this.influencerPostsCard()
        : this.ugcVideosCard()
    await button.click()
  }

  // Pricing
  async selectPricing(option: 'per_views' | 'fixed_per_video'): Promise<void> {
    const name = option === 'per_views' ? /per views/i : /fixed per video/i
    await this.page.getByRole('button', { name }).click()
  }

  // Targeting
  targetingCountryButton(name: string): Locator {
    return this.page.getByRole('button', { name })
  }

  targetingTierButton(name: string): Locator {
    return this.page.getByRole('button', { name })
  }

  async fillMinFollowers(value: string | number): Promise<void> {
    await this.page.getByLabel('Seguidores mínimos').fill(String(value))
  }

  // Bonus
  async enableBonus(): Promise<void> {
    await this.page
      .getByRole('switch', { name: 'Activar bonus de pago' })
      .click()
    await this.page.getByRole('button', { name: /speed bonus/i }).click()
    await this.page.getByRole('button', { name: /performance bonus/i }).click()
  }

  async addSpeedWindow(params: {
    index: number
    hours: string | number
    percentage?: string | number
    fixedUsd?: string
  }): Promise<void> {
    await this.page.getByRole('button', { name: 'Agregar ventana' }).click()
    await this.page
      .getByLabel(`Horas ventana ${params.index}`)
      .fill(String(params.hours))
    if (params.percentage !== undefined) {
      await this.page
        .getByLabel(`Porcentaje de Speed ${params.index}`)
        .fill(String(params.percentage))
    }
    if (params.fixedUsd !== undefined) {
      await this.page
        .getByRole('group', { name: `Tipo de bonus para Speed ${params.index}` })
        .getByRole('radio', { name: 'Monto fijo en USD' })
        .click()
      await this.page
        .getByLabel(`Monto de Speed ${params.index} en USD`)
        .fill(params.fixedUsd)
    }
  }

  async addPerformanceMilestone(params: {
    index: number
    views: string | number
    hours: string | number
    percentage?: string | number
    fixedUsd?: string
  }): Promise<void> {
    await this.page.getByRole('button', { name: 'Agregar milestone' }).click()
    await this.page
      .getByLabel(`Views milestone ${params.index}`)
      .fill(String(params.views))
    await this.page
      .getByLabel(`Horas milestone ${params.index}`)
      .fill(String(params.hours))
    if (params.percentage !== undefined) {
      await this.page
        .getByLabel(`Porcentaje de Milestone ${params.index}`)
        .fill(String(params.percentage))
    }
    if (params.fixedUsd !== undefined) {
      await this.page
        .getByRole('group', {
          name: `Tipo de bonus para Milestone ${params.index}`,
        })
        .getByRole('radio', { name: 'Monto fijo en USD' })
        .click()
      await this.page
        .getByLabel(`Monto de Milestone ${params.index} en USD`)
        .fill(params.fixedUsd)
    }
  }
}
