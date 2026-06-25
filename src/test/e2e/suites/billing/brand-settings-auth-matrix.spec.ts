import type { Page, TestInfo } from '@playwright/test'
import { createHash } from 'node:crypto'

import {
  test,
  expect,
  TestUser,
  getClerkSessionToken,
} from '../../support/fixtures'
import { API_BASE_URL, E2E_RUN_ID } from '../../support/env'

// RAFITA:BLOCKER: No pude verificar 401 vs 302 porque http://localhost:35077 no acepta conexiones en este entorno.

type AuthMatrixRequest = {
  method: 'GET' | 'PATCH' | 'POST'
  url: string
  body?: unknown
}

type AuthMatrixResult = {
  url: string
  method: AuthMatrixRequest['method']
  status: number
}

const AUTH_MATRIX_REQUESTS: AuthMatrixRequest[] = [
  { method: 'GET', url: '/v1/brand-workspaces/me/settings' },
  { method: 'PATCH', url: '/v1/brand-workspaces/me/settings', body: {} },
  {
    method: 'POST',
    url: '/v1/brand-workspaces/me/logo:presign',
    body: { content_type: 'image/png', content_length: 1024 },
  },
  { method: 'GET', url: '/v1/billing/plan-usage' },
  {
    method: 'POST',
    url: '/v1/billing/checkout-sessions',
    body: {
      plan: 'growth',
      interval: 'monthly',
      success_url: '/',
      cancel_url: '/',
    },
  },
]

function makeBrandOwner(testInfo: TestInfo) {
  const hash = createHash('sha1')
    .update(`${testInfo.testId}:brand-owner`)
    .digest('hex')
    .slice(0, 8)
  const key = `${testInfo.workerIndex}.${E2E_RUN_ID}.${hash}`

  return new TestUser(
    `e2e_feat039_brand_${key}`,
    `e2e.feat039.brand.${key}+clerk_test@example.com`,
    'E2E FEAT039 Brand',
  )
}

async function requestAuthMatrix(
  page: Page,
  token?: string,
): Promise<AuthMatrixResult[]> {
  return Promise.all(
    AUTH_MATRIX_REQUESTS.map(async ({ method, url, body }) => {
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }

      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      if (method === 'POST') {
        headers['Idempotency-Key'] = `e2e-auth-matrix-${crypto.randomUUID()}`
      }

      const res = await page.request.fetch(`${API_BASE_URL}${url}`, {
        method,
        headers,
        ...(body === undefined ? {} : { data: body }),
      })

      return { url, method, status: res.status() }
    }),
  )
}

function findStatus(
  results: AuthMatrixResult[],
  method: AuthMatrixRequest['method'],
  url: string,
) {
  return results.find((result) => result.method === method && result.url === url)
    ?.status
}

test('brand_settings.api.auth_matrix', async ({
  page,
  onboardedCreatorUser,
}, testInfo) => {
  const brandOwner = makeBrandOwner(testInfo)

  try {
    await brandOwner.ensureExists()
    await brandOwner.onboardFull('brand')

    await page.goto('/')

    const unauthResults = await requestAuthMatrix(page)
    for (const result of unauthResults) {
      expect(result.status, `${result.method} ${result.url} sin auth`).toBe(401)
    }

    await onboardedCreatorUser.signIn(page)

    const creatorToken = await getClerkSessionToken(page)
    const creatorResults = await requestAuthMatrix(page, creatorToken)
    for (const result of creatorResults) {
      expect(result.status, `${result.method} ${result.url} creator`).toBe(403)
    }

    await onboardedCreatorUser.signOut(page)
    await brandOwner.signIn(page)

    const ownerToken = await getClerkSessionToken(page)
    const ownerResults = await requestAuthMatrix(page, ownerToken)
    expect(
      findStatus(ownerResults, 'GET', '/v1/brand-workspaces/me/settings'),
      'GET /v1/brand-workspaces/me/settings owner',
    ).toBe(200)
    expect(
      [200, 422],
      'PATCH /v1/brand-workspaces/me/settings owner',
    ).toContain(
      findStatus(ownerResults, 'PATCH', '/v1/brand-workspaces/me/settings'),
    )
    expect(
      [200, 400],
      'POST /v1/brand-workspaces/me/logo:presign owner',
    ).toContain(
      findStatus(ownerResults, 'POST', '/v1/brand-workspaces/me/logo:presign'),
    )
    expect(
      findStatus(ownerResults, 'GET', '/v1/billing/plan-usage'),
      'GET /v1/billing/plan-usage owner',
    ).toBe(200)
    expect(
      [201, 400, 403],
      'POST /v1/billing/checkout-sessions owner',
    ).toContain(
      findStatus(ownerResults, 'POST', '/v1/billing/checkout-sessions'),
    )
  } finally {
    await brandOwner.delete().catch(() => {})
  }
})
