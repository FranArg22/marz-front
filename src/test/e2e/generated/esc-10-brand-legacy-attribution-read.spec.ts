import { expect, getClerkSessionToken, TestUser, test } from '../fixtures'

const API_BASE_URL = (
  process.env.VITE_API_URL ??
  process.env.API_URL ??
  'http://localhost:8080'
).replace(/\/$/, '')
const brandEmail =
  process.env.FEAT023_BRAND_LEGACY_ATTRIBUTION_EMAIL ??
  'brand-feat023-legacy-attribution+clerk_test@example.com'

test.skip(
  !process.env.FEAT023_BRAND_LEGACY_ATTRIBUTION_EMAIL,
  'SETUP REQUERIDO: seed feat023_brand_legacy_attribution_twitter_x y exportar FEAT023_BRAND_LEGACY_ATTRIBUTION_EMAIL.',
)

test('ESC-10: GET brand onboarding con attribution legacy responde sin twitter_x', async ({
  page,
}) => {
  const brand = new TestUser(
    'feat023_brand_legacy_attribution',
    brandEmail,
    'FEAT023 Legacy Attribution Brand',
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
