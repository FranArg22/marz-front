import { test, expect } from '../../support/fixtures'
import { API_BASE_URL } from '../../support/env'

const STRIPE_TEST_MODE_ENABLED = process.env.STRIPE_TEST_MODE === '1'
const STARTER_USAGE = {
  campaigns_active: { current: 0, limit: 1, available: true },
  creators_active: { current: 0, limit: 5, available: true },
  invitations: {
    current: 0,
    limit: 25,
    cycle_resets_at: '2026-07-17T00:00:00Z',
    available: true,
  },
}

test.describe('/ajustes/suscripcion — active subscription manage portal flow', () => {
  test('brand with active subscription manages plan via Stripe portal', async ({
    page,
    brandOnboardingUser,
  }) => {
    test.skip(
      !STRIPE_TEST_MODE_ENABLED,
      'Requires backend dev with Stripe test mode configured (STRIPE_TEST_MODE=1).',
    )
    test.skip(
      !process.env.MARZ_TEST_SECRET,
      'Requires Test API secret to seed a real Stripe test subscription.',
    )
    test.setTimeout(180_000)

    const me = await brandOnboardingUser.onboardFull('brand')
    const brandWorkspaceId = me.brand_workspace?.id
    expect(brandWorkspaceId).toBeTruthy()

    const seedResponse = await page.request.post(
      `${API_BASE_URL}/v1/test/billing/subscription`,
      {
        headers: {
          'X-Test-Secret': process.env.MARZ_TEST_SECRET ?? '',
        },
        data: {
          brand_workspace_id: brandWorkspaceId,
          email: brandOnboardingUser.email,
          plan: 'starter',
          interval: 'month',
        },
      },
    )
    expect(
      seedResponse.ok(),
      `POST /v1/test/billing/subscription failed: ${seedResponse.status()} ${await seedResponse.text()}`,
    ).toBe(true)

    await page.route('**/v1/billing/plan-usage', (route) =>
      route.fulfill({ status: 200, json: STARTER_USAGE }),
    )
    await brandOnboardingUser.signIn(page)
    await page.goto('/ajustes/suscripcion')
    await expect(page.getByRole('main')).toBeVisible({
      timeout: 15_000,
    })

    await expect(
      page.getByRole('heading', {
        name: /(suscripción está activa|período de prueba)/i,
      }),
    ).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/Starter \(mensual\)/i)).toBeVisible()
    await expect(page.getByText(/visa •••• 4242/i)).toBeVisible()
    await expect(page.getByText('Métodos de pago', { exact: true })).toBeVisible()
    await expect(
      page.getByText(/El mismo que la suscripción/i),
    ).toBeVisible()

    await Promise.all([
      page.waitForURL(/billing\.stripe\.com/, { timeout: 30_000 }),
      page.getByRole('button', { name: /Gestionar.*en Stripe/i }).click(),
    ])
  })
})
