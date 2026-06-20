import type { Page } from '@playwright/test'

import { test, expect } from '../../support/fixtures'

const BASE_SETTINGS = {
  profile: {
    full_name: 'Carla Méndez',
    email: 'carla@brand.com',
    phone_e164: '+5491155512345',
  },
  brand: {
    name: 'Acme',
    website_url: 'https://acme.com',
    logo_url: null,
  },
}

const FAKE_S3_KEY = 'brand-logos/ws-test-id/e2e-test.png'
const MISSING_S3_KEY = 'brand-logos/ws-test-id/missing.png'
const FAKE_UPLOAD_URL = 'https://s3.amazonaws.com/test-bucket/test-upload'
const PNG_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
  'base64',
)

type BrandSettings = {
  profile: {
    full_name: string
    email: string
    phone_e164: string | null
  }
  brand: {
    name: string
    website_url: string
    logo_url: string | null
  }
}
type PatchBody = Partial<{
  full_name: string
  email: string
  phone_e164: string | null
  name: string
  website_url: string
  logo_s3_key: string | null
}>

function mockGetSettings(
  page: Page,
  overrides: Partial<BrandSettings> = {},
  options: { times?: number } = {},
) {
  const data = {
    ...BASE_SETTINGS,
    ...overrides,
    profile: { ...BASE_SETTINGS.profile, ...overrides.profile },
    brand: { ...BASE_SETTINGS.brand, ...overrides.brand },
  }

  return page.route(
    /\/v1\/brand-workspaces\/me\/settings$/,
    async (route) => {
      if (route.request().method() !== 'GET') {
        await route.fallback()
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(data),
      })
    },
    options,
  )
}

function mockPatchSettings(
  page: Page,
  handler: (body: PatchBody) => Promise<{
    status: number
    body: unknown
  }>,
) {
  return page.route(/\/v1\/brand-workspaces\/me\/settings$/, async (route) => {
    if (route.request().method() !== 'PATCH') {
      await route.fallback()
      return
    }

    const result = await handler(route.request().postDataJSON() as PatchBody)
    await route.fulfill({
      status: result.status,
      contentType: 'application/json',
      body: JSON.stringify(result.body),
    })
  })
}

async function openGeneralSettings(
  page: Page,
  onboardedBrandUser: { signIn(page: Page): Promise<void> },
) {
  await onboardedBrandUser.signIn(page)
  await page.goto('/ajustes/general')
}

function recordSettingsPatches(page: Page) {
  const patchBodies: PatchBody[] = []
  page.on('request', (request) => {
    if (
      request.method() !== 'PATCH' ||
      !/\/v1\/brand-workspaces\/me\/settings$/.test(request.url())
    ) {
      return
    }

    patchBodies.push(request.postDataJSON() as PatchBody)
  })
  return patchBodies
}

async function expectFieldError(page: Page, label: RegExp) {
  const field = page.getByLabel(label)
  await expect(field).toHaveAttribute('aria-invalid', 'true')

  await expect
    .poll(async () => field.getAttribute('aria-describedby'))
    .toBeTruthy()
  const describedBy = await field.getAttribute('aria-describedby')
  if (!describedBy) throw new Error(`Expected ${label} to describe an error`)
  await expect(page.locator(`[id="${describedBy}"]`)).toBeVisible()
}

async function reloadGeneralSettingsFromBackend(page: Page) {
  await page.reload()
  await expect(page.getByTestId('settings.general.form')).toBeVisible()
}

function validationError(fields: Record<string, string[]>) {
  return {
    code: 'validation_error',
    message: 'Validation failed',
    fields,
    error: { code: 'validation_error', fields },
  }
}

async function mockLogoUpload(
  page: Page,
  options: { s3Key?: string; uploadUrl?: string } = {},
) {
  const calls = { presign: 0, put: 0 }
  const s3Key = options.s3Key ?? FAKE_S3_KEY
  const uploadUrl = options.uploadUrl ?? FAKE_UPLOAD_URL

  await page.route(
    /\/v1\/brand-workspaces\/me\/logo:presign$/,
    async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fallback()
        return
      }

      calls.presign += 1
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          upload_url: uploadUrl,
          s3_key: s3Key,
          expires_in: 300,
          required_headers: { 'Content-Type': 'image/png' },
          max_bytes: 5242880,
        }),
      })
    },
  )

  await page.route(uploadUrl, async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      })
      return
    }

    if (route.request().method() !== 'PUT') {
      await route.fallback()
      return
    }

    calls.put += 1
    await route.fulfill({
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  })

  return calls
}

