import { randomUUID } from 'node:crypto'

import { createTestFault } from '#/shared/api/test-generated/test/test'

import { BrandOnboardingWizard } from '../poms/onboarding/brand-wizard.pom'
import { ConversationPage } from '../poms/conversation.pom'
import { expect, getClerkSessionToken } from './fixtures'
import type { ChatPair } from './fixtures'
import { API_BASE_URL } from './env'

export const STRIPE_TEST_MODE_ENABLED = process.env.STRIPE_TEST_MODE === '1'

export const PAID_OFFER_BASE_AMOUNT = '500'
export const PAID_OFFER_EXPECTED_BASE_AMOUNT = '$500.00 USD (base)'
export const PAID_OFFER_EXPECTED_BONUS_AMOUNT = '$50.00 USD (bonus)'

const PAID_OFFER_CAMPAIGN_NAME = 'E2E OfferSent Campaign'

export function dateDaysFromNow(days: number): string {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export async function completeStarterCheckout(pair: ChatPair): Promise<void> {
  const { brandPage } = pair
  const wizard = new BrandOnboardingWizard(brandPage)

  await brandPage.goto('/onboarding/brand/paywall')
  await wizard.expectStep(13)

  await brandPage.getByRole('tab', { name: 'Mensual' }).click()
  await brandPage.getByRole('radio', { name: /starter/i }).click()

  const continueButton = brandPage.getByRole('button', {
    name: /Continuar con plan pago/,
  })
  await expect(continueButton).toBeEnabled()

  await Promise.all([
    brandPage.waitForURL(/checkout\.stripe\.com/, { timeout: 30_000 }),
    continueButton.click(),
  ])

  await brandPage
    .getByLabel(/Card number|Numero de tarjeta|Número de tarjeta/i)
    .fill('4242 4242 4242 4242')
  await brandPage
    .getByLabel(/Expiration|Vencimiento|MM \/ AA/i)
    .fill('12 / 34')
  await brandPage.getByLabel(/CVC|CVV/i).fill('123')
  await brandPage
    .getByLabel(/Cardholder name|Nombre del titular/i)
    .fill('E2E Paid Offer Brand')

  await brandPage
    .getByRole('button', { name: /Subscribe|Pay|Suscribirse|Pagar/i })
    .click()

  await brandPage.waitForURL(/\/onboarding\/brand\/confirmation/, {
    timeout: 60_000,
  })
}

export async function expectOffersPaymentMethod(
  pair: ChatPair,
): Promise<void> {
  const token = await getClerkSessionToken(pair.brandPage)
  const response = await pair.brandPage.request.get(
    `${API_BASE_URL}/v1/billing/subscription`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Brand-Workspace-Id': pair.brandWorkspaceId,
      },
    },
  )

  expect(
    response.ok(),
    `GET /v1/billing/subscription failed: ${response.status()} ${await response.text()}`,
  ).toBe(true)

  const body = (await response.json()) as {
    offers_payment_method?: unknown
    same_payment_method?: boolean
  }

  expect(
    body.offers_payment_method != null || body.same_payment_method === true,
  ).toBe(true)
}

export async function setupPaidBrand(
  pair: ChatPair,
): Promise<ConversationPage> {
  await completeStarterCheckout(pair)
  await expectOffersPaymentMethod(pair)

  const chat = new ConversationPage(pair.brandPage)
  await chat.goto(pair.conversationId)
  return chat
}

export async function openSendOfferSidesheet(
  pair: ChatPair,
): Promise<void> {
  await pair.brandPage
    .getByRole('button', { name: /Enviar oferta|Send Offer/i })
    .click()
  await expect(
    pair.brandPage.getByTestId('offers.send.submit_button'),
  ).toBeVisible()
}

export async function fillPaidOfferDraft(pair: ChatPair): Promise<void> {
  const page = pair.brandPage

  await page.getByText(/Elegi una campana|Elegí una campaña/i).click()
  await page.getByRole('option', { name: PAID_OFFER_CAMPAIGN_NAME }).click()
  await page.getByLabel(/^(Monto|Amount)$/i).fill(PAID_OFFER_BASE_AMOUNT)
  await page.getByLabel(/Publicacion tentativa|Publicación tentativa/i).fill(
    dateDaysFromNow(7),
  )
  await page.getByLabel(/Fecha limite|Fecha límite/i).fill(dateDaysFromNow(14))

  const bonusSwitch = page.getByRole('switch', {
    name: /Bonos de oferta|Offer bonuses/i,
  })
  await bonusSwitch.setChecked(true)
}

