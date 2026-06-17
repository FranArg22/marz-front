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
})
