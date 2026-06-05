import { test, expect } from '../../support/fixtures'

test.describe('Campaign list quota gating', () => {
  test('disables Nueva campaña when campaign quota is exhausted', async ({
    page,
    onboardedBrandUser,
  }) => {
    await page.route(/\/v1\/campaigns(?:\?.*)?$/, async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue()
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [],
          next_cursor: null,
        }),
      })
    })

    await page.route(
      /\/v1\/brand-workspaces\/[^/]+\/campaign-quota$/,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            plan: 'Starter',
            subscription_status: 'active',
            max_active_campaigns: 1,
            current_active_count: 1,
            can_create_more: false,
            publish_to_board: true,
          }),
        })
      },
    )

    await onboardedBrandUser.signIn(page)
    await page.goto('/campaigns')

    await expect(page).toHaveURL(/\/campaigns/)
    await expect(
      page.getByRole('button', { name: 'Nueva campaña' }),
    ).toBeDisabled()
    await expect(page.getByRole('link', { name: 'Ver planes' })).toHaveAttribute(
      'href',
      '/billing',
    )
  })
})
