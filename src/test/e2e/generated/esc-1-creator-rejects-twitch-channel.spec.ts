import type { Page } from '@playwright/test'

import { expect, getClerkSessionToken, test } from '../fixtures'

const API_BASE_URL = (
  process.env.VITE_API_URL ??
  process.env.API_URL ??
  'http://localhost:8080'
).replace(/\/$/, '')

const supportedPlatformLabels = ['Instagram', 'TikTok', 'YouTube'] as const
const unsupportedPlatformLabels = [/Twitch/i]

type ApiErrorEnvelope = {
  code?: string
  details?: { field?: string; value?: unknown; allowed?: unknown }
  error?: ApiErrorEnvelope
}

function extractApiError(raw: unknown) {
  const body = (raw ?? {}) as ApiErrorEnvelope
  if (body.code) return { code: body.code, details: body.details }
  if (body.error?.code) {
    return { code: body.error.code, details: body.error.details }
  }
  return {}
}

function creatorPayload(platform: string, handle: string) {
  return {
    handle: `feat023_${Date.now().toString(36).slice(-6)}`,
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
        platform,
        external_handle: handle,
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

async function visiblePlatformOptions(page: Page) {
  await page.getByRole('button', { name: /Agregar canal/i }).click()
  await page.getByRole('combobox').first().click()
  const options = page.getByRole('option')
  await expect(options).toHaveCount(3)
  const labels = await options.allTextContents()
  await page.keyboard.press('Escape')
  return labels.map((label) => label.trim())
}

function expectInvalidPlatformError(raw: unknown) {
  const { code, details } = extractApiError(raw)
  expect(code).toBe('validation.invalid_value')
  expect(details?.field).toContain('platform')
  expect(details?.value).toBe('twitch')
  expect(details?.allowed).toEqual(['instagram', 'tiktok', 'youtube'])
}

test('ESC-1: Creator no puede guardar Twitch como Creator channel', async ({
  page,
  creatorOnboardingUser,
}) => {
  await creatorOnboardingUser.signIn(page)
  await page.goto('/onboarding/creator/channels')

  await expect(
    page.getByRole('button', { name: /Agregar canal/i }),
  ).toBeVisible()
  await expect(visiblePlatformOptions(page)).resolves.toEqual(
    supportedPlatformLabels,
  )
  for (const label of unsupportedPlatformLabels) {
    await expect(page.getByRole('option', { name: label })).toHaveCount(0)
  }

  const token = await getClerkSessionToken(page)
  const response = await page.request.post(
    `${API_BASE_URL}/v1/onboarding/creator:complete`,
    {
      headers: { Authorization: `Bearer ${token}` },
      data: creatorPayload('twitch', 'creator_fe23'),
    },
  )

  expect(response.status()).toBe(422)
  expectInvalidPlatformError(await response.json())

  await expect(page).toHaveURL(/\/onboarding\/creator\/channels/)
  await expect(
    page.getByRole('button', { name: /Agregar canal/i }),
  ).toBeVisible()
})
