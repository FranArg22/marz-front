import { test, expect } from '../../support/fixtures'

test.describe('unified campaign wizard', () => {
  test('loads /campaigns/new at step 1', async ({
    page,
    onboardedBrandUser,
  }) => {
    await onboardedBrandUser.signIn(page)

    await page.goto('/campaigns/new')

    await expect(page.getByText('Paso 1 de 7')).toBeVisible()
    await expect(page.getByText('Wizard próximamente')).toBeVisible()
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
})
