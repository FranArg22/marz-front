import type { Page } from '@playwright/test'

import { expect, getClerkSessionToken, test } from '../fixtures'

const API_BASE_URL = (
  process.env.VITE_API_URL ??
  process.env.API_URL ??
  'http://localhost:8080'
).replace(/\/$/, '')

function creatorPayload(handleSuffix: string) {
  return {
    handle: `feat023_${handleSuffix}`,
    display_name: 'Creator FEAT023',
    bio: null,
    niches: ['beauty'],
    content_types: ['video'],
    country: 'AR',
    city: 'Buenos Aires',
    avatar_s3_key: 'e2e/feat023/avatar.png',
    birthday: '1995-05-10',
    whatsapp_e164: '+5491155555555',
    gender: 'prefer_not_say',
    experience_level: '1_to_5',
    channels: [
      {
        platform: 'instagram',
        external_handle: 'creator_fe23_ig',
        external_url: null,
        followers: null,
        verified: false,
        is_primary: true,
        rate_cards: [],
      },
    ],
    best_videos: [],
    referral_text: null,
    tier: 'emergent',
  }
}

async function assertChannelSelector(page: Page) {
  await page.getByRole('button', { name: /Agregar canal/i }).click()
  await page.getByRole('combobox').first().click()
  await expect(page.getByRole('option')).toHaveText([
    'Instagram',
    'TikTok',
    'YouTube',
  ])
  await page.getByRole('option', { name: 'Instagram' }).click()
  await expect(page.getByRole('button', { name: /Instagram/ })).toBeVisible()
}

test('ESC-2: Creator happy-path con plataformas oficiales', async ({
  page,
  creatorOnboardingUser,
}, testInfo) => {
  await creatorOnboardingUser.signIn(page)
  await page.goto('/onboarding/creator/channels')
  await assertChannelSelector(page)

  const token = await getClerkSessionToken(page)
  const response = await page.request.post(
    `${API_BASE_URL}/v1/onboarding/creator:complete`,
    {
      headers: { Authorization: `Bearer ${token}` },
      data: creatorPayload(testInfo.workerIndex.toString(36) + Date.now().toString(36).slice(-5)),
    },
  )

  expect(response.status()).toBeGreaterThanOrEqual(200)
  expect(response.status()).toBeLessThan(300)
  const body = await response.json()
  expect(JSON.stringify(body)).toContain('onboarded')

  await page.goto('/onboarding/creator')
  await expect(page).toHaveURL(/\/offers/, { timeout: 15_000 })
})
