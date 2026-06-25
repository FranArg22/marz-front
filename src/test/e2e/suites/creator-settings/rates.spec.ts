import type { Locator, Page, Route } from '@playwright/test'

import { test, expect } from '../../support/fixtures'
import { installCreatorSettingsMock } from './mock'

const channelRateLabels = /Reel de Instagram|Video de TikTok|Short de YouTube/

test.describe('Creator settings — rates', () => {
  test('creator_settings.rates.edit_channel_rate', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await gotoRatesSettings(page, onboardedCreatorUser)

    const firstChannelAmount = firstChannelRateInput(page)
    await expect(firstChannelAmount).toBeVisible()

    const nextChannelAmount = nextAmount(
      await firstChannelAmount.inputValue(),
      '150.00',
    )
    await firstChannelAmount.fill(nextChannelAmount)

    const button = saveButton(page)
    await expect(button).toBeEnabled()
    await Promise.all([waitForRatesSave(page), button.click()])
    await expect(button).toBeDisabled()

    await page.reload()
    await expect(
      page.getByRole('heading', { name: 'Redes y tarifas' }),
    ).toBeVisible()
    await expect(firstChannelRateInput(page)).toHaveValue(nextChannelAmount)
  })

  test('creator_settings.rates.reject_invalid_rate', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await gotoRatesSettings(page, onboardedCreatorUser)

    const firstChannelAmount = firstChannelRateInput(page)
    await expect(firstChannelAmount).toBeVisible()

    await assertInvalidRateIsBlocked(page, firstChannelAmount, '0')
    await assertInvalidRateIsBlocked(page, firstChannelAmount, '-10')
  })

  test('creator_settings.rates.format_platform_mismatch', async ({
    page,
    onboardedCreatorUser,
  }) => {
    const invalidFormatResponse = async (route: Route) => {
      await route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'validation_error',
          fields: {
            'channel_rates[0].format': 'invalid_for_platform',
          },
        }),
      })
    }
    await page.route('**/v1/creators/me/rates', invalidFormatResponse)
    await gotoRatesSettings(page, onboardedCreatorUser)

    const firstChannelAmount = firstChannelRateInput(page)
    await expect(firstChannelAmount).toBeVisible()
    await firstChannelAmount.fill(
      nextAmount(await firstChannelAmount.inputValue(), '151.00'),
    )

    const button = saveButton(page)
    await expect(button).toBeEnabled()
    await button.click()

    await expect(
      page.getByText(
        /formatos inv[aá]lidos|invalid_for_platform|API 422|Unprocessable|error/i,
      ),
    ).toBeVisible()
    await expect(button).toBeEnabled()

    await page.unroute('**/v1/creators/me/rates', invalidFormatResponse)
  })

  test('creator_settings.rates.channels_read_only', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await gotoRatesSettings(page, onboardedCreatorUser)

    await expect(page.getByText('Handle')).toBeVisible()
    await expect(page.getByText('Seguidores')).toBeVisible()
    await expect(
      page.getByText(/^@[\w.-]+$/, { exact: false }).first(),
    ).toBeVisible()
    await expect(
      page.locator('[data-testid="channel-handle-input"]'),
    ).not.toBeAttached()
    await expect(
      page.locator('[data-testid="channel-followers-input"]'),
    ).not.toBeAttached()
    await expect(page.getByRole('textbox', { name: 'Handle' })).toHaveCount(0)
    await expect(page.getByRole('textbox', { name: 'Seguidores' })).toHaveCount(
      0,
    )

    const followersValues = page
      .locator('p', { hasText: 'Seguidores' })
      .locator('xpath=following-sibling::p[1]')
      .filter({ hasNotText: 'Sin datos' })
    if ((await followersValues.count()) > 0) {
      await expect(followersValues.first()).toContainText(/[0-9]/)
    }
  })

  test('creator_settings.rates.edit_ugc_rate', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await gotoRatesSettings(page, onboardedCreatorUser)

    const ugcAmount = page.getByLabel('Tarifa UGC')
    await expect(ugcAmount).toBeVisible()

    await assertInvalidRateIsBlocked(page, ugcAmount, '0')

    const nextUgcAmount = nextAmount(await ugcAmount.inputValue(), '200.00')
    await ugcAmount.fill(nextUgcAmount)

    const button = saveButton(page)
    await expect(button).toBeEnabled()
    await Promise.all([waitForRatesSave(page), button.click()])
    await expect(button).toBeDisabled()

    await page.reload()
    await expect(
      page.getByRole('heading', { name: 'Redes y tarifas' }),
    ).toBeVisible()
    await expect(page.getByLabel('Tarifa UGC')).toHaveValue(nextUgcAmount)
  })
})

async function gotoRatesSettings(
  page: Page,
  user: { signIn(page: Page): Promise<void> },
) {
  await user.signIn(page)
  await installCreatorSettingsMock(page)
  await page.goto('/settings?section=redes-tarifas')
  await expect(
    page.getByRole('heading', { name: 'Redes y tarifas' }),
  ).toBeVisible()
}

function firstChannelRateInput(page: Page) {
  return page.getByLabel(channelRateLabels).first()
}

function saveButton(page: Page) {
  return page.getByRole('button', { name: 'Guardar' })
}

function waitForRatesSave(page: Page) {
  return page.waitForResponse(
    (response) =>
      response.url().includes('/v1/creators/me/rates') &&
      response.request().method() === 'PUT' &&
      response.status() === 200,
  )
}

async function assertInvalidRateIsBlocked(
  page: Page,
  input: Locator,
  value: string,
) {
  await input.fill(value)

  const button = saveButton(page)
  await expect(button).toBeEnabled()
  await button.click()

  await expect(
    page.getByText(/must_be_positive|mayor a 0|positivo/i),
  ).toBeVisible()
  await expect(button).toBeEnabled()
}

function nextAmount(current: string, fallback: string) {
  return current === fallback ? '175.25' : fallback
}
