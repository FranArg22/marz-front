import { expect, getClerkSessionToken, TestUser, test } from '../fixtures'

const API_BASE_URL = (
  process.env.VITE_API_URL ??
  process.env.API_URL ??
  'http://localhost:8080'
).replace(/\/$/, '')
const campaignId = process.env.FEAT023_CAMPAIGN_ONLY_LEGACY_ID
const brandEmail =
  process.env.FEAT023_BRAND_EMAIL ?? 'brand-feat023+clerk_test@example.com'

test.skip(
  !campaignId,
  'SETUP REQUERIDO: seed feat023_campaign_only_legacy_platforms y exportar FEAT023_CAMPAIGN_ONLY_LEGACY_ID.',
)

async function authHeaders(page: import('@playwright/test').Page) {
  const token = await getClerkSessionToken(page)
  const me = await page.request.get(`${API_BASE_URL}/v1/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  expect(me.ok()).toBeTruthy()
  const meBody = await me.json()
  return {
    Authorization: `Bearer ${token}`,
    'X-Brand-Workspace-Id': meBody.brand_workspace.id,
  }
}

test('ESC-6: Activar Campaign sin plataformas operativas -> 409 inline en ReviewStep', async ({
  page,
}) => {
  const brand = new TestUser('feat023_brand_fixture', brandEmail, 'FEAT023 Brand')
  await brand.signIn(page)
  await page.goto(`/campaigns/${campaignId}/configuration/review`)

  await expect(
    page.getByRole('button', { name: /activar|publicar|lanzar/i }),
  ).toBeVisible()
  const activationButton = page.getByRole('button', {
    name: /activar|publicar|lanzar/i,
  })

  const responsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.url().includes(`/v1/campaigns/${campaignId}/configuration/activate`),
  )
  await activationButton.click()
  const response = await responsePromise
  expect(response.status()).toBe(409)
  const body = await response.json()
  expect(body.code).toBe('campaign.no_supported_platforms')

  await expect(
    page.getByText(/sin plataformas soportadas|agregar Instagram|TikTok|YouTube/i),
  ).toBeVisible()

  const headers = await authHeaders(page)
  const detail = await page.request.get(
    `${API_BASE_URL}/v1/campaigns/${campaignId}/detail`,
    { headers },
  )
  expect(detail.ok()).toBeTruthy()
  expect((await detail.json()).status).toBe('draft')
})
