import { test, expect } from '../../support/fixtures'
import { BriefBuilder } from '../../poms/campaigns/brief-builder.pom'

// E2E: when the AI provider fails, backend emits
// brief.processing.completed with status="partial" and an empty brief.
// P2 must navigate to P3 with that empty draft so the user can fill it manually.
test('P2 advances to P3 when backend emits partial with empty brief', async ({
  page,
  onboardedBrandUser,
}) => {
  test.setTimeout(120_000)
  await onboardedBrandUser.signIn(page)

  const completedFrames: Array<{
    status?: string
    fields_filled_count?: number
  }> = []

  page.on('websocket', (ws) => {
    ws.on('framereceived', (frame) => {
      try {
        const parsed = JSON.parse(frame.payload as string) as {
          event_type?: string
          payload?: { status?: string; fields_filled_count?: number }
        }
        if (parsed.event_type === 'campaigns.brief.processing.completed') {
          completedFrames.push({
            status: parsed.payload?.status,
            fields_filled_count: parsed.payload?.fields_filled_count,
          })
        }
      } catch {
        /* non-JSON */
      }
    })
  })

  const brief = new BriefBuilder(page)
  await brief.goto()
  await brief.submitInput(
    'https://marz.com',
    'Marca de bebidas saludables para Gen Z',
  )
  await brief.expectProcessing()

  await expect
    .poll(() => completedFrames.length, { timeout: 90_000 })
    .toBeGreaterThan(0)

  await brief.expectReview(15_000)
})
