import type { Page } from '@playwright/test'

import { expect, getClerkSessionToken, test } from '../fixtures'

const API_BASE_URL = (
  process.env.VITE_API_URL ??
  process.env.API_URL ??
  'http://localhost:8080'
).replace(/\/$/, '')

type ApiErrorEnvelope = {
  code?: string
  details?: { field?: string; value?: unknown; allowed?: unknown }
  error?: ApiErrorEnvelope
}

function extractApiError(raw: unknown) {
  const body = (raw ?? {}) as ApiErrorEnvelope
  if (body.code) return { code: body.code, details: body.details }
  if (body.error?.code) {
    return { code: body.error.code, details: body.error.details }
  }
  return {}
}

function campaignPayload(platforms: string[]) {
  return {
    name: `FEAT023 Campaign ${Date.now().toString(36)}`,
    objective: 'brand_awareness',
    budget_amount: '5000',
    budget_currency: 'USD',
    deadline: null,
    brief: {
      brief_source_url: 'https://brand-feat023.example/campaign',
      brief_source_text: 'Campaign for FEAT-023 E2E validation.',
      icp_platforms: platforms,
      hard_filters: [],
      key_messages: ['Validar plataformas oficiales'],
      do_list: [],
      dont_list: [],
      reference_links: [],
      scoring_dimensions: [],
      disqualifiers: [],
    },
  }
}

async function authHeaders(page: Page) {
  const token = await getClerkSessionToken(page)
  const me = await page.request.get(`${API_BASE_URL}/v1/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  expect(me.ok()).toBeTruthy()
  const meBody = await me.json()
  return {
    Authorization: `Bearer ${token}`,
    'X-Brand-Workspace-Id': meBody.brand_workspace.id,
  }
}

test('ESC-5: Brand crea Campaign draft con plataformas oficiales y rechaza X', async ({
  page,
  onboardedBrandUser,
}) => {
  await onboardedBrandUser.signIn(page)
  await page.goto('/campaigns/new')

  await page.getByLabel(/url de la campaña/i).fill('https://marz.com')
  await page.getByLabel(/descripci/i).fill('Marca FEAT023')
  await page.getByRole('button', { name: /analizar/i }).click()
  await expect(page.getByText(/revisá tu brief/i)).toBeVisible({
    timeout: 90_000,
  })

  const headers = await authHeaders(page)
  const invalid = await page.request.post(`${API_BASE_URL}/v1/campaigns`, {
    headers,
    data: campaignPayload(['instagram', 'x']),
  })

  expect(invalid.status()).toBe(422)
  const { code, details } = extractApiError(await invalid.json())
  expect(code).toBe('validation.invalid_value')
  expect(details?.field).toMatch(/platforms|icp_platforms/)
  expect(JSON.stringify(details?.value)).toContain('x')
  expect(details?.allowed).toEqual([
    'instagram',
    'tiktok',
    'youtube',
  ])

  const valid = await page.request.post(`${API_BASE_URL}/v1/campaigns`, {
    headers,
    data: campaignPayload(['instagram', 'tiktok']),
  })
  expect(valid.status()).toBeGreaterThanOrEqual(200)
  expect(valid.status()).toBeLessThan(300)
  const validBody = await valid.json()
  expect(JSON.stringify(validBody)).toContain('instagram')
  expect(JSON.stringify(validBody)).toContain('tiktok')
  expect(JSON.stringify(validBody)).not.toContain('"x"')
})
