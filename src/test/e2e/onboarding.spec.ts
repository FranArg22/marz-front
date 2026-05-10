import { test, expect } from './fixtures'

test.describe('Onboarding E2E', () => {
  test('brand onboarding_pending ve el wizard', async ({
    page,
    brandOnboardingUser,
  }) => {
    await brandOnboardingUser.signIn(page)
    await page.goto('/onboarding/brand')

    await expect(page.getByText(/Paso 1 de/)).toBeVisible()
    await expect(page.getByRole('button', { name: /Continuar/i })).toBeVisible()
  })

  test('creator onboarding_pending ve el wizard de creator', async ({
    page,
    creatorOnboardingUser,
  }) => {
    await creatorOnboardingUser.signIn(page)
    await page.goto('/onboarding/creator')

    await expect(page.getByText(/Paso 1 de/)).toBeVisible()
  })

  test('brand onboarded es redirigido de /onboarding/brand a /campaigns', async ({
    page,
    onboardedBrandUser,
  }) => {
    await onboardedBrandUser.signIn(page)
    await page.goto('/onboarding/brand')

    await expect(page).toHaveURL(/\/campaigns/)
  })

  test('creator onboarded es redirigido de /onboarding/creator a /offers', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await onboardedCreatorUser.signIn(page)
    await page.goto('/onboarding/creator')

    await expect(page).toHaveURL(/\/offers/)
  })

  test('kind_pending ve el selector de kind', async ({ page, testUser }) => {
    await testUser.setOnboardingState('kind_pending')
    await testUser.signIn(page)
    await page.goto('/auth/kind')

    await expect(
      page.getByRole('heading', { name: /Qué te trae por acá/i }),
    ).toBeVisible()
  })

  test('brand completa el wizard de B1 a B14 y termina en /campaigns', async ({
    page,
    brandOnboardingUser,
  }) => {
    test.setTimeout(120_000)
    await brandOnboardingUser.signIn(page)
    await page.goto('/onboarding/brand')

    const next = page.getByRole('button', { name: 'Continuar' })

    // B1 — identity
    await expect(page.getByText('Paso 1 de 14')).toBeVisible()
    await page.getByLabel('Nombre de la marca').fill('Marca E2E')
    await page.getByLabel('Sitio web').fill('https://marca-e2e.com')
    await next.click()

    // B2 — vertical
    await expect(page.getByText('Paso 2 de 14')).toBeVisible()
    await page.getByRole('radio', { name: 'Tech', exact: true }).click()
    await next.click()

    // B3 — priming social proof (sin selección)
    await expect(page.getByText('Paso 3 de 14')).toBeVisible()
    await next.click()

    // B4 — objective
    await expect(page.getByText('Paso 4 de 14')).toBeVisible()
    await page.getByRole('radio', { name: /Performance/ }).click()
    await next.click()

    // B5 — experience + sourcing intent
    await expect(page.getByText('Paso 5 de 14')).toBeVisible()
    await page.getByRole('radio', { name: 'Nunca lo hice' }).click()
    await page
      .getByRole('radio', { name: /Quiero descubrirlos en Marz/ })
      .click()
    await next.click()

    // B6 — budget (slider Radix: foco + ArrowRight para mover snaps)
    await expect(page.getByText('Paso 6 de 14')).toBeVisible()
    const slider = page.getByRole('slider').first()
    await slider.focus()
    // Empieza en under_10k (idx 0). 2 ArrowRight → 25k_to_50k.
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await expect(page.getByText('50.000')).toBeVisible()
    await next.click()

    // B7 — priming match preview
    await expect(page.getByText('Paso 7 de 14')).toBeVisible()
    await next.click()

    // B8 — timing
    await expect(page.getByText('Paso 8 de 14')).toBeVisible()
    await page.getByRole('radio', { name: 'Lanzo ya' }).click()
    await next.click()

    // B9 — contact
    await expect(page.getByText('Paso 9 de 14')).toBeVisible()
    await page.getByLabel('Nombre').fill('Rodrigo')
    await page.getByLabel('Cargo').fill('Growth Lead')
    await page.getByLabel('WhatsApp').fill('+5491155555555')
    await next.click()

    // B10 — priming projection
    await expect(page.getByText('Paso 10 de 14')).toBeVisible()
    await next.click()

    // B11 — attribution
    await expect(page.getByText('Paso 11 de 14')).toBeVisible()
    await page.getByRole('radio', { name: 'Instagram' }).click()
    await next.click()

    // B12 — loading: avanza solo después de ~3.3s. Esperamos a B13.
    await expect(page.getByText(/Elegí tu plan/i)).toBeVisible({
      timeout: 10_000,
    })

    // B13 — paywall: planes deshabilitados, único path es "seguir sin acceso".
    await page
      .getByRole('button', {
        name: /Prefiero seguir sin acceso a la red de creadores/,
      })
      .click()

    // B14 — confirmation
    await expect(page.getByTestId('onboarding-start-btn')).toBeVisible()
    await page.getByTestId('onboarding-start-btn').click()

    await expect(page).toHaveURL(/\/campaigns/, { timeout: 15_000 })
  })
})
