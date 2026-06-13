import type { Locator, Page } from '@playwright/test'

import { API_BASE_URL } from '../../support/env'
import { test, expect, getClerkSessionToken } from '../../support/fixtures'

const sidebarSections = [
  'General',
  'Colaboraciones',
  'Redes y tarifas',
  'Portfolio',
  'Billetera',
]

const settingsSections = [
  {
    id: 'general',
    heading: 'General',
    assertPrefilled: async (page: Page) => {
      await expectAtLeastOneInputHasValue([
        page.getByLabel('Nombre completo'),
        page.getByLabel('Teléfono'),
      ])
    },
  },
  {
    id: 'colaboraciones',
    heading: 'Colaboraciones',
    assertPrefilled: async (page: Page) => {
      await expect(
        page
          .locator('[role="checkbox"][aria-checked="true"]')
          .filter({ hasText: /\S/ })
          .first(),
      ).toBeVisible()
    },
  },
  {
    id: 'redes-tarifas',
    heading: 'Redes y tarifas',
    assertPrefilled: async (page: Page) => {
      await expect(
        page
          .getByLabel(/Reel de Instagram|Video de TikTok|Short de YouTube/)
          .first(),
      ).toBeVisible()
    },
  },
  {
    id: 'portfolio',
    heading: 'Portfolio',
    assertPrefilled: async (page: Page) => {
      await expect(page.getByText(/^https?:\/\//).first()).toBeVisible()
    },
  },
  {
    id: 'billetera',
    heading: 'Billetera',
    assertPrefilled: async (page: Page) => {
      await expectDetailValue(page, 'Titular')
    },
  },
]

test.describe('Creator settings — shell', () => {
  test('creator_settings.shell.sidebar_five_sections shows five Spanish sidebar entries in order', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await onboardedCreatorUser.signIn(page)
    await page.goto('/settings?section=general')
    await expect(page.getByRole('heading', { name: 'General' })).toBeVisible()

    await expect(
      page.getByLabel('Secciones de ajustes').getByRole('button'),
    ).toHaveText(sidebarSections)
  })

  test('creator_settings.shell.sections_prefilled shows prefilled data in every section', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await onboardedCreatorUser.signIn(page)
    await seedWalletAndPortfolio(page)

    for (const section of settingsSections) {
      await page.goto(`/settings?section=${section.id}`)
      await expect(
        page.getByRole('heading', { name: section.heading }),
      ).toBeVisible()
      await section.assertPrefilled(page)
    }
  })

  test('creator_settings.shell.brand_access_denied redirects brand and returns 403 from settings API', async ({
    page,
    onboardedBrandUser,
  }) => {
    await onboardedBrandUser.signIn(page)
    await page.goto('/settings?section=general')
    await expect(page).toHaveURL(/\/workspace/)
    await expect(page).not.toHaveURL(/\/settings/)

    const token = await getClerkSessionToken(page)
    const res = await page.request.fetch(
      `${API_BASE_URL}/v1/creators/me/settings`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )
    expect(res.status()).toBe(403)
  })
})

async function expectAtLeastOneInputHasValue(locators: Locator[]) {
  await expect
    .poll(async () => {
      for (const locator of locators) {
        if ((await locator.count()) === 0) continue
        const value = await locator.first().inputValue()
        if (value.trim() !== '') return true
      }
      return false
    })
    .toBe(true)
}

async function expectDetailValue(page: Page, label: string) {
  const value = page
    .locator('dt', { hasText: label })
    .locator('xpath=following-sibling::dd[1]')
  await expect(value).toContainText(/\S/)
}

async function seedWalletAndPortfolio(page: Page) {
  const token = await getClerkSessionToken(page)
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  const payoutRes = await page.request.fetch(
    `${API_BASE_URL}/v1/creators/me/payout-account`,
    {
      method: 'PUT',
      headers,
      data: {
        account_type: 'bank',
        holder_name: 'E2E Creator',
        provider_name: 'Banco Marz',
        identifier: 'e2e-alias-creator-settings',
        country: 'AR',
      },
    },
  )
  expect(payoutRes.ok()).toBe(true)

  const sampleVideosRes = await page.request.fetch(
    `${API_BASE_URL}/v1/creators/me/sample-videos`,
    {
      method: 'PUT',
      headers,
      data: {
        videos: [{ url: 'https://videos.example.com/creator-settings-shell' }],
      },
    },
  )
  expect(sampleVideosRes.ok()).toBe(true)
}
