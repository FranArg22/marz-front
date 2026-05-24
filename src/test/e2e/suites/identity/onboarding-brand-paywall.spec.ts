import { test, expect } from '../../support/fixtures'
import { BrandOnboardingWizard } from '../../poms/onboarding/brand-wizard.pom'

const STRIPE_TEST_MODE_ENABLED = process.env.STRIPE_TEST_MODE === '1'

test.describe('brand onboarding paywall → Stripe Checkout → billing-callback', () => {
  test('brand pays starter monthly and lands on confirmation step', async ({
    page,
    brandOnboardingUser,
  }) => {
    test.skip(
      !STRIPE_TEST_MODE_ENABLED,
      'Requires backend dev with Stripe test mode configured (STRIPE_TEST_MODE=1). ' +
        'See marz-docs FEAT-025 stripe-account-setup.md.',
    )
    test.setTimeout(120_000)

    await brandOnboardingUser.signIn(page)

    const wizard = new BrandOnboardingWizard(page)
    await page.goto('/onboarding/brand/paywall')
    await wizard.expectStep(13)

    await page.getByRole('tab', { name: 'Mensual' }).click()

    await page
      .getByRole('button', { name: /probar 7 días gratis/i })
      .first()
      .click()

    await wizard.expectStep(14)

    const completeRequest = page.waitForRequest((request) => {
      if (!request.url().includes('/v1/onboarding/brand:complete')) return false
      const payload = request.postDataJSON() as {
        billing_intent?: {
          plan?: string
          interval?: string
          success_url?: string
          cancel_url?: string
        }
      }
      return (
        request.method() === 'POST' &&
        payload.billing_intent?.plan === 'starter' &&
        payload.billing_intent.interval === 'month' &&
        payload.billing_intent.success_url?.endsWith(
          '/onboarding/brand/billing-callback?checkout=success',
        ) === true &&
        payload.billing_intent.cancel_url?.endsWith(
          '/onboarding/brand/billing-callback?checkout=cancel',
        ) === true
      )
    })

    await page.getByTestId('onboarding-start-btn').click()
    const request = await completeRequest
    const response = await request.response()
    const body = (await response?.json()) as { checkout_url?: string | null }
    expect(body.checkout_url).toMatch(/^https:\/\/checkout\.stripe\.com\//)
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30_000 })

    const cardNumber = page.getByLabel(/Card number|Número de tarjeta/i)
    await cardNumber.waitFor({ state: 'visible', timeout: 30_000 })
    await cardNumber.fill('4242 4242 4242 4242')
    await page.getByLabel(/Expiration|Vencimiento|MM \/ AA/i).fill('12 / 34')
    await page.getByLabel(/CVC|CVV/i).fill('123')
    await page.getByLabel(/Cardholder name|Nombre del titular/i).fill('Test User')

    await page
      .getByRole('button', { name: /Subscribe|Pay|Suscribirse|Pagar/i })
      .click()

    await page.waitForURL(/\/onboarding\/brand\/billing-callback/, {
      timeout: 60_000,
    })
    await expect(page.getByText('Activando tu plan…')).toBeVisible()

    await page.waitForURL(/\/onboarding\/brand\/confirmation/, {
      timeout: 60_000,
    })
    await wizard.expectStep(14)
  })

  test('cancelled checkout returns to paywall', async ({
    page,
    brandOnboardingUser,
  }) => {
    await brandOnboardingUser.signIn(page)
    await page.goto('/onboarding/brand')

    await page.goto('/onboarding/brand/billing-callback?checkout=cancel')

    await page.waitForURL(/\/onboarding\/brand\/paywall/, { timeout: 15_000 })
    const wizard = new BrandOnboardingWizard(page)
    await wizard.expectStep(13)
  })

  test('invalid checkout search param redirects to paywall', async ({
    page,
    brandOnboardingUser,
  }) => {
    await brandOnboardingUser.signIn(page)
    await page.goto('/onboarding/brand')

    await page.goto('/onboarding/brand/billing-callback?checkout=bogus')

    await page.waitForURL(/\/onboarding\/brand\/paywall/, { timeout: 15_000 })
  })
})
