import type { Page } from '@playwright/test'

import { API_BASE_URL } from '../../support/env'
import { test, expect, getClerkSessionToken } from '../../support/fixtures'

const ENDPOINTS: Array<{ method: string; path: string }> = [
  { method: 'GET', path: '/v1/creators/me/settings' },
  { method: 'PATCH', path: '/v1/creators/me/profile/contact' },
  { method: 'PUT', path: '/v1/creators/me/avatar' },
  { method: 'PATCH', path: '/v1/creators/me/profile/collaboration' },
  { method: 'PUT', path: '/v1/creators/me/rates' },
  { method: 'PUT', path: '/v1/creators/me/sample-videos' },
  { method: 'GET', path: '/v1/creators/me/payout-account' },
  { method: 'PUT', path: '/v1/creators/me/payout-account' },
]

test.describe('Creator settings — api', () => {
  test('creator_settings.api.auth_matrix rejects requests without token', async ({
    page,
  }) => {
    await expectEndpointStatuses(page, 401)
  })

  test('creator_settings.api.auth_matrix rejects brand tokens', async ({
    page,
    onboardedBrandUser,
  }) => {
    await onboardedBrandUser.signIn(page)
    const token = await getClerkSessionToken(page)

    await expectEndpointStatuses(page, 403, token)
  })

  test('creator_settings.api.auth_matrix rejects non-onboarded creator tokens', async ({
    page,
    creatorOnboardingUser,
  }) => {
    await creatorOnboardingUser.signIn(page)
    const token = await getClerkSessionToken(page)

    await expectEndpointStatuses(page, 403, token)
  })
})

async function expectEndpointStatuses(
  page: Page,
  expectedStatus: number,
  token?: string,
) {
  for (const endpoint of ENDPOINTS) {
    const res = await callApi(page, endpoint.method, endpoint.path, token)
    expect(res.status(), `${endpoint.method} ${endpoint.path}`).toBe(
      expectedStatus,
    )
  }
}

async function callApi(
  page: Page,
  method: string,
  path: string,
  token?: string,
) {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  return page.request.fetch(`${API_BASE_URL}${path}`, { method, headers })
}
