import { expect, getClerkSessionToken, TestUser, test } from '../fixtures'

const API_BASE_URL = (
  process.env.VITE_API_URL ??
  process.env.API_URL ??
  'http://localhost:8080'
).replace(/\/$/, '')
const campaignId = process.env.FEAT023_CAMPAIGN_MIX_LEGACY_ID
const brandEmail =
  process.env.FEAT023_BRAND_EMAIL ?? 'brand-feat023+clerk_test@example.com'

test.skip(
  !campaignId,
  'SETUP REQUERIDO: seed feat023_campaign_mix_legacy_and_supported y exportar FEAT023_CAMPAIGN_MIX_LEGACY_ID.',
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

test('ESC-7: Activar Campaign con mix válido + legacy activa y filtra legacy', async ({
  page,
}) => {
  const brand = new TestUser('feat023_brand_fixture', brandEmail, 'FEAT023 Brand')
  await brand.signIn(page)
  await page.goto(`/campaigns/${campaignId}/configuration/review`)

  const headers = await authHeaders(page)
  const config = await page.request.get(
    `${API_BASE_URL}/v1/campaigns/${campaignId}/configuration`,
    { headers },
  )
  expect(config.ok()).toBeTruthy()
  const configuration = await config.json()

  const activation = await page.request.post(
    `${API_BASE_URL}/v1/campaigns/${campaignId}/configuration/activate`,
    {
      headers,
      data: { configuration_version: configuration.configuration_version },
    },
  )
  expect(activation.status()).toBeGreaterThanOrEqual(200)
  expect(activation.status()).toBeLessThan(300)

  const detail = await page.request.get(
    `${API_BASE_URL}/v1/campaigns/${campaignId}/detail`,
    { headers },
  )
  expect(detail.ok()).toBeTruthy()
  const body = await detail.json()
  expect(body.status).toBe('active')
  expect(body.platforms).toEqual(['instagram'])

  await page.goto(`/campaigns/${campaignId}`)
  await expect(page.getByText(/twitter_x|twitch|Twitter|Twitch/i)).toHaveCount(
    0,
  )
})
