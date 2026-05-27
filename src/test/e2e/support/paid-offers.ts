import type { Browser, Page } from '@playwright/test'

import {
  createTestConversation,
  createTestFault,
} from '#/shared/api/test-generated/test/test'
import type { CreateTestConversationResponse } from '#/shared/api/test-generated/model'

import { BrandOnboardingWizard } from '../poms/onboarding/brand-wizard.pom'
import { ConversationPage } from '../poms/conversation.pom'
import { expect, getClerkSessionToken } from './fixtures'
import type { ChatPair } from './fixtures'
import { API_BASE_URL } from './env'
import { TestUser } from './test-user'

export const STRIPE_TEST_MODE_ENABLED = process.env.STRIPE_TEST_MODE === '1'

export const PAID_OFFER_BASE_AMOUNT = '500'
export const PAID_OFFER_EXPECTED_BASE_AMOUNT = '$500.00 USD (base)'
export const PAID_OFFER_EXPECTED_BONUS_AMOUNT = '$50.00 USD (bonus)'
export const PAID_OFFER_SCA_CARD = '4000 0025 0000 3155'

const PAID_OFFER_CAMPAIGN_NAME = 'E2E OfferSent Campaign'
const DEFAULT_STRIPE_CARD = '4242 4242 4242 4242'