async function uploadLogo(page: Page) {
  await page.locator('input[type="file"]').setInputFiles({
    name: 'e2e-test.png',
    mimeType: 'image/png',
    buffer: PNG_BUFFER,
  })
}

test.describe('brand settings general', () => {
  test('brand_settings.general.prefilled', async ({
    page,
    onboardedBrandUser,
  }) => {
    await mockGetSettings(page)

    await openGeneralSettings(page, onboardedBrandUser)

    await expect(page.getByLabel(/^Nombre y Apellido$/i)).toHaveValue('Carla Méndez')
    await expect(page.getByLabel(/Email/i)).toHaveValue('carla@brand.com')
    await expect(page.getByLabel(/Email/i)).toBeDisabled()
    await expect(page.getByLabel(/Teléfono/i)).toHaveValue('+5491155512345')
    await expect(page.getByLabel(/Nombre de marca/i)).toHaveValue('Acme')
    await expect(page.getByLabel(/Sitio web/i)).toHaveValue(
      'https://acme.com',
    )
    await expect(page.getByTestId('settings.general.save_button')).toBeDisabled()
  })

  test('brand_settings.general.save_button_enabled_on_dirty', async ({
    page,
    onboardedBrandUser,
  }) => {
    await mockGetSettings(page)

    await openGeneralSettings(page, onboardedBrandUser)
    await page.getByLabel(/^Nombre y Apellido$/i).fill('Carla M. Pérez')

    await expect(page.getByTestId('settings.general.save_button')).toBeEnabled()
  })

  test('brand_settings.general.save_all_fields_one_request', async ({
    page,
    onboardedBrandUser,
  }) => {
    const patchBodies = recordSettingsPatches(page)
    await mockGetSettings(page, {}, { times: 1 })

    await openGeneralSettings(page, onboardedBrandUser)
    await page.getByLabel(/^Nombre y Apellido$/i).fill('Carla M. Pérez')
    await page.getByLabel(/Teléfono/i).fill('+5491155599999')
    await page.getByLabel(/Nombre de marca/i).fill('Acme Studio')
    await page.getByLabel(/Sitio web/i).fill('https://acme.studio')
    await page.getByTestId('settings.general.save_button').click()

    await expect(page.getByText('Ajustes guardados')).toBeVisible()
    expect(patchBodies).toEqual([
      {
        full_name: 'Carla M. Pérez',
        phone_e164: '+5491155599999',
        name: 'Acme Studio',
        website_url: 'https://acme.studio',
      },
    ])
    expect(patchBodies[0]).not.toHaveProperty('email')
    await expect(page.getByTestId('settings.general.save_button')).toBeDisabled()

    await reloadGeneralSettingsFromBackend(page)
    await expect(page.getByLabel(/^Nombre y Apellido$/i)).toHaveValue('Carla M. Pérez')
    await expect(page.getByLabel(/Teléfono/i)).toHaveValue('+5491155599999')
    await expect(page.getByLabel(/Nombre de marca/i)).toHaveValue('Acme Studio')
    await expect(page.getByLabel(/Sitio web/i)).toHaveValue(
      'https://acme.studio',
    )
  })

  test('brand_settings.general.required_full_name', async ({
    page,
    onboardedBrandUser,
  }) => {
    await mockGetSettings(page)
    await mockPatchSettings(page, async () => ({
      status: 422,
      body: validationError({ full_name: ['required'] }),
    }))

    await openGeneralSettings(page, onboardedBrandUser)
    await page.getByLabel(/^Nombre y Apellido$/i).fill('')
    await page.getByTestId('settings.general.save_button').click()

    await expectFieldError(page, /^Nombre y Apellido$/i)
    await expect(page.getByText('Ajustes guardados')).toHaveCount(0)
  })

  test('brand_settings.general.required_brand_name', async ({
    page,
    onboardedBrandUser,
  }) => {
    await mockGetSettings(page)
    await mockPatchSettings(page, async () => ({
      status: 422,
      body: validationError({ name: ['required'] }),
    }))

    await openGeneralSettings(page, onboardedBrandUser)
    await page.getByLabel(/Nombre de marca/i).fill('')
    await page.getByTestId('settings.general.save_button').click()

    await expectFieldError(page, /Nombre de marca/i)
    await expect(page.getByText('Ajustes guardados')).toHaveCount(0)
  })

  test('brand_settings.general.required_website_url', async ({
    page,
    onboardedBrandUser,
  }) => {
    await mockGetSettings(page)
    await mockPatchSettings(page, async () => ({
      status: 422,
      body: validationError({ website_url: ['required'] }),
    }))

    await openGeneralSettings(page, onboardedBrandUser)
    await page.getByLabel(/Sitio web/i).fill('')
    await page.getByTestId('settings.general.save_button').click()

    await expectFieldError(page, /Sitio web/i)
    await expect(page.getByText('Ajustes guardados')).toHaveCount(0)
  })

  test('brand_settings.general.invalid_phone_e164', async ({
    page,
    onboardedBrandUser,
  }) => {
    await mockGetSettings(page)
    await mockPatchSettings(page, async () => ({
      status: 422,
      body: validationError({ phone_e164: ['invalid_e164'] }),
    }))

    await openGeneralSettings(page, onboardedBrandUser)
    await page.getByLabel(/Teléfono/i).fill('12345')
    await page.getByTestId('settings.general.save_button').click()

    await expectFieldError(page, /Teléfono/i)
  })

  test('brand_settings.general.invalid_website_url', async ({
    page,
    onboardedBrandUser,
  }) => {
    await mockGetSettings(page)
    await mockPatchSettings(page, async () => ({
      status: 422,
      body: validationError({ website_url: ['invalid_url'] }),
    }))

    await openGeneralSettings(page, onboardedBrandUser)
    await page.getByLabel(/Sitio web/i).fill('acme')
    await page.getByTestId('settings.general.save_button').click()

    await expectFieldError(page, /Sitio web/i)
  })

  test('brand_settings.general.phone_optional_clear', async ({
    page,
    onboardedBrandUser,
  }) => {
    const patchBodies = recordSettingsPatches(page)
    await mockGetSettings(page, {}, { times: 1 })

    await openGeneralSettings(page, onboardedBrandUser)
    await page.getByLabel(/Teléfono/i).fill('')
    await page.getByTestId('settings.general.save_button').click()

    await expect(page.getByText('Ajustes guardados')).toBeVisible()
    expect(patchBodies).toEqual([{ phone_e164: null }])

    await reloadGeneralSettingsFromBackend(page)
    await expect(page.getByLabel(/Teléfono/i)).toHaveValue('')
  })

  test('brand_settings.general.email_input_disabled', async ({
    page,
    onboardedBrandUser,
  }) => {
    await mockGetSettings(page)

    await openGeneralSettings(page, onboardedBrandUser)

    const emailInput = page.getByLabel(/Email/i)
    await expect(emailInput).toBeDisabled()
    await emailInput.fill('changed@brand.com').catch(() => undefined)
    await expect(emailInput).toHaveValue('carla@brand.com')
  })

  test('brand_settings.general.patch_rejects_email_field', async ({
    page,
    onboardedBrandUser,
  }) => {
    let patchBody: PatchBody | null = null
    await mockGetSettings(page)
    await mockPatchSettings(page, async (body) => {
      patchBody = body
      return {
        status: 422,
        body: {
          code: 'invalid_body',
          message: 'Invalid body',
          error: { code: 'invalid_body' },
        },
      }
    })

    await openGeneralSettings(page, onboardedBrandUser)

    const response = await page.evaluate(async () => {
      const res = await fetch('/v1/brand-workspaces/me/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'changed@brand.com' }),
      })
      return {
        status: res.status,
        body: await res.json(),
      }
    })

    expect(response).toMatchObject({
      status: 422,
      body: { code: 'invalid_body' },
    })
    expect(patchBody).toEqual({ email: 'changed@brand.com' })
  })

  test('brand_settings.general.logo_upload_preview', async ({
    page,
    onboardedBrandUser,
  }) => {
    await mockGetSettings(page)
    await mockLogoUpload(page)

    await openGeneralSettings(page, onboardedBrandUser)
    await uploadLogo(page)

    const preview = page.getByRole('img', { name: 'Logo de marca' })
    await expect(preview).toBeVisible()
    await expect(preview).toHaveAttribute('src', /^blob:/)
  })

  test('brand_settings.general.logo_upload_persists', async ({
    page,
    onboardedBrandUser,
  }) => {
    let patchBody: PatchBody | null = null
    const uploadCalls = await mockLogoUpload(page)
    await mockGetSettings(page)
    await mockPatchSettings(page, async (body) => {
      patchBody = body
      return {
        status: 200,
        body: {
          ...BASE_SETTINGS,
          brand: {
            ...BASE_SETTINGS.brand,
            logo_url:
              'https://cdn.example.com/brand-logos/ws-test-id/e2e-test.png',
          },
        },
      }
    })

    await openGeneralSettings(page, onboardedBrandUser)
    await uploadLogo(page)
    await page.getByTestId('settings.general.save_button').click()

    await expect(page.getByText('Ajustes guardados')).toBeVisible()
    expect(patchBody).toEqual({ logo_s3_key: FAKE_S3_KEY })
    expect(uploadCalls.presign).toBe(1)
    expect(uploadCalls.put).toBe(1)
  })

  test('brand_settings.general.logo_clear_falls_back_initial', async ({
    page,
    onboardedBrandUser,
  }) => {
    let patchBody: PatchBody | null = null
    let settings: BrandSettings = {
      ...BASE_SETTINGS,
      brand: {
        ...BASE_SETTINGS.brand,
        logo_url: 'https://cdn.example.com/brand-logos/ws-id/existing.png',
      },
    }
    await page.route(/\/v1\/brand-workspaces\/me\/settings$/, async (route) => {
      if (route.request().method() !== 'GET') {
        await route.fallback()
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(settings),
      })
    })
    await mockPatchSettings(page, async (body) => {
      patchBody = body
      settings = BASE_SETTINGS
      return {
        status: 200,
        body: BASE_SETTINGS,
      }
    })

    await openGeneralSettings(page, onboardedBrandUser)
    await page.getByRole('button', { name: /Quitar logo/i }).click()
    await page.getByTestId('settings.general.save_button').click()

    await expect(page.getByText('Ajustes guardados')).toBeVisible()
    expect(patchBody).toEqual({ logo_s3_key: null })
    await expect(page.getByRole('img', { name: 'Logo de marca' })).toHaveCount(
      0,
    )
    await expect(
      page.locator('[data-slot="avatar-fallback"]').filter({ hasText: 'A' }),
    ).toBeVisible()
  })

  test('brand_settings.general.logo_s3_key_missing_rejected', async ({
    page,
    onboardedBrandUser,
  }) => {
    let patchBody: PatchBody | null = null
    await mockGetSettings(page)
    await mockLogoUpload(page, { s3Key: MISSING_S3_KEY })
    await mockPatchSettings(page, async (body) => {
      patchBody = body
      return {
        status: 422,
        body: validationError({ logo_s3_key: ['object_not_found'] }),
      }
    })

    await openGeneralSettings(page, onboardedBrandUser)
    await uploadLogo(page)
    await page.getByTestId('settings.general.save_button').click()

    expect(patchBody).toEqual({ logo_s3_key: MISSING_S3_KEY })
    await expect(page.getByRole('alert')).toContainText('object_not_found')
    await expect(page.getByText('Ajustes guardados')).toHaveCount(0)
  })

  test('brand_settings.general.no_diff_no_event', async ({
    page,
    onboardedBrandUser,
  }) => {
    let patchCalled = false
    await mockGetSettings(page)
    await mockPatchSettings(page, async () => {
      patchCalled = true
      return {
        status: 200,
        body: BASE_SETTINGS,
      }
    })

    await openGeneralSettings(page, onboardedBrandUser)

    await expect(page.getByTestId('settings.general.save_button')).toBeDisabled()
    expect(patchCalled).toBe(false)
  })
})
