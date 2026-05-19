import type { Page } from '@playwright/test'

import { expect, getClerkSessionToken, TestUser, test } from '../fixtures'

const API_BASE_URL = (
  process.env.VITE_API_URL ??
  process.env.API_URL ??
  'http://localhost:8080'
).replace(/\/$/, '')
const campaignId = process.env.E2E_MIXED_LEGACY_CAMPAIGN_ID
const brandEmail = process.env.E2E_LEGACY_CAMPAIGN_BRAND_EMAIL

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

test('ESC-7: Activar Campaign con mix válido + legacy activa y filtra legacy', async ({
  page,
}) => {
  const brand = new TestUser(
    'e2e_mixed_legacy_campaign_brand',
    brandEmail!,
    'E2E Mixed Legacy Campaign Brand',
  )
  await brand.signIn(page)
  const headers = await authHeaders(page)

  const config = await page.request.get(
    `${API_BASE_URL}/v1/campaigns/${campaignId}/configuration`,
    { headers },
  )
  expect(config.ok()).toBeTruthy()
  const configuration = (await config.json()) as {
    configuration_version?: number
  }
  expect(configuration.configuration_version).toBeTruthy()

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
  const body = (await detail.json()) as {
    status?: string
    platforms?: string[]
  }
  expect(body.status).toBe('active')
  expect(body.platforms).toEqual(['instagram'])

  await page.goto(`/campaigns/${campaignId}`)
  await expect(page.getByText(/twitter_x|twitch|Twitter|Twitch/i)).toHaveCount(
    0,
  )
})
