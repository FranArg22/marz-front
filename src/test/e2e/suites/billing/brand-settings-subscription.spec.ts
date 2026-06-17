import type { Page } from '@playwright/test'

import { test, expect } from '../../support/fixtures'

const GROWTH_USAGE = {
  campaigns_active: { current: 2, limit: 3, available: true },
  creators_active: { current: 3, limit: 15, available: true },
  invitations: {
    current: 47,
    limit: 100,
    cycle_resets_at: '2026-07-17T00:00:00Z',
    available: true,
  },
}

const FREE_USAGE = {
  campaigns_active: { current: 1, limit: 1, available: true },
  creators_active: { current: 7, limit: null, available: true },
  invitations: {
    current: 0,
    limit: 0,
    cycle_resets_at: null,
    available: true,
  },
}

const SCALE_USAGE = {
  campaigns_active: { current: 5, limit: null, available: true },
  creators_active: { current: 12, limit: null, available: true },
  invitations: {
    current: 200,
    limit: null,
    cycle_resets_at: null,
    available: true,
  },
}

const GROWTH_USAGE_DEGRADED = {
  campaigns_active: { current: 2, limit: 3, available: true },
  creators_active: { current: null, limit: 15, available: false },
  invitations: {
    current: 47,
    limit: 100,
    cycle_resets_at: '2026-07-17T00:00:00Z',
    available: true,
  },
}

const BILLING_PLANS = {
  plans: [
    {
      plan: 'starter',
      interval: 'month',
      amount_usd: '19.00',
      stripe_price_id: 'price_starter_month',
    },
    {
      plan: 'growth',
      interval: 'month',
      amount_usd: '49.00',
      stripe_price_id: 'price_growth_month',
    },
    {
      plan: 'scale',
      interval: 'month',
      amount_usd: '149.00',
      stripe_price_id: 'price_scale_month',
    },
    {
      plan: 'starter',
      interval: 'year',
      amount_usd: '190.00',
      stripe_price_id: 'price_starter_year',
    },
    {
      plan: 'growth',
      interval: 'year',
      amount_usd: '490.00',
      stripe_price_id: 'price_growth_year',
    },
    {
      plan: 'scale',
      interval: 'year',
      amount_usd: '1490.00',
      stripe_price_id: 'price_scale_year',
    },
  ],
}

function subscriptionPayload(plan: 'growth' | 'scale') {
  return {
    plan,
    interval: 'month',
    status: 'active',
    in_trial: false,
    trial_ends_at: null,
    current_period_start: '2026-06-17T00:00:00Z',
    current_period_end: '2026-07-17T00:00:00Z',
    cancel_at: null,
    cancel_at_period_end: false,
    subscription_payment_method: {
      stripe_payment_method_id: 'pm_card_visa',
      card_brand: 'visa',
      card_last4: '4242',
    },
    offers_payment_method: {
      stripe_payment_method_id: 'pm_card_visa',
      card_brand: 'visa',
      card_last4: '4242',
    },
    same_payment_method: true,
    next_invoice_amount_usd: plan === 'growth' ? '49.00' : '199.00',
    next_invoice_at: '2026-07-17T00:00:00Z',
    days_until_trial_ends: null,
    days_until_downgrade: null,
  }
}

function mockGrowthSubscription(page: Page) {
  return mockPaidSubscription(page, 'growth')
}

function mockScaleSubscription(page: Page) {
  return mockPaidSubscription(page, 'scale')
}

function mockPaidSubscription(page: Page, plan: 'growth' | 'scale') {
  return page.route(/\/v1\/billing\/subscription$/, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback()
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(subscriptionPayload(plan)),
    })
  })
}

function mockFreeSubscription(page: Page) {
  return page.route(/\/v1\/billing\/subscription$/, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback()
      return
    }

    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'subscription_not_found',
        message: 'Subscription not found',
      }),
    })
  })
}

function mockPlanUsage(page: Page, usage: object) {
  return page.route(/\/v1\/billing\/plan-usage$/, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback()
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(usage),
    })
  })
}

function mockPaymentMethods(page: Page) {
  return page.route(/\/v1\/billing\/payment-methods$/, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback()
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        payment_methods: [
          {
            stripe_payment_method_id: 'pm_card_visa',
            card_brand: 'visa',
            card_last4: '4242',
            exp_month: 12,
            exp_year: 2034,
            is_subscription_default: true,
            is_offers_default: true,
          },
        ],
        same_payment_method: true,
      }),
    })
  })
}