async function clickStripeHostedButton(
  page: Page,
  name: RegExp,
): Promise<void> {
  const deadline = Date.now() + 60_000
  let lastError: unknown

  while (Date.now() < deadline) {
    const locators = [
      page.getByRole('button', { name }).first(),
      page.getByRole('link', { name }).first(),
      ...page.frames().flatMap((frame) => [
        frame.getByRole('button', { name }).first(),
        frame.getByRole('link', { name }).first(),
      ]),
    ]

    for (const locator of locators) {
      try {
        await locator.click({ timeout: 1_000 })
        return
      } catch (error) {
        lastError = error
      }
    }

    await page.waitForTimeout(500)
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Stripe hosted button not found: ${name}`)
}

export async function completeStripe3dsAuthentication(
  page: Page,
): Promise<void> {
  await clickStripeHostedButton(
    page,
    /Complete|Completar|Authorize|Autorizar|Authenticate|Autenticar/i,
  )
}

async function completeStarterCheckoutViaApi(
  page: Page,
  cardNumber: string,
): Promise<void> {
  const token = await getClerkSessionToken(page)
  const origin = new URL(page.url()).origin
  const response = await page.request.post(
    `${API_BASE_URL}/v1/onboarding/brand:complete`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        name: 'E2E Paid Offer Brand',
        website_url: 'https://example.com',
        primary_color_hex: '#111827',
        secondary_color_hex: '#2563eb',
        brandfetch_snapshot: null,
        vertical: 'tech',
        marketing_objective: 'awareness',
        creator_experience: 'never',
        creator_sourcing_intent: 'discover_in_marz',
        monthly_budget_range: 'under_10k',
        timing: 'this_month',
        attribution: { source: 'search' },
        contact_name: 'E2E Paid Offer Brand',
        contact_title: 'Owner',
        contact_whatsapp_e164: '+15555550123',
        billing_intent: {
          plan: 'starter',
          interval: 'month',
          success_url: `${origin}/onboarding/brand/billing-callback?checkout=success`,
          cancel_url: `${origin}/onboarding/brand/billing-callback?checkout=cancel`,
        },
      },
    },
  )

  expect(
    response.ok(),
    `POST /v1/onboarding/brand:complete failed: ${response.status()} ${await response.text()}`,
  ).toBe(true)

  const body = (await response.json()) as { checkout_url?: string | null }
  expect(body.checkout_url).toMatch(/^https:\/\/checkout\.stripe\.com\//)

  await page.goto(body.checkout_url!)
  await fillStripeCheckoutCard(page, cardNumber)
}

async function fillStripeCheckoutCard(
  page: Page,
  cardNumber: string,
): Promise<void> {
  await page
    .getByLabel(/Card number|Numero de tarjeta|Número de tarjeta/i)
    .fill(cardNumber)
  await page.getByLabel(/Expiration|Vencimiento|MM \/ AA/i).fill('12 / 34')
  await page.getByLabel(/CVC|CVV/i).fill('123')
  await page
    .getByLabel(/Cardholder name|Nombre del titular/i)
    .fill('E2E Paid Offer Brand')

  await page
    .getByRole('button', { name: /Subscribe|Pay|Suscribirse|Pagar/i })
    .click()

  if (cardNumber.replace(/\s/g, '') === PAID_OFFER_SCA_CARD.replace(/\s/g, '')) {
    await completeStripe3dsAuthentication(page)
  }
}

export async function cancelStripeHostedCheckout(page: Page): Promise<void> {
  try {
    await clickStripeHostedButton(
      page,
      /Cancel|Cancelar|Back|Volver|Return|Regresar/i,
    )
    return
  } catch {
    await page.goBack({ waitUntil: 'domcontentloaded' })
  }
}

export function dateDaysFromNow(days: number): string {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export async function completeStarterCheckout(
  pair: ChatPair,
  options?: { cardNumber?: string },
): Promise<void> {
  const { brandPage } = pair
  const wizard = new BrandOnboardingWizard(brandPage)
  const cardNumber = options?.cardNumber ?? DEFAULT_STRIPE_CARD

  await brandPage.goto('/onboarding/brand/paywall')
  await wizard.expectStep(13)

  await brandPage.getByRole('tab', { name: /Mensual|Monthly/i }).click()
  const trialButton = brandPage
    .getByRole('button', { name: /probar 7 días gratis|start.*trial/i })
    .first()

  let selectedTrial = false
  try {
    await trialButton.click({ timeout: 5_000 })
    selectedTrial = true
  } catch {
    selectedTrial = false
  }

  if (selectedTrial) {
    await wizard.expectStep(14)
    await Promise.all([
      brandPage.waitForURL(/checkout\.stripe\.com/, { timeout: 30_000 }),
      brandPage.getByTestId('onboarding-start-btn').click(),
    ])
  } else {
    await brandPage.getByRole('radio', { name: /starter/i }).click()

    const continueButton = brandPage.getByRole('button', {
      name: /Continuar con plan pago/,
    })
    await expect(continueButton).toBeEnabled()

    await Promise.all([
      brandPage.waitForURL(/checkout\.stripe\.com/, { timeout: 30_000 }),
      continueButton.click(),
    ])
  }

  await fillStripeCheckoutCard(brandPage, cardNumber)

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
  options?: { offersCardNumber?: string },
): Promise<ConversationPage> {
  await completeStarterCheckout(pair, { cardNumber: options?.offersCardNumber })
  await expectOffersPaymentMethod(pair)

  const chat = new ConversationPage(pair.brandPage)
  await chat.goto(pair.conversationId)
  return chat
}

export async function createPaidOfferReadyChatPair(
  browser: Browser,
  userKey: string,
  options: { offersCardNumber: string },
): Promise<{
  pair: ChatPair
  chat: ConversationPage
  cleanup: () => Promise<void>
}> {
  const brand = new TestUser(
    `e2e_paid_brand_${userKey}`,
    `e2e.paid.brand.${userKey}+clerk_test@example.com`,
    'E2E Paid Offer Brand',
  )
  const creator = new TestUser(
    `e2e_paid_creator_${userKey}`,
    `e2e.paid.creator.${userKey}+clerk_test@example.com`,
    'E2E Paid Offer Creator',
  )

  const brandCtx = await browser.newContext()
  const creatorCtx = await browser.newContext()
  const brandPage = await brandCtx.newPage()
  const creatorPage = await creatorCtx.newPage()

  const cleanup = async () => {
    await Promise.all([
      brandCtx.close().catch(() => {}),
      creatorCtx.close().catch(() => {}),
      brand.delete().catch(() => {}),
      creator.delete().catch(() => {}),
    ])
  }

  try {
    await brand.ensureExists()
    await brand.setOnboardingState('onboarding_pending', 'brand')
    await creator.ensureExists()
    await creator.onboardFull('creator')

    await brand.signIn(brandPage)
    await completeStarterCheckoutViaApi(brandPage, options.offersCardNumber)
    await brandPage.waitForURL(/\/onboarding\/brand\/confirmation/, {
      timeout: 60_000,
    })

    await creator.signIn(creatorPage)

    const res = await createTestConversation({
      brand_clerk_user_id: brand.clerkUserId,
      creator_clerk_user_id: creator.clerkUserId,
      seed_offer_ready: {
        campaign_name: PAID_OFFER_CAMPAIGN_NAME,
        currency: 'USD',
      },
    })
    const conversation = (res as { data: CreateTestConversationResponse }).data

    const pair: ChatPair = {
      conversationId: conversation.conversation_id,
      brandWorkspaceId: conversation.brand_workspace_id,
      campaignId: conversation.campaign_id,
      brand,
      creator,
      brandPage,
      creatorPage,
    }

    await expectOffersPaymentMethod(pair)

    const chat = new ConversationPage(brandPage)
    await chat.goto(pair.conversationId)
    return { pair, chat, cleanup }
  } catch (error) {
    await cleanup()
    throw error
  }
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