export async function submitPaidOffer(pair: ChatPair): Promise<void> {
  await pair.brandPage.getByTestId('offers.send.submit_button').click()
}

export async function sendPaidOffer(pair: ChatPair): Promise<ConversationPage> {
  const chat = await setupPaidBrand(pair)
  await openSendOfferSidesheet(pair)
  await fillPaidOfferDraft(pair)
  await submitPaidOffer(pair)
  await expect(
    pair.brandPage.getByTestId('offers.send.submit_button'),
  ).toBeHidden({
    timeout: 30_000,
  })
  await expect(
    chat.timeline.getByRole('article', { name: /Oferta enviada/i }),
  ).toBeVisible({ timeout: 15_000 })
  return chat
}

export async function createPaidOfferViaApi(
  pair: ChatPair,
  offerDraftId?: string,
  authToken?: string,
): Promise<void> {
  const token = authToken ?? (await getClerkSessionToken(pair.brandPage))
  const response = await pair.brandPage.request.post(`${API_BASE_URL}/v1/offers`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Brand-Workspace-Id': pair.brandWorkspaceId,
      'Idempotency-Key': randomUUID(),
    },
    data: {
      ...(offerDraftId ? { offer_draft_id: offerDraftId } : {}),
      return_to: {
        kind: 'conversation',
        id: pair.conversationId,
      },
      campaign_id: pair.campaignId,
      conversation_id: pair.conversationId,
      offer_mode: 'same_content',
      amount: `${PAID_OFFER_BASE_AMOUNT}.00`,
      tentative_publish_date: dateDaysFromNow(7),
      offer_deadline: dateDaysFromNow(14),
      description: '',
      bonus_terms: {
        speed_bonus_windows: [
          {
            window_hours: 24,
            bonus_amount: {
              type: 'percentage',
              value: 10,
            },
          },
        ],
      },
      platforms: ['instagram'],
      deliverables: [
        {
          position: 1,
          platform: 'instagram',
          format: '',
          quantity: 1,
        },
      ],
    },
  })

  expect(
    response.ok(),
    `POST /v1/offers failed: ${response.status()} ${await response.text()}`,
  ).toBe(true)
}

export async function getCurrentOfferId(pair: ChatPair): Promise<string> {
  const token = await getClerkSessionToken(pair.brandPage)
  const response = await pair.brandPage.request.get(
    `${API_BASE_URL}/v1/conversations/${pair.conversationId}/offers`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Brand-Workspace-Id': pair.brandWorkspaceId,
      },
    },
  )

  expect(
    response.ok(),
    `GET /v1/conversations/${pair.conversationId}/offers failed: ${response.status()} ${await response.text()}`,
  ).toBe(true)

  const body = (await response.json()) as { current?: { id?: string } | null }
  expect(body.current?.id, 'Expected current sent offer id').toBeDefined()
  return body.current!.id!
}

export async function createRequiresActionFault(params: {
  offerDraftId: string
  checkoutUrl: string
}): Promise<void> {
  await createTestFault({
    method: 'POST',
    path: '/v1/offers',
    status: 201,
    count: 1,
    body: {
      status: 'requires_action',
      offer_draft_id: params.offerDraftId,
      checkout_url: params.checkoutUrl,
    },
  })
}

export async function createDraftStatusSentFault(
  offerDraftId: string,
): Promise<void> {
  await createTestFault({
    method: 'GET',
    path: `/v1/offers/draft-status/${offerDraftId}`,
    status: 200,
    count: 1,
    body: {
      status: 'sent',
    },
  })
}

export async function createHoldDeclinedFault(): Promise<void> {
  await createTestFault({
    method: 'POST',
    path: '/v1/offers',
    status: 201,
    count: 1,
    body: {
      status: 'rejected',
      error: {
        code: 'card_declined',
        stripe_code: null,
      },
    },
  })
}

export async function createCaptureFailedFault(offerId: string): Promise<void> {
  await createTestFault({
    method: 'POST',
    path: `/v1/offers/${offerId}/accept`,
    status: 402,
    count: 1,
    body: {
      error: {
        code: 'capture_failed_generic',
        stripe_code: null,
      },
    },
  })
}
