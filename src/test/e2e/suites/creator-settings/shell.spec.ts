import type { Locator, Page } from '@playwright/test'

import { API_BASE_URL } from '../../support/env'
import { test, expect, getClerkSessionToken } from '../../support/fixtures'
import type { CreatorSettingsResponse } from '#/shared/api/generated/model'

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
      await expect(page.getByLabel('URL del video 1')).toHaveValue(
        /^https?:\/\//,
      )
    },
  },
  {
    id: 'billetera',
    heading: 'Billetera',
    assertPrefilled: async (page: Page) => {
      await expect(page.getByText('Cuenta cargada', { exact: true })).toBeVisible()
      await expect(page.getByText('E2E Creator')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Editar cuenta' })).toBeVisible()
    },
  },
]

test.describe('Creator settings — shell', () => {
  test('creator_settings.shell.sidebar_five_sections shows five Spanish sidebar entries in order', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await onboardedCreatorUser.signIn(page)
    await mockCreatorSettings(page)
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
    await mockCreatorSettings(page, {
      contact: {
        full_name: 'E2E Creator',
        email: 'creator@example.com',
        phone_e164: '+5491123456789',
        birthday: '1994-05-12',
        country: 'AR',
        city: 'Buenos Aires',
        shipping_address: 'Avenida Siempre Viva 742',
      },
      avatar_url: 'https://images.example.com/avatar.png',
      collaboration: {
        creator_kinds: ['influencer', 'ugc'],
        niches: ['beauty', 'fashion'],
        content_types: ['reels', 'stories'],
        languages: ['es', 'en'],
        barter_preference: true,
      },
      channels: [
        {
          channel_id: 'ig-1',
          platform: 'instagram',
          handle: 'e2e.creator',
          external_url: 'https://instagram.com/e2e.creator',
          followers: 12345,
          rates: [{ format: 'ig_reel', amount: '150.00', currency: 'USD' }],
        },
        {
          channel_id: 'tt-1',
          platform: 'tiktok',
          handle: 'e2e.creator.tt',
          external_url: 'https://tiktok.com/@e2e.creator.tt',
          followers: 54321,
          rates: [
            { format: 'tiktok_video', amount: '175.00', currency: 'USD' },
          ],
        },
      ],
      ugc_rate: { amount: '200.00', currency: 'USD' },
      sample_videos: [
        { url: 'https://videos.example.com/creator-settings-shell-1' },
        { url: 'https://videos.example.com/creator-settings-shell-2' },
      ],
    })

    for (const section of settingsSections) {
      await page.goto(`/settings?section=${section.id}`)
      await expect(page.locator('main h1', { hasText: section.heading })).toBeVisible()
      await section.assertPrefilled(page)
    }
  })

  test('creator_settings.shell.brand_access_denied redirects brand and returns 403 from settings API', async ({
    page,
    onboardedBrandUser,
  }) => {
    await onboardedBrandUser.signIn(page)
    const token = await getClerkSessionToken(page)
    await page.goto('/settings?section=general')
    await expect(page).toHaveURL(/\/workspace/)
    await expect(page).not.toHaveURL(/\/settings/)

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

async function mockCreatorSettings(
  page: Page,
  data: CreatorSettingsResponse = {
    contact: {
      full_name: 'E2E Creator',
      email: 'creator@example.com',
      phone_e164: '+5491123456789',
      birthday: '1994-05-12',
      country: 'AR',
      city: 'Buenos Aires',
      shipping_address: 'Avenida Siempre Viva 742',
    },
    avatar_url: 'https://images.example.com/avatar.png',
    collaboration: {
      creator_kinds: ['influencer', 'ugc'],
      niches: ['beauty', 'fashion'],
      content_types: ['reels', 'stories'],
      languages: ['es', 'en'],
      barter_preference: true,
    },
    channels: [
      {
        channel_id: 'ig-1',
        platform: 'instagram',
        handle: 'e2e.creator',
        external_url: 'https://instagram.com/e2e.creator',
        followers: 12345,
        rates: [{ format: 'ig_reel', amount: '150.00', currency: 'USD' }],
      },
      {
        channel_id: 'tt-1',
        platform: 'tiktok',
        handle: 'e2e.creator.tt',
        external_url: 'https://tiktok.com/@e2e.creator.tt',
        followers: 54321,
        rates: [
          { format: 'tiktok_video', amount: '175.00', currency: 'USD' },
        ],
      },
    ],
    ugc_rate: { amount: '200.00', currency: 'USD' },
    sample_videos: [
      { url: 'https://videos.example.com/creator-settings-shell-1' },
      { url: 'https://videos.example.com/creator-settings-shell-2' },
    ],
  },
) {
  await page.route('**/v1/creators/me/settings', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue()
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(data),
    })
  })

  await page.route('**/v1/creators/me/payout-account', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue()
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        account: {
          id: 'payout-1',
          type: 'ach',
          name: 'Cuenta principal',
          account_holder_name: 'E2E Creator',
          account_number: '12345678',
          account_type: 'checking',
          routing_number: '021000021',
          address: '1 Main St, New York',
          status: 'active',
          updated_at: '2026-01-01T00:00:00.000Z',
        },
      }),
    })
  })
}
