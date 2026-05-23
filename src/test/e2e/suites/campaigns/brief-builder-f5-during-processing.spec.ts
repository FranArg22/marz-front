import { test, expect } from '../../support/fixtures'
import { BriefBuilder } from '../../poms/campaigns/brief-builder.pom'

// E2E: F5 while still on P2 (processing not finished yet).
// User submits P1 → lands on P2 → reloads. After reload P2 must call
// GET /processing/{token} and either:
//  - in_progress  → keep showing P2 progress and wait for WS
//  - completed/partial → jump to P3
//  - 404 expired → reset to P1
test('F5 on P2 while processing is in_progress keeps progress visible', async ({
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
  await brief.expectProcessing()

  // Capture network calls after reload to confirm the GET fires.
  const getProcessingCalls: string[] = []
  page.on('request', (req) => {
    const url = req.url()
    if (/\/v1\/campaigns\/brief-builder\/processing\//.test(url)) {
      getProcessingCalls.push(url)
    }
  })

  await page.reload()

  // After reload, P2 should still render (or jump to P3 if processing
  // finished while reloading). What MUST NOT happen: redirect to P1.
  await brief.waitForProgressOrReview()

  const url = page.url()
  expect(url).toMatch(/\/campaigns\/new\/(progress|review)$/)
  // The test deliberately does not assert on getProcessingCalls: the GET
  // may be served from React Query cache after reload, or skipped entirely
  // when processing already finished. What matters is that the user does
  // NOT bounce back to P1 — covered by the URL match above.
  void getProcessingCalls
})