function mockNoPaymentMethods(page: Page) {
  return page.route(/\/v1\/billing\/payment-methods$/, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback()
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ payment_methods: [], same_payment_method: true }),
    })
  })
}

function mockBillingPlans(page: Page) {
  return page.route(/\/v1\/billing\/plans$/, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback()
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(BILLING_PLANS),
    })
  })
}

async function openSubscriptionSettings(
  page: Page,
  onboardedBrandUser: { signIn(page: Page): Promise<void> },
) {
  await onboardedBrandUser.signIn(page)
  await page.goto('/ajustes/suscripcion')
}

test.describe('/ajustes/suscripcion - plan usage cards', () => {
  test('brand_settings.subscription.paid_plan_summary', async ({
    page,
    onboardedBrandUser,
  }) => {
    await mockGrowthSubscription(page)
    await mockPaymentMethods(page)
    await mockPlanUsage(page, GROWTH_USAGE)

    await openSubscriptionSettings(page, onboardedBrandUser)

    await expect(page.getByText(/Growth/i)).toBeVisible()
    await expect(page.getByText(/Visa •••• 4242/i)).toBeVisible()

    const manageButton = page.getByTestId(
      'settings.subscription.manage_stripe_button',
    )
    await expect(manageButton).toBeVisible()
    await expect(manageButton).toBeEnabled()
    await expect(page.getByTestId('plan-usage.campaigns')).toBeVisible()
  })

  test('brand_settings.subscription.plan_usage_card_paid', async ({
    page,
    onboardedBrandUser,
  }) => {
    await mockGrowthSubscription(page)
    await mockPaymentMethods(page)
    await mockPlanUsage(page, GROWTH_USAGE)

    await openSubscriptionSettings(page, onboardedBrandUser)

    const campaigns = page.getByTestId('plan-usage.campaigns')
    const creators = page.getByTestId('plan-usage.creators')
    const invitations = page.getByTestId('plan-usage.invitations')

    await expect(campaigns).toContainText(/2\s+de\s+3/)
    await expect(creators).toContainText(/3\s+de\s+15/)
    await expect(invitations).toContainText(/47\s+de\s+100/)
    await expect(invitations).toContainText(/Reinicia/i)
    await expect(campaigns.getByRole('progressbar')).toBeVisible()
    await expect(creators.getByRole('progressbar')).toBeVisible()
  })

  test('brand_settings.subscription.free_cta_visible', async ({
    page,
    onboardedBrandUser,
  }) => {
    await mockFreeSubscription(page)
    await mockNoPaymentMethods(page)
    await mockPlanUsage(page, FREE_USAGE)

    await openSubscriptionSettings(page, onboardedBrandUser)

    await expect(page.getByText(/Plan gratuito/i)).toBeVisible()
    const upgradeButton = page.getByTestId(
      'settings.subscription.upgrade_cta_button',
    )
    await expect(upgradeButton).toBeVisible()
    await expect(upgradeButton).toBeEnabled()
    await expect(
      page.getByTestId('settings.subscription.manage_stripe_button'),
    ).toHaveCount(0)
  })

  test('brand_settings.subscription.plan_usage_card_free', async ({
    page,
    onboardedBrandUser,
  }) => {
    await mockFreeSubscription(page)
    await mockNoPaymentMethods(page)
    await mockPlanUsage(page, FREE_USAGE)

    await openSubscriptionSettings(page, onboardedBrandUser)

    const campaigns = page.getByTestId('plan-usage.campaigns')
    const creators = page.getByTestId('plan-usage.creators')
    const invitations = page.getByTestId('plan-usage.invitations')

    await expect(campaigns).toContainText(/1\s+de\s+1/)
    await expect(creators).toContainText(/7\s+de\s+∞/)
    await expect(invitations).toContainText(/N\/A/)
    await expect(invitations.getByRole('progressbar')).toHaveCount(0)
    await expect(creators.getByRole('progressbar')).toHaveCount(0)
  })

  test('brand_settings.subscription.plan_usage_card_scale', async ({
    page,
    onboardedBrandUser,
  }) => {
    await mockScaleSubscription(page)
    await mockPaymentMethods(page)
    await mockPlanUsage(page, SCALE_USAGE)

    await openSubscriptionSettings(page, onboardedBrandUser)

    const campaigns = page.getByTestId('plan-usage.campaigns')
    const creators = page.getByTestId('plan-usage.creators')
    const invitations = page.getByTestId('plan-usage.invitations')

    await expect(campaigns).toContainText(/5\s+de\s+∞/)
    await expect(creators).toContainText(/12\s+de\s+∞/)
    await expect(invitations).toContainText(/200\s+de\s+∞/)
    await expect(campaigns.getByRole('progressbar')).toHaveCount(0)
    await expect(creators.getByRole('progressbar')).toHaveCount(0)
    await expect(invitations.getByRole('progressbar')).toHaveCount(0)
  })

  test('brand_settings.subscription.plan_usage_partial_degradation', async ({
    page,
    onboardedBrandUser,
  }) => {
    await mockGrowthSubscription(page)
    await mockPaymentMethods(page)
    await mockPlanUsage(page, GROWTH_USAGE_DEGRADED)

    await openSubscriptionSettings(page, onboardedBrandUser)

    await expect(page.getByTestId('plan-usage.campaigns')).toContainText(
      /2\s+de\s+3/,
    )
    await expect(page.getByTestId('plan-usage.creators')).toContainText(
      /No disponible/i,
    )
    await expect(page.getByTestId('plan-usage.invitations')).toContainText(
      /47\s+de\s+100/,
    )
  })

  test('brand_settings.subscription.stripe_portal_redirect', async ({
    page,
    onboardedBrandUser,
  }) => {
    let portalSessionsCalls = 0
    const portalRequestPromise = page.waitForRequest(
      /\/v1\/billing\/portal-sessions$/,
    )
    const stripeNavigationPromise = page.waitForRequest(
      'https://billing.stripe.com/session/test',
    )

    await mockGrowthSubscription(page)
    await mockPaymentMethods(page)
    await mockPlanUsage(page, GROWTH_USAGE)
    await page.route(/\/v1\/billing\/portal-sessions$/, async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fallback()
        return
      }

      portalSessionsCalls += 1
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          portal_url: 'https://billing.stripe.com/session/test',
        }),
      })
    })
    await page.route('https://billing.stripe.com/**', async (route) => {
      await route.abort()
    })

    await openSubscriptionSettings(page, onboardedBrandUser)
    await page
      .getByTestId('settings.subscription.manage_stripe_button')
      .click()

    const portalRequest = await portalRequestPromise
    const stripeNavigation = await stripeNavigationPromise

    expect(portalRequest.method()).toBe('POST')
    expect(portalSessionsCalls).toBe(1)
    expect(stripeNavigation.url()).toBe(
      'https://billing.stripe.com/session/test',
    )
  })

  test('brand_settings.subscription.free_upgrade_modal_open', async ({
    page,
    onboardedBrandUser,
  }) => {
    await mockFreeSubscription(page)
    await mockNoPaymentMethods(page)
    await mockPlanUsage(page, FREE_USAGE)
    await mockBillingPlans(page)

    await openSubscriptionSettings(page, onboardedBrandUser)
    await page
      .getByTestId('settings.subscription.upgrade_cta_button')
      .click()

    const dialog = page.getByRole('dialog', { name: /Mejorar plan/i })
    const plans = page.getByRole('radiogroup', { name: /Planes/i })

    await expect(dialog).toBeVisible()
    await expect(plans.getByRole('radio')).toHaveCount(3)
    await expect(page.getByText('Starter')).toBeVisible()
    await expect(page.getByText('Growth')).toBeVisible()
    await expect(page.getByText('Scale')).toBeVisible()

    await page.keyboard.press('Escape')

    await expect(dialog).toHaveCount(0)
  })

  test('brand_settings.subscription.free_upgrade_checkout_redirect', async ({
    page,
    onboardedBrandUser,
  }) => {
    let checkoutRequestBody: unknown
    let checkoutIdempotencyKey: string | undefined
    const checkoutRequestPromise = page.waitForRequest(
      /\/v1\/billing\/checkout-sessions$/,
    )
    const stripeNavigationPromise = page.waitForRequest(
      'https://checkout.stripe.com/c/pay/test',
    )

    await mockFreeSubscription(page)
    await mockNoPaymentMethods(page)
    await mockPlanUsage(page, FREE_USAGE)
    await mockBillingPlans(page)
    await page.route(/\/v1\/billing\/checkout-sessions$/, async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fallback()
        return
      }

      checkoutRequestBody = route.request().postDataJSON()
      checkoutIdempotencyKey = route.request().headers()['idempotency-key']
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          checkout_url: 'https://checkout.stripe.com/c/pay/test',
        }),
      })
    })
    await page.route('https://checkout.stripe.com/**', async (route) => {
      await route.abort()
    })

    await openSubscriptionSettings(page, onboardedBrandUser)
    await page
      .getByTestId('settings.subscription.upgrade_cta_button')
      .click()
    await page.getByRole('radio', { name: 'Growth' }).click({ force: true })
    await page
      .getByRole('button', { name: /Probar 7 días gratis/i })
      .nth(1)
      .click()

    const checkoutRequest = await checkoutRequestPromise
    const stripeNavigation = await stripeNavigationPromise

    expect(checkoutRequest.method()).toBe('POST')
    expect(checkoutRequestBody).toMatchObject({
      plan: 'growth',
      interval: 'monthly',
      success_url: expect.stringMatching(/\/ajustes\/suscripcion$/),
      cancel_url: expect.stringMatching(/\/ajustes\/suscripcion$/),
    })
    expect(checkoutIdempotencyKey).toEqual(expect.any(String))
    expect(checkoutIdempotencyKey).not.toBe('')
    expect(stripeNavigation.url()).toBe(
      'https://checkout.stripe.com/c/pay/test',
    )
  })

  test('brand_settings.subscription.checkout_already_subscribed', async ({
    page,
    onboardedBrandUser,
  }) => {
    await mockGrowthSubscription(page)
    await mockPaymentMethods(page)
    await mockPlanUsage(page, GROWTH_USAGE)
    await page.route(/\/v1\/billing\/checkout-sessions$/, async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fallback()
        return
      }

      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'already_subscribed',
          message: 'Already subscribed',
        }),
      })
    })

    await openSubscriptionSettings(page, onboardedBrandUser)

    const result = await page.evaluate(async () => {
      const res = await fetch('/v1/billing/checkout-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': 'test-key',
        },
        body: JSON.stringify({
          plan: 'growth',
          interval: 'monthly',
          success_url: '/',
          cancel_url: '/',
        }),
      })
      return { status: res.status }
    })

    expect(result.status).toBe(403)
  })

  test('brand_settings.subscription.checkout_idempotent_replay', async ({
    page,
    onboardedBrandUser,
  }) => {
    await mockFreeSubscription(page)
    await mockNoPaymentMethods(page)
    await mockPlanUsage(page, FREE_USAGE)
    await mockBillingPlans(page)
    await page.route(/\/v1\/billing\/checkout-sessions$/, async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fallback()
        return
      }

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          checkout_url: 'https://checkout.stripe.com/c/pay/test',
        }),
      })
    })

    await openSubscriptionSettings(page, onboardedBrandUser)

    const results = await page.evaluate(async () => {
      const body = JSON.stringify({
        plan: 'growth',
        interval: 'monthly',
        success_url: '/',
        cancel_url: '/',
      })
      const requestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': 'same-test-key',
        },
        body,
      }
      const first = await fetch('/v1/billing/checkout-sessions', requestInit)
      const second = await fetch('/v1/billing/checkout-sessions', requestInit)

      return [
        { status: first.status, body: await first.json() },
        { status: second.status, body: await second.json() },
      ]
    })

    expect(results[0]).toEqual({
      status: 201,
      body: { checkout_url: 'https://checkout.stripe.com/c/pay/test' },
    })
    expect(results[1]).toEqual(results[0])
  })

  test.skip(
    'brand_settings.subscription.invitations_cycle_reset (ESC-22)',
    async () => {
      // TODO: requiere control de reloj de la app (Clock.Set(t)).
      // Cuando el harness soporte clock injection:
      // 1. Fijar reloj a 2026-06-16 (post-mesario del 15)
      // 2. Mockear plan-usage con current: 5, limit: 100, cycle_resets_at: '2026-07-15T00:00:00Z'
      // 3. Verificar que la mini-card muestra "5 de 100" y reinicio "15/07/2026"
    },
  )

  test.skip(
    'brand_settings.subscription.cycle_resets_at_clamp_end_of_month (ESC-23)',
    async () => {
      // TODO: requiere control de reloj de la app.
      // Cuando el harness soporte clock injection:
      // 1. Fijar reloj a 2026-02-10
      // 2. Mockear plan-usage con cycle_resets_at: '2026-02-28T00:00:00Z'
      // 3. Verificar que la fecha mostrada es 28/02/2026 (no 31)
      // Mientras tanto: este escenario se cubre en el test unitario de PlanUsageCard.
    },
  )
})
