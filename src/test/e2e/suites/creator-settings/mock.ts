import type { Page } from '@playwright/test'

import type { CreatorSettingsResponse } from '#/shared/api/generated/model'

type PayoutAccount = NonNullable<
  CreatorSettingsMockState['payoutAccount']
>

export interface CreatorSettingsMockState {
  settings: CreatorSettingsResponse
  payoutAccount: PayoutAccount | null
}

export function createCreatorSettingsMockState(
  overrides?: Partial<CreatorSettingsMockState>,
): CreatorSettingsMockState {
  return {
    settings: {
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
    payoutAccount: {
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
    ...overrides,
  }
}

export async function installCreatorSettingsMock(
  page: Page,
  state: CreatorSettingsMockState = createCreatorSettingsMockState(),
) {
  await page.route('**/v1/creators/me/settings', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue()
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(state.settings),
    })
  })

  await page.route('**/v1/creators/me/payout-account', async (route) => {
    const method = route.request().method()
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ account: state.payoutAccount }),
      })
      return
    }

    if (method === 'PUT') {
      const body = safeJson(route.request().postData())
      if (body) {
        state.payoutAccount = {
          ...state.payoutAccount,
          ...body,
          status: 'active',
          updated_at: '2026-01-01T00:00:00.000Z',
        }
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ account: state.payoutAccount }),
      })
      return
    }

    await route.continue()
  })

  await page.route('**/v1/creators/me/profile/contact', async (route) => {
    if (route.request().method() !== 'PATCH') {
      await route.continue()
      return
    }

    const body = safeJson(route.request().postData())
    if (body) {
      state.settings.contact = { ...state.settings.contact, ...body }
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(state.settings),
    })
  })

  await page.route('**/v1/creators/me/profile/collaboration', async (route) => {
    if (route.request().method() !== 'PATCH') {
      await route.continue()
      return
    }

    const body = safeJson(route.request().postData())
    if (body) {
      state.settings.collaboration = {
        ...state.settings.collaboration,
        ...body,
      }
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(state.settings),
    })
  })

  await page.route('**/v1/creators/me/rates', async (route) => {
    if (route.request().method() !== 'PUT') {
      await route.continue()
      return
    }

    const body = safeJson(route.request().postData())
    if (body) {
      if (Array.isArray(body.channel_rates)) {
        for (const rate of body.channel_rates) {
          const channel = state.settings.channels.find(
            (item) => item.channel_id === rate.channel_id,
          )
          if (channel) {
            channel.rates = [
              {
                format: rate.format,
                amount: rate.amount,
                currency: 'USD',
              },
            ]
          }
        }
      }
      if (typeof body.ugc_rate_amount === 'string') {
        state.settings.ugc_rate = {
          amount: body.ugc_rate_amount,
          currency: 'USD',
        }
      }
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(state.settings),
    })
  })

  await page.route('**/v1/creators/me/sample-videos', async (route) => {
    if (route.request().method() !== 'PUT') {
      await route.continue()
      return
    }

    const body = safeJson(route.request().postData())
    if (body && Array.isArray(body.videos)) {
      state.settings.sample_videos = body.videos
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(state.settings),
    })
  })

  await page.route('**/v1/creators/me/avatar', async (route) => {
    if (route.request().method() !== 'PUT') {
      await route.continue()
      return
    }

    state.settings.avatar_url =
      state.settings.avatar_url || 'https://images.example.com/avatar.png'
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ avatar_url: state.settings.avatar_url }),
    })
  })
}

function safeJson(body: string | null): Record<string, unknown> | null {
  if (!body) return null
  try {
    const parsed = JSON.parse(body)
    return typeof parsed === 'object' && parsed !== null ? parsed : null
  } catch {
    return null
  }
}
