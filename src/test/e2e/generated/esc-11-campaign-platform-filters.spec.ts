import type { Page } from '@playwright/test'

import { expect, getClerkSessionToken, TestUser, test } from '../fixtures'

const API_BASE_URL = (
  process.env.VITE_API_URL ??
  process.env.API_URL ??
  'http://localhost:8080'
).replace(/\/$/, '')
const campaignId = process.env.E2E_MIXED_CREATORS_CAMPAIGN_ID
const brandEmail = process.env.E2E_LEGACY_CAMPAIGN_BRAND_EMAIL

// HELPER SUGERIDO: seedCampaignWithParticipantsByPlatform(platforms: string[])
test.skip(
  !campaignId || !brandEmail,
  'SETUP REQUERIDO: primitiva para crear campaign con participants/videos en plataformas arbitrarias.',
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

async function assertPlatformFilterOptions(page: Page) {
  await page.getByRole('combobox', { name: /platform/i }).click()
  await expect(page.getByRole('option')).toContainText([
    'All platforms',
    'YouTube',
    'Instagram',
    'TikTok',
  ])
  await expect(
    page.getByRole('option', { name: /Twitch|Twitter/i }),
  ).toHaveCount(0)
  await page.keyboard.press('Escape')
}

async function selectPlatform(page: Page, name: string) {
  await page.getByRole('combobox', { name: /platform/i }).click()
  await page.getByRole('option', { name }).click()
  await expect(page).toHaveURL(new RegExp(`platform=${name.toLowerCase()}`))
}

test('ESC-11: Filtros de creators/videos tras quitar Twitch resetean y muestran resultados válidos', async ({
  page,
}) => {
  const brand = new TestUser(
    'e2e_mixed_creators_campaign_brand',
    brandEmail!,
    'E2E Mixed Creators Campaign Brand',
  )
  await brand.signIn(page)
  const headers = await authHeaders(page)

  await page.goto(`/campaigns/${campaignId}`)

  for (const tabName of [/creators/i, /videos/i]) {
    const tab = page.getByRole('tab', { name: tabName })
    if ((await tab.count()) > 0) await tab.click()

    await assertPlatformFilterOptions(page)
    await selectPlatform(page, 'Instagram')
    await expect(page.getByText(/Twitch|Twitter|twitter_x/i)).toHaveCount(0)

    await selectPlatform(page, 'TikTok')
    await expect(page.getByText(/Twitch|Twitter|twitter_x/i)).toHaveCount(0)

    await page.getByRole('button', { name: /clear|limpiar/i }).click()
    await expect(page).not.toHaveURL(/platform=/)

    const apiPath =
      tabName.toString().includes('videos') ?
        `/v1/campaigns/${campaignId}/videos` :
        `/v1/campaigns/${campaignId}/participants`
    const response = await page.request.get(`${API_BASE_URL}${apiPath}`, {
      headers,
    })
    expect(response.ok()).toBeTruthy()
    expect(await response.text()).not.toMatch(/"twitch"|"x"|twitter_x/)
  }
})
