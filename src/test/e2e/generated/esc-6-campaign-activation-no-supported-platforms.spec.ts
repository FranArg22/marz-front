import type { Page } from '@playwright/test'

import { expect, getClerkSessionToken, TestUser, test } from '../fixtures'

const API_BASE_URL = (
  process.env.VITE_API_URL ??
  process.env.API_URL ??
  'http://localhost:8080'
).replace(/\/$/, '')
const campaignId = process.env.E2E_LEGACY_ONLY_CAMPAIGN_ID
const brandEmail = process.env.E2E_LEGACY_CAMPAIGN_BRAND_EMAIL

type ApiErrorEnvelope = {
  code?: string
  details?: unknown
  error?: ApiErrorEnvelope
}

function extractApiError(raw: unknown): { code?: string; details?: unknown } {
  const body = (raw ?? {}) as ApiErrorEnvelope
  if (body.code) return { code: body.code, details: body.details }
  if (body.error?.code) {
    return { code: body.error.code, details: body.error.details }
  }
  return {}
}

// HELPER SUGERIDO: seedDraftCampaignWithStoredPlatforms(platforms: string[])
test.skip(
  !campaignId || !brandEmail,
  'SETUP REQUERIDO: primitiva para crear campaign draft con plataformas almacenadas arbitrarias.',
)

async function authHeaders(page: Page) {
  const token = await getClerkSessionToken(page)
  const me = await page.request.get(`${API_BASE_URL}/v1/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  expect(me.ok()).toBeTruthy()
  const meBody = (await me.json()) as { brand_workspace?: { id?: string } }
  expect(meBody.brand_workspace?.id).toBeTruthy()
  return {
    Authorization: `Bearer ${token}`,
    'X-Brand-Workspace-Id': meBody.brand_workspace!.id!,
  }
}

test('ESC-6: Activar Campaign sin plataformas operativas -> 409 inline en ReviewStep', async ({
  page,
}) => {
  const brand = new TestUser(
    'e2e_legacy_campaign_brand',
    brandEmail!,
    'E2E Legacy Campaign Brand',
  )
  await brand.signIn(page)
  await page.goto(`/campaigns/${campaignId}/configuration/review`)

  const activationButton = page.getByRole('button', {
    name: /activar|publicar|lanzar/i,
  })
  await expect(activationButton).toBeVisible()

  const responsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response
        .url()
        .includes(`/v1/campaigns/${campaignId}/configuration/activate`),
  )
  await activationButton.click()
  const response = await responsePromise
  expect(response.status()).toBe(409)
  const { code } = extractApiError(await response.json())
  expect(code).toBe('campaign.no_supported_platforms')

  await expect(
    page.getByText(
      /sin plataformas soportadas|agregá Instagram|agregar Instagram|TikTok|YouTube/i,
    ),
  ).toBeVisible()

  const headers = await authHeaders(page)
  const detail = await page.request.get(
    `${API_BASE_URL}/v1/campaigns/${campaignId}/detail`,
    { headers },
  )
  expect(detail.ok()).toBeTruthy()
  const detailBody = (await detail.json()) as { status?: string }
  expect(detailBody.status).toBe('draft')
})
