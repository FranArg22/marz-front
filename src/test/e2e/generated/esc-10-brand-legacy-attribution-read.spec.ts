import { expect, getClerkSessionToken, TestUser, test } from '../fixtures'

const API_BASE_URL = (
  process.env.VITE_API_URL ??
  process.env.API_URL ??
  'http://localhost:8080'
).replace(/\/$/, '')
const brandEmail = process.env.E2E_LEGACY_ATTRIBUTION_BRAND_EMAIL

// HELPER SUGERIDO: seedBrandWithAttribution(source: string)
test.skip(
  !brandEmail,
  'SETUP REQUERIDO: primitiva para fijar attribution_source en un brand existente.',
)

test('ESC-10: GET brand onboarding con attribution legacy responde sin twitter_x', async ({
  page,
}) => {
  const brand = new TestUser(
    'e2e_legacy_attribution_brand',
    brandEmail!,
    'E2E Legacy Attribution Brand',
  )
  await brand.signIn(page)

  const token = await getClerkSessionToken(page)
  const response = await page.request.get(`${API_BASE_URL}/v1/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  expect(response.ok()).toBeTruthy()
  const raw = await response.text()
  expect(raw).not.toContain('twitter_x')

  await page.goto('/onboarding/brand/attribution')
  await expect(
    page.getByRole('heading', { name: /Cómo llegaste a Marz/i }),
  ).toBeVisible()
  await expect(page.getByRole('radio', { checked: true })).toHaveCount(0)
  await expect(page.getByRole('radio', { name: /Twitter|^X$/i })).toHaveCount(
    0,
  )
})
