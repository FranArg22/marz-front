import { test, expect } from '../../support/fixtures'
import { BrandOnboardingWizard } from '../../poms/onboarding/brand-wizard.pom'

const STRIPE_TEST_MODE_ENABLED = process.env.STRIPE_TEST_MODE === '1'

test.describe('/billing — active subscription manage portal flow', () => {
  test('brand with active subscription manages plan via Stripe portal', async ({
    page,
    brandOnboardingUser,
  }) => {
    test.skip(
      !STRIPE_TEST_MODE_ENABLED,
      'Requires backend dev with Stripe test mode configured (STRIPE_TEST_MODE=1).',
    )
    test.setTimeout(180_000)

    await brandOnboardingUser.signIn(page)

    const wizard = new BrandOnboardingWizard(page)
    await page.goto('/onboarding/brand/paywall')
    await wizard.expectStep(13)

    await page.getByRole('tab', { name: 'Mensual' }).click()
    await page.getByRole('radio', { name: /starter/i }).click()

    const continueButton = page.getByRole('button', {
      name: /Continuar con plan pago/,
    })
    await expect(continueButton).toBeEnabled()

    await Promise.all([
      page.waitForURL(/checkout\.stripe\.com/, { timeout: 30_000 }),
      continueButton.click(),
    ])

    const cardNumber = page.getByLabel(/Card number|Número de tarjeta/i)
    await cardNumber.waitFor({ state: 'visible', timeout: 30_000 })
    await cardNumber.fill('4242 4242 4242 4242')
    await page.getByLabel(/Expiration|Vencimiento|MM \/ AA/i).fill('12 / 34')
    await page.getByLabel(/CVC|CVV/i).fill('123')
    await page
      .getByLabel(/Cardholder name|Nombre del titular/i)
      .fill('Test User')

    await page
      .getByRole('button', { name: /Subscribe|Pay|Suscribirse|Pagar/i })
      .click()

    await page.waitForURL(/\/onboarding\/brand\/confirmation/, {
      timeout: 60_000,
    })

    await page.goto('/billing')
    await expect(
      page.getByRole('heading', {
        name: /(suscripción está activa|período de prueba)/i,
      }),
    ).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/Starter \(mensual\)/i)).toBeVisible()
    await expect(page.getByText(/visa •••• 4242/i)).toBeVisible()
    await expect(
      page.getByText(/Se usa para suscripción y pagos a creators/i),
    ).toBeVisible()

    // ESC-1: bloque combinado de método de pago
    const portalBlock = page.getByTestId('billing.page.active_subscription_portal')
    await expect(portalBlock).toBeVisible()
    await expect(portalBlock.getByText(/visa •••• 4242/i)).toBeVisible()
    await expect(
      portalBlock.getByText(/Se usa para suscripción y pagos a creators/i),
    ).toBeVisible()

    await Promise.all([
      page.waitForURL(/billing\.stripe\.com/, { timeout: 30_000 }),
      portalBlock.getByRole('button', { name: /Gestionar.*en Stripe/i }).click(),
    ])
  })
})
