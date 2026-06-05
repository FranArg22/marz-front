import { test, expect } from '../../support/fixtures'

async function mockStep4Lookups(page: import('@playwright/test').Page) {
  await page.route('**/api/v1/interests', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          { slug: 'beauty', label_es: 'Belleza' },
          { slug: 'gaming', label_es: 'Gaming' },
        ],
      }),
    })
  })
  await page.route('**/api/v1/countries**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [{ code: 'AR', label_es: 'Argentina' }],
      }),
    })
  })
  await page.route('**/api/v1/creator-tiers', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          { slug: 'micro', label_es: 'Micro', followers_min: 1000 },
          { slug: 'macro', label_es: 'Macro', followers_min: 100000 },
        ],
      }),
    })
  })
  await page.route('**/v1/discovery/creator-count**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        available: true,
        count: 4321,
        computed_at: '2026-01-01T00:00:00Z',
      }),
    })
  })
}

test.describe('unified campaign wizard', () => {
  test('loads /campaigns/new at step 1', async ({
    page,
    onboardedBrandUser,
  }) => {
    await onboardedBrandUser.signIn(page)

    await page.goto('/campaigns/new')

    await expect(page.getByText('Paso 1 de 7')).toBeVisible()
    await expect(page.getByText('Elegí el tipo de contenido')).toBeVisible()
  })

  test('redirects inaccessible steps back to step 1', async ({
    page,
    onboardedBrandUser,
  }) => {
    await onboardedBrandUser.signIn(page)

    await page.goto('/campaigns/new?step=3')

    await expect(page).toHaveURL(/\/campaigns\/new\?step=1$/)
    await expect(page.getByText('Paso 1 de 7')).toBeVisible()
  })

  test('selects Influencers Posts and navigates to step 2', async ({
    page,
    onboardedBrandUser,
  }) => {
    await onboardedBrandUser.signIn(page)

    await page.goto('/campaigns/new')
    await page.getByRole('radio', { name: /Influencers Posts/ }).click()
    await page.getByRole('button', { name: /Continuar/ }).click()

    await expect(page).toHaveURL(/\/campaigns\/new\?step=2$/)
    await expect(page.getByText('Paso 2 de 7')).toBeVisible()
  })

  test('selects content type and pricing model and navigates to step 3', async ({
    page,
    onboardedBrandUser,
  }) => {
    await onboardedBrandUser.signIn(page)

    await page.goto('/campaigns/new')
    await page.getByRole('radio', { name: /Influencers Posts/ }).click()
    await page.getByRole('button', { name: /Continuar/ }).click()
    await page.getByRole('radio', { name: /Pay per post/ }).click()
    await page.getByRole('button', { name: /Continuar/ }).click()

    await expect(page).toHaveURL(/\/campaigns\/new\?step=3$/)
    await expect(page.getByText('Paso 3 de 7')).toBeVisible()
  })

  test('selects audience filters, sees creator count, and navigates to step 5', async ({
    page,
    onboardedBrandUser,
  }) => {
    await onboardedBrandUser.signIn(page)
    await mockStep4Lookups(page)

    await page.goto('/campaigns/new')
    await page.getByRole('radio', { name: /Influencers Posts/ }).click()
    await page.getByRole('button', { name: /Continuar/ }).click()
    await page.getByRole('radio', { name: /Pay per post/ }).click()
    await page.getByRole('button', { name: /Continuar/ }).click()
    await page.getByRole('button', { name: /Continuar/ }).click()

    await expect(page).toHaveURL(/\/campaigns\/new\?step=4$/)
    await expect(page.getByText('Paso 4 de 7')).toBeVisible()

    await page.getByRole('button', { name: 'Instagram' }).click()
    await page.getByRole('button', { name: 'Belleza' }).click()
    await page.getByRole('combobox', { name: 'País' }).click()
    await page.getByRole('option', { name: 'Argentina' }).click()
    await page.getByRole('radio', { name: 'Micro' }).click()

    await expect(page.getByText('4.321')).toBeVisible()
    await page.getByRole('button', { name: /Continuar/ }).click()

    await expect(page).toHaveURL(/\/campaigns\/new\?step=5$/)
  })
})
