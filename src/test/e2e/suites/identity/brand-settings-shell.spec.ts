import { test, expect } from '../../support/fixtures'

test.describe('brand settings shell', () => {
  test('brand_settings.shell.sidebar_two_sections', async ({
    page,
    onboardedBrandUser,
  }) => {
    await onboardedBrandUser.signIn(page)
    await page.goto('/ajustes/general')

    const settingsNav = page.getByRole('navigation', {
      name: /Secciones de ajustes/i,
    })
    const navLinks = settingsNav.getByRole('link')
    const generalLink = page.getByTestId('settings.nav.general')

    await expect(generalLink).toBeVisible()
    await expect(page.getByTestId('settings.nav.subscription')).toBeVisible()
    expect(await navLinks.count()).toBe(2)
    await expect(generalLink).toHaveAttribute('aria-current', 'page')
  })

  test('brand_settings.shell.general_is_default', async ({
    page,
    onboardedBrandUser,
  }) => {
    await onboardedBrandUser.signIn(page)
    await page.goto('/ajustes')

    await expect(page).toHaveURL(/\/ajustes\/general/)
  })

  test('brand_settings.shell.creator_access_denied', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await onboardedCreatorUser.signIn(page)
    await page.goto('/ajustes')

    await expect(page).toHaveURL(/\/workspace/)
    expect(page.url()).not.toContain('/ajustes')
  })

  test('brand_settings.subscription.legacy_billing_redirect', async ({
    page,
    onboardedBrandUser,
  }) => {
    await onboardedBrandUser.signIn(page)
    await page.goto('/billing')

    await expect(page).toHaveURL(/\/ajustes\/suscripcion/)
  })
})
