import type { Page, Route } from '@playwright/test'
import { checkA11y, injectAxe } from 'axe-playwright'

import { test, expect } from '../../support/fixtures'

const channelRateLabels = /Reel de Instagram|Video de TikTok|Short de YouTube/

test.describe('Creator settings — rates', () => {
  test('saves edited channel and UGC rates and keeps them after reload', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await onboardedCreatorUser.signIn(page)
    await page.goto('/settings?section=redes-tarifas')
    await expect(
      page.getByRole('heading', { name: 'Redes y tarifas' }),
    ).toBeVisible()

    const firstChannelAmount = page.getByLabel(channelRateLabels).first()
    await expect(firstChannelAmount).toBeVisible()

    const nextChannelAmount = nextAmount(await firstChannelAmount.inputValue())
    const ugcAmount = page.getByLabel('Tarifa UGC')
    const nextUgcAmount = nextAmount(await ugcAmount.inputValue(), '221.22')

    await firstChannelAmount.fill(nextChannelAmount)
    await ugcAmount.fill(nextUgcAmount)

    const saveButton = page.getByRole('button', { name: 'Guardar' })
    await expect(saveButton).toBeEnabled()
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes('/v1/creators/me/rates') &&
          response.request().method() === 'PUT' &&
          response.ok(),
      ),
      saveButton.click(),
    ])
    await expect(saveButton).toBeDisabled()

    await page.reload()
    await expect(page.getByLabel(channelRateLabels).first()).toHaveValue(
      nextChannelAmount,
    )
    await expect(page.getByLabel('Tarifa UGC')).toHaveValue(nextUgcAmount)
  })
})

test.describe('Creator settings — wallet', () => {
  test('creates a payout account and edits its account type', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await onboardedCreatorUser.signIn(page)
    await page.goto('/settings?section=billetera')
    await expect(page.getByRole('heading', { name: 'Billetera' })).toBeVisible()

    await openPayoutAccountModal(page)

    const createDialog = page.getByRole('dialog')
    await expect(createDialog).toBeVisible()
    await selectOption(page, 'Tipo de cuenta', 'Banco')
    await createDialog.getByLabel('Titular de la cuenta').fill('E2E Creator')
    await createDialog.getByLabel('Banco').fill('Banco Marz')
    await createDialog
      .getByLabel('Identificador (CBU, IBAN, email, alias...)')
      .fill('e2e-alias-1234')
    await selectOption(page, 'País', 'Argentina')

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes('/v1/creators/me/payout-account') &&
          response.request().method() === 'PUT' &&
          response.ok(),
      ),
      createDialog.getByRole('button', { name: 'Guardar' }).click(),
    ])

    await expect(createDialog).toBeHidden()
    await expect(page.getByText('Activa')).toBeVisible()
    await expect(page.getByText('Banco').first()).toBeVisible()
    await expect(page.getByText('E2E Creator')).toBeVisible()
    await expect(page.getByText('Banco Marz')).toBeVisible()

    await page.getByRole('button', { name: 'Editar' }).click()
    const editDialog = page.getByRole('dialog')
    await expect(editDialog).toBeVisible()
    await expect(editDialog.getByLabel('Titular de la cuenta')).toHaveValue(
      'E2E Creator',
    )
    await expect(editDialog.getByLabel('Banco')).toHaveValue('Banco Marz')
    await expect(
      editDialog.getByLabel('Identificador (CBU, IBAN, email, alias...)'),
    ).toHaveValue('e2e-alias-1234')

    await selectOption(page, 'Tipo de cuenta', 'Aplicación o billetera virtual')
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes('/v1/creators/me/payout-account') &&
          response.request().method() === 'PUT' &&
          response.ok(),
      ),
      editDialog.getByRole('button', { name: 'Guardar' }).click(),
    ])

    await expect(editDialog).toBeHidden()
    await expect(
      page.getByText('Aplicación o billetera virtual').first(),
    ).toBeVisible()
  })
})

test.describe('Creator settings — save errors', () => {
  test('keeps collaboration changes dirty after a failed save and allows retry', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await onboardedCreatorUser.signIn(page)
    await page.goto('/settings?section=colaboraciones')
    await expect(
      page.getByRole('heading', { name: 'Colaboraciones' }),
    ).toBeVisible()

    await page.getByRole('switch', { name: 'Acepto canjes' }).click()
    const saveButton = page.getByRole('button', { name: 'Guardar' })
    await expect(saveButton).toBeEnabled()

    const failCollaborationSave = async (route: Route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'e2e_forced_error',
          message: 'Forced collaboration save failure',
        }),
      })
    }
    await page.route(
      '**/v1/creators/me/profile/collaboration',
      failCollaborationSave,
    )

    await saveButton.click()
    await expect(
      page.getByText('Forced collaboration save failure'),
    ).toBeVisible()
    await expect(saveButton).toBeEnabled()

    await page.unroute(
      '**/v1/creators/me/profile/collaboration',
      failCollaborationSave,
    )
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes('/v1/creators/me/profile/collaboration') &&
          response.request().method() === 'PATCH' &&
          response.ok(),
      ),
      saveButton.click(),
    ])
    await expect(saveButton).toBeDisabled()
  })
})

test.describe('Creator settings — accessibility', () => {
  test('has no critical axe violations in general settings or wallet modal', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await onboardedCreatorUser.signIn(page)
    await page.goto('/settings?section=general')
    await expect(page.getByRole('heading', { name: 'General' })).toBeVisible()
    await assertNoCriticalA11yViolations(page)

    await page.goto('/settings?section=billetera')
    await openPayoutAccountModal(page)
    await expect(page.getByRole('dialog')).toBeVisible()
    await assertNoCriticalA11yViolations(page, '[role="dialog"]')
  })
})

test.describe('Creator settings — route guards', () => {
  test('redirects an onboarded brand away from the creator settings group route', async ({
    page,
    onboardedBrandUser,
  }) => {
    await onboardedBrandUser.signIn(page)
    await page.goto('/settings?section=general')
    await expect(page).toHaveURL(/\/workspace/)
  })
})

async function selectOption(page: Page, label: string, option: string) {
  await page.getByLabel(label).click()
  await page.getByRole('option', { name: option }).click()
}

async function openPayoutAccountModal(page: Page) {
  const addButton = page.getByRole('button', {
    name: 'Agregar cuenta de cobro',
  })
  const editButton = page.getByRole('button', { name: 'Editar' })

  await expect(addButton.or(editButton).first()).toBeVisible()
  if (await addButton.isVisible()) {
    await addButton.click()
    return
  }

  await editButton.click()
}

async function assertNoCriticalA11yViolations(
  page: Page,
  context?: string,
) {
  await injectAxe(page)
  await checkA11y(
    page,
    context,
    {
      includedImpacts: ['critical'],
    },
    false,
  )
}

function nextAmount(current: string, fallback = '111.11') {
  return current === fallback ? '112.22' : fallback
}
