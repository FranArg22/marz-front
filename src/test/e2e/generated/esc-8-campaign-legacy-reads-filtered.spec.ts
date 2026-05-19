import { expect, getClerkSessionToken, TestUser, test } from '../fixtures'

const API_BASE_URL = (
  process.env.VITE_API_URL ??
  process.env.API_URL ??
  'http://localhost:8080'
).replace(/\/$/, '')
const campaignId = process.env.FEAT023_CAMPAIGN_WITH_LEGACY_ID
const brandEmail =
  process.env.FEAT023_BRAND_EMAIL ?? 'brand-feat023+clerk_test@example.com'

test.skip(
  !campaignId,
  'SETUP REQUERIDO: seed feat023_campaign_with_legacy_in_storage y exportar FEAT023_CAMPAIGN_WITH_LEGACY_ID.',
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

test('ESC-8: GET campaigns con fixtures legacy no expone legacy en reads', async ({
  page,
}) => {
  const brand = new TestUser('feat023_brand_fixture', brandEmail, 'FEAT023 Brand')
  await brand.signIn(page)
  const headers = await authHeaders(page)

  for (const path of [
    `/v1/campaigns/${campaignId}/detail`,
    `/v1/campaigns/${campaignId}/videos`,
    `/v1/campaigns/${campaignId}/participants`,
  ]) {
    const response = await page.request.get(`${API_BASE_URL}${path}`, {
      headers,
    })
    expect(response.ok()).toBeTruthy()
    const text = await response.text()
    expect(text).not.toMatch(/"x"|"twitch"|twitter_x|Twitter|Twitch/)
  }

  await page.goto(`/campaigns/${campaignId}`)
  await expect(page.getByText(/Twitter|Twitch|twitter_x/i)).toHaveCount(0)

  for (const tabName of [/creators/i, /videos/i]) {
    const tab = page.getByRole('tab', { name: tabName })
    if ((await tab.count()) > 0) await tab.click()
    await page.getByRole('combobox', { name: /platform/i }).click()
    await expect(page.getByRole('option')).toContainText([
      'All platforms',
      'YouTube',
      'Instagram',
      'TikTok',
    ])
    await expect(page.getByRole('option', { name: /Twitter|Twitch/i })).toHaveCount(
      0,
    )
    await page.keyboard.press('Escape')
  }
})
