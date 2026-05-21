import { test } from '../../support/fixtures'
import { BriefBuilder } from '../../poms/campaigns/brief-builder.pom'

// E2E: F5 recovery on P3. After processing finishes, reload must call GET
// /processing/{token}, see status=completed|partial and jump straight to P3
// without re-dispatching POST /process (which would 409).
test('F5 after processing completes hydrates draft and lands on P3', async ({
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

  await page.reload()
  await brief.expectReview(30_000)
})
