import { expect, test } from '../../support/fixtures'
import { BriefBuilder } from '../../poms/campaigns/brief-builder.pom'
import { CampaignConfigurationWizard } from '../../poms/campaigns/configuration-wizard.pom'

// E2E: completar el brief builder y aterrizar directo en el wizard de
// configuración sin pasos intermedios. Valida que el handoff se sienta
// como un solo proceso: P4 → /configuration → /configuration/content_type
// con el primer step listo para interactuar.
test('brief → configuración: handoff sin fricción hasta el primer step', async ({
  page,
  onboardedBrandUser,
}) => {
  test.setTimeout(180_000)
  await onboardedBrandUser.signIn(page)

  const brief = new BriefBuilder(page)
  await brief.goto()

  await brief.submitInput(
    'https://marz.com',
    'Marca de bebidas saludables para Gen Z',
  )
  await brief.expectReview(90_000)

  await brief.fillReview({ name: 'Handoff campaign e2e', budget: 5000 })
  await expect(brief.confirmButton).toBeEnabled({ timeout: 5_000 })

  await brief.confirm()
  await brief.expectCampaignCreated(60_000)
  await brief.handoffToConfiguration()

  await expect(page).toHaveURL(
    /\/campaigns\/[0-9a-f-]{36}\/configuration\/(content_type|pricing_model|targeting|bonus|review)/i,
    { timeout: 60_000 },
  )

  const wizard = new CampaignConfigurationWizard(page)

  const influencerPosts = wizard.influencerPostsCard()
  await expect(influencerPosts).toBeVisible({ timeout: 10_000 })
  await expect(influencerPosts).toBeEnabled()

  const ugcVideos = wizard.ugcVideosCard()
  await expect(ugcVideos).toBeVisible()
  await expect(ugcVideos).toBeDisabled()
  await expect(page.getByText(/próximamente/i)).toBeVisible()

  await expect(wizard.continueButton).toBeDisabled()
  await influencerPosts.click()
  await expect(wizard.continueButton).toBeEnabled()
  await wizard.continueButton.click()

  await expect(page).toHaveURL(
    /\/campaigns\/[0-9a-f-]{36}\/configuration\/(pricing_model|targeting|bonus|review)/i,
    { timeout: 15_000 },
  )
})
