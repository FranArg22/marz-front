import type { Page } from '@playwright/test'

import { test, expect } from '../../support/fixtures'

const pngBytes = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

test.describe('Creator settings — general', () => {
  test('creator_settings.general.save_contact_fields saves edited contact fields and persists them after reload', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await gotoGeneralSettings(page, onboardedCreatorUser)

    const cityInput = page.getByLabel('Ciudad')
    const currentCity = await cityInput.inputValue()
    const nextCity =
      currentCity === 'Ciudad E2E General'
        ? 'Ciudad E2E General 2'
        : 'Ciudad E2E General'

    await cityInput.fill(nextCity)

    const saveButton = page.getByRole('button', { name: 'Guardar' })
    await expect(saveButton).toBeEnabled()
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes('/v1/creators/me/profile/contact') &&
          response.request().method() === 'PATCH' &&
          response.status() === 200,
      ),
      saveButton.click(),
    ])
    await expect(saveButton).toBeDisabled()

    await page.reload()
    await expect(page.getByRole('heading', { name: 'General' })).toBeVisible()
    await expect(cityInput).toHaveValue(nextCity)
  })

  test('creator_settings.general.reject_under_18 shows a minimum age error and keeps the section dirty', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await gotoGeneralSettings(page, onboardedCreatorUser)

    await page.getByLabel('Fecha de nacimiento').fill('2015-01-01')

    const saveButton = page.getByRole('button', { name: 'Guardar' })
    await expect(saveButton).toBeEnabled()
    await saveButton.click()

    await expect(page.getByText(/18|edad|menor/i)).toBeVisible()
    await expect(saveButton).toBeEnabled()
  })

  test('creator_settings.general.reject_invalid_phone shows a phone format error', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await gotoGeneralSettings(page, onboardedCreatorUser)

    await page.getByLabel('Teléfono').fill('1122334455')

    const saveButton = page.getByRole('button', { name: 'Guardar' })
    await expect(saveButton).toBeEnabled()
    await saveButton.click()

    await expect(page.getByText(/tel[eé]fono|formato|E\.164|\+/i)).toBeVisible()
  })

  test('creator_settings.general.email_read_only keeps the email field disabled', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await gotoGeneralSettings(page, onboardedCreatorUser)

    await expect(page.getByLabel('Email')).toBeDisabled()
  })

  test('creator_settings.general.replace_avatar uploads a replacement avatar with a real PNG buffer', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await gotoGeneralSettings(page, onboardedCreatorUser)

    await page.locator('input[type="file"]').setInputFiles({
      name: 'avatar.png',
      mimeType: 'image/png',
      buffer: pngBytes,
    })

    const saveButton = page.getByRole('button', { name: 'Guardar' })
    await expect(saveButton).toBeEnabled()
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes('/v1/creators/me/avatar') &&
          response.request().method() === 'PUT' &&
          response.status() === 200,
      ),
      saveButton.click(),
    ])
    await expect(saveButton).toBeDisabled()
  })

  test('creator_settings.general.reject_invalid_avatar blocks avatar and contact saves atomically', async ({
    page,
    onboardedCreatorUser,
  }) => {
    let presignRequests = 0
    let contactRequests = 0

    await page.route(
      '**/v1/onboarding/creator/avatar:presign',
      async (route) => {
        presignRequests += 1
        await route.continue()
      },
    )
    await page.route('**/v1/creators/me/profile/contact', async (route) => {
      contactRequests += 1
      await route.continue()
    })

    await gotoGeneralSettings(page, onboardedCreatorUser)

    const avatar = page.getByAltText('Preview de avatar')
    const initialAvatarSrc =
      (await avatar.count()) > 0 ? await avatar.getAttribute('src') : null
    const cityInput = page.getByLabel('Ciudad')
    const initialCity = await cityInput.inputValue()
    const nextCity =
      initialCity === 'Ciudad Avatar Invalido'
        ? 'Ciudad Avatar Invalido 2'
        : 'Ciudad Avatar Invalido'

    await page.locator('input[type="file"]').setInputFiles({
      name: 'bad.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not an image'),
    })
    await cityInput.fill(nextCity)

    const saveButton = page.getByRole('button', { name: 'Guardar' })
    await expect(saveButton).toBeEnabled()
    await saveButton.click()

    await expect(page.getByText(/imagen|JPEG|PNG|WebP|archivo/i)).toBeVisible()
    await page.waitForLoadState('networkidle')
    expect(presignRequests).toBe(0)
    expect(contactRequests).toBe(0)

    await page.reload()
    await expect(page.getByRole('heading', { name: 'General' })).toBeVisible()
    await expect(page.getByLabel('Ciudad')).toHaveValue(initialCity)
    if (initialAvatarSrc) {
      await expect(page.getByAltText('Preview de avatar')).toHaveAttribute(
        'src',
        initialAvatarSrc,
      )
    }
  })
})

async function gotoGeneralSettings(
  page: Page,
  user: { signIn(page: Page): Promise<void> },
) {
  await user.signIn(page)
  await page.goto('/settings?section=general')
  await expect(page.getByRole('heading', { name: 'General' })).toBeVisible()
}
