import { test } from '../../support/fixtures'
import { BrandOnboardingWizard } from '../../poms/onboarding/brand-wizard.pom'

test.describe('brand onboarding paywall → Stripe Checkout → billing-callback', () => {
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
