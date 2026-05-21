import { expect, getClerkSessionToken, test } from '../../support/fixtures'
import { ConversationPage } from '../../poms/conversation.pom'
import { PaymentsFlow } from '../../poms/payments.pom'

const API_BASE_URL = (
  process.env.VITE_API_URL ??
  process.env.API_URL ??
  'http://localhost:8080'
).replace(/\/$/, '')

interface AnalyticsEventBody {
  event_name: string
  payload?: unknown
}

function parseAnalyticsEventBody(
  postData: string | null,
): AnalyticsEventBody | null {
  if (!postData) return null

  const parsed = JSON.parse(postData) as unknown
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('event_name' in parsed) ||
    typeof parsed.event_name !== 'string'
  ) {
    return null
  }

  return {
    event_name: parsed.event_name,
    payload: 'payload' in parsed ? parsed.payload : undefined,
  }
}

test.describe('mark as paid', () => {
  test('brand owner marks a completed deliverable as paid', async ({
    chatPairWithCompletedDeliverable,
  }) => {
    const { brandPage, conversationId, deliverableId } =
      chatPairWithCompletedDeliverable
    test.skip(
      !deliverableId,
      'TODO: needs `seed_deliverable_state=completed` from backend harness — chatPairWithCompletedDeliverable no longer seeds the completed state.',
    )

    const chat = new ConversationPage(brandPage)
    await chat.goto(conversationId)

    const flow = new PaymentsFlow(brandPage)
    await expect(flow.markAsPaidButton).toBeVisible({ timeout: 10_000 })
    await flow.markAsPaid()
    await flow.expectMarkedCardVisible()
  })

  test('programmatic guard rejects non-owner mark as paid invocation', async ({
    chatPairWithCompletedDeliverable,
  }) => {
    const { creatorPage, deliverableId } = chatPairWithCompletedDeliverable
    test.skip(
      !deliverableId,
      'TODO: needs `seed_deliverable_state=completed` from backend harness.',
    )

    const token = await getClerkSessionToken(creatorPage)
    const response = await creatorPage.request.post(
      `${API_BASE_URL}/v1/deliverables/${deliverableId}/mark-as-paid`,
      {
        data: { amount: '10.00' },
        headers: { Authorization: `Bearer ${token}` },
      },
    )

    expect(response.status()).toBe(403)
  })

  test('creator sees payment card analytics once across viewport re-entry', async ({
    chatPairWithCompletedDeliverableScrollable,
  }) => {
    const { brandPage, creatorPage, conversationId, deliverableId } =
      chatPairWithCompletedDeliverableScrollable
    test.skip(
      !deliverableId,
      'TODO: needs `seed_deliverable_state=completed` from backend harness.',
    )

    const brandChat = new ConversationPage(brandPage)
    await brandChat.goto(conversationId)
    const brandFlow = new PaymentsFlow(brandPage)
    await brandFlow.markAsPaid()
    await brandFlow.expectMarkedCardVisible()

    const analyticsEvents: AnalyticsEventBody[] = []
    await creatorPage.route('**/analytics/events', async (route) => {
      if (route.request().method() === 'POST') {
        const body = parseAnalyticsEventBody(route.request().postData())
        if (body) analyticsEvents.push(body)
      }

      await route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: '{}',
      })
    })

    const creatorChat = new ConversationPage(creatorPage)
    await creatorChat.goto(conversationId)
    const creatorFlow = new PaymentsFlow(creatorPage)
    await creatorFlow.expectMarkedCardVisible()

    await expect
      .poll(
        () =>
          analyticsEvents.filter(
            (event) => event.event_name === 'payment_card_seen',
          ).length,
      )
      .toBe(1)

    await expect
      .poll(() => {
        const event = analyticsEvents.find(
          (item) => item.event_name === 'payment_card_seen',
        )
        if (
          typeof event?.payload !== 'object' ||
          event.payload === null ||
          !('declared_payment_id' in event.payload)
        ) {
          return false
        }
        return typeof event.payload.declared_payment_id === 'string'
      })
      .toBe(true)

    await creatorChat.timeline.hover()
    await creatorPage.mouse.wheel(0, -3000)
    await expect(creatorFlow.paymentMarkedCard).not.toBeInViewport()
    await creatorPage.mouse.wheel(0, 3000)
    await expect(creatorFlow.paymentMarkedCard).toBeInViewport()

    await expect
      .poll(
        () =>
          analyticsEvents.filter(
            (event) => event.event_name === 'payment_card_seen',
          ).length,
        { timeout: 1_000 },
      )
      .toBe(1)
  })
})
