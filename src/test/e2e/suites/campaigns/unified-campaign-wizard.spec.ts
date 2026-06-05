import { test, expect } from '../../support/fixtures'

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
})
