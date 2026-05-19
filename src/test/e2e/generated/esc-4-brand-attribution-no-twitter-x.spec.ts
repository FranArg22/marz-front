import { expect, getClerkSessionToken, test } from '../fixtures'

const API_BASE_URL = (
  process.env.VITE_API_URL ??
  process.env.API_URL ??
  'http://localhost:8080'
).replace(/\/$/, '')

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

function brandPayload() {
  return {
    name: 'Brand FEAT023',
    website_url: 'https://brand-feat023.example',
    primary_color_hex: '#111111',
    secondary_color_hex: '#eeeeee',
    brandfetch_snapshot: null,
    vertical: 'tech',
    marketing_objective: 'performance',
    creator_experience: 'never',
    creator_sourcing_intent: 'discover_in_marz',
    monthly_budget_range: 'under_10k',
    timing: 'launch_now',
    attribution: { source: 'twitter_x' },
    contact_name: 'Brand Owner',
    contact_title: 'Growth Lead',
    contact_whatsapp_e164: '+5491155555555',
  }
}

test('ESC-4: Brand B11 attribution sin Twitter/X', async ({
  page,
  brandOnboardingUser,
}) => {
  await brandOnboardingUser.signIn(page)
  await page.goto('/onboarding/brand/attribution')

  await expect(
    page.getByRole('heading', { name: /Cómo llegaste a Marz/i }),
  ).toBeVisible()
  await expect(page.getByRole('radio')).toHaveText([
    'Instagram',
    'Referido',
    'Búsqueda',
    'Otro',
    'TikTok',
    'LinkedIn',
    'Reddit',
  ])
  await expect(page.getByRole('radio', { name: /Twitter|^X$/i })).toHaveCount(
    0,
  )

  const token = await getClerkSessionToken(page)
  const response = await page.request.post(
    `${API_BASE_URL}/v1/onboarding/brand:complete`,
    {
      headers: { Authorization: `Bearer ${token}` },
      data: brandPayload(),
    },
  )

  expect(response.status()).toBe(422)
  const { code, details } = extractApiError(await response.json())
  expect(code).toBe('validation.invalid_value')
  expect(details?.field).toContain('attribution')
  expect(details?.value).toBe('twitter_x')
  expect(details?.allowed).not.toContain('twitter_x')

  await expect(page).toHaveURL(/\/onboarding\/brand\/attribution/)
})
