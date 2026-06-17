import type { Page, TestInfo } from '@playwright/test'
import { createHash } from 'node:crypto'

import { test, expect, TestUser } from '../../support/fixtures'
import { E2E_RUN_ID } from '../../support/env'

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

async function requestAuthMatrix(page: Page): Promise<AuthMatrixResult[]> {
  return page.evaluate(async (requests) => {
    return Promise.all(
      requests.map(async ({ method, url, body }) => {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }

        if (method === 'POST') {
          headers['Idempotency-Key'] = `e2e-auth-matrix-${crypto.randomUUID()}`
        }

        const res = await fetch(url, {
          method,
          headers,
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        })

        return { url, method, status: res.status }
      }),
    )
  }, AUTH_MATRIX_REQUESTS)
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

    const creatorResults = await requestAuthMatrix(page)
    for (const result of creatorResults) {
      expect(result.status, `${result.method} ${result.url} creator`).toBe(403)
    }

    await onboardedCreatorUser.signOut(page)
    await brandOwner.signIn(page)

    const ownerResults = await requestAuthMatrix(page)
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
      [201, 403],
      'POST /v1/billing/checkout-sessions owner',
    ).toContain(
      findStatus(ownerResults, 'POST', '/v1/billing/checkout-sessions'),
    )
  } finally {
    await brandOwner.delete().catch(() => {})
  }
})
