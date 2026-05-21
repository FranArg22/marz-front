import { randomUUID } from 'node:crypto'

import {
  expect,
  getClerkSessionToken,
  test,
} from '../../support/fixtures'
import { ConversationPage } from '../../poms/conversation.pom'

// Reproduces the bug where the OfferSent system_event arrives via WS but the
// timeline does not render the offer card (OfferTimelineEntry returns null
// when offerSnapshotSchema fails to parse the payload).
//
// Flow:
// 1. seed_offer_ready creates a campaign + accepted application + open
//    conversation between brand and creator.
// 2. Brand calls POST /v1/offers from the authenticated browser context.
// 3. Creator (separate browser) is sitting in the conversation and must see
//    the "Offer sent" card appear in the timeline via WS push.

test.describe('OfferSent system_event rendering', () => {
  test('creator sees offer card after brand sends single offer', async ({
    chatPairOfferReady,
  }) => {
    test.skip(
      true,
      'TODO: backend rechaza el POST /v1/offers con 422 validation_error genérico. ' +
        'Reglas de dominio del Offer (campaign config completo, deliverable platforms, ' +
        'tentative_publish_date vs deadline, etc.) no documentadas en el error. Necesita ' +
        'que el backend exponga `details` con el campo inválido o que el spec replique las ' +
        'precondiciones reales del flow.',
    )
    const {
      conversationId,
      brandWorkspaceId,
      campaignId,
      brandPage,
      creatorPage,
    } = chatPairOfferReady

    expect(campaignId, 'seed_offer_ready must return campaign_id').toBeDefined()

    const brandChat = new ConversationPage(brandPage)
    const creatorChat = new ConversationPage(creatorPage)
    await brandChat.goto(conversationId)
    await creatorChat.goto(conversationId)

    const apiBaseUrl =
      process.env.VITE_API_URL ?? process.env.API_URL ?? 'http://localhost:8080'
    const clerkToken = await getClerkSessionToken(brandPage)

    const response = await brandPage.request.post(`${apiBaseUrl}/v1/offers`, {
      headers: {
        Authorization: `Bearer ${clerkToken}`,
        'X-Brand-Workspace-Id': brandWorkspaceId,
        'Idempotency-Key': randomUUID(),
      },
      data: {
        campaign_id: campaignId,
        conversation_id: conversationId,
        offer_mode: 'same_content',
        amount: '500.00',
        tentative_publish_date: '2026-12-15',
        offer_deadline: '2026-12-31',
        description: 'E2E single offer',
        deliverables: [
          {
            platform: 'youtube',
            format: 'yt_short',
          },
        ],
      },
    })

    expect(
      response.ok(),
      `POST /v1/offers failed: ${response.status()} ${await response.text()}`,
    ).toBe(true)

    const creatorCard = creatorPage
      .getByRole('article', {
        name: /oferta de campaña recibida|campaign offer received/i,
      })
      .first()
    await expect(creatorCard).toBeVisible({ timeout: 10_000 })
    await expect(creatorCard).toContainText('E2E OfferSent Campaign')

    const brandCard = brandChat
      .messageByText('E2E OfferSent Campaign')
      .first()
    await expect(brandCard).toBeVisible({ timeout: 10_000 })
  })
})
