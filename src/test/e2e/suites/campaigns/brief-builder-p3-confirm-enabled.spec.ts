import { test, expect } from '../../support/fixtures'
import { BriefBuilder } from '../../poms/campaigns/brief-builder.pom'

// E2E: in P3 (Review), filling the three required campaign fields
// (name, objective, budget) must enable the "Confirmar" button.
test('P3: Confirmar becomes enabled and clickable after required fields are filled', async ({
  page,
  onboardedBrandUser,
}) => {
  test.setTimeout(120_000)
  await onboardedBrandUser.signIn(page)
  const brief = new BriefBuilder(page)
  await brief.goto()

  await brief.submitInput(
    'https://marz.com',
    'Marca de bebidas saludables para Gen Z',
  )
  await brief.expectReview(90_000)

  await expect(brief.confirmButton).toBeDisabled()
  await brief.fillReview({ name: 'Campaña test e2e', budget: 5000 })
  await expect(brief.confirmButton).toBeEnabled({ timeout: 5_000 })

  // Capture the POST /v1/campaigns request fired automatically when P4 mounts.
  const createReq = page.waitForRequest(
    (req) => req.method() === 'POST' && /\/v1\/campaigns(\?|$)/.test(req.url()),
    { timeout: 15_000 },
  )
  const createRes = page.waitForResponse(
    (res) =>
      res.request().method() === 'POST' &&
      /\/v1\/campaigns(\?|$)/.test(res.url()),
    { timeout: 30_000 },
  )

  await brief.confirm()

  await expect(page).toHaveURL(/\/campaigns\/new\/confirm/i, {
    timeout: 10_000,
  })

  const req = await createReq
  expect(req.postDataJSON()).toMatchObject({
    name: 'Campaña test e2e',
    objective: 'brand_awareness',
  })

  const res = await createRes

  if (res.ok()) {
    await brief.expectCampaignCreated(15_000)
    await brief.handoffToConfiguration()
    await expect(page).toHaveURL(/\/campaigns\/[^/]+\/configuration/i, {
      timeout: 15_000,
    })
  } else {
    await brief.expectCreationError()
  }
})
