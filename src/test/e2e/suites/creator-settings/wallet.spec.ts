import type { Page } from '@playwright/test'

import { API_BASE_URL } from '../../support/env'
import { test, expect, getClerkSessionToken } from '../../support/fixtures'
import {
  createCreatorSettingsMockState,
  installCreatorSettingsMock,
} from './mock'

test.describe('Creator settings — wallet', () => {
  test('creator_settings.wallet.add_payout_account', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await gotoWalletSettings(
      page,
      onboardedCreatorUser,
      createCreatorSettingsMockState({ payoutAccount: null }),
    )

    await page.getByRole('button', { name: 'Agregar cuenta de cobro' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByLabel('Nombre de la cuenta')).toBeVisible()
    await expect(dialog.getByLabel('Titular de la cuenta')).toBeVisible()
    await expect(dialog.getByLabel('Número de cuenta')).toBeVisible()
    await expect(dialog.getByLabel('Tipo de cuenta')).toBeVisible()
    await expect(dialog.getByLabel('Routing number (ABA)')).toBeVisible()
    await expect(dialog.getByLabel('Dirección')).toBeVisible()
    await expect(dialog.getByText(/Solo transferencias ACH/)).toBeVisible()

    await fillAchForm(page, dialog)

    await Promise.all([
      waitForPayoutAccountPut(page),
      dialog.getByRole('button', { name: 'Guardar' }).click(),
    ])

    await expect(dialog).toBeHidden()
    await expect(page.getByText('Activa')).toBeVisible()
  })

  test('creator_settings.wallet.reject_incomplete_payout_account', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await gotoWalletSettings(page, onboardedCreatorUser)
    await openPayoutAccountModal(page)

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByLabel('Titular de la cuenta').fill('')
    await dialog.getByRole('button', { name: 'Guardar' }).click()

    await expect(
      dialog.getByText(/required|requerido|Invalid|Too small/i).first(),
    ).toBeVisible()
    await expect(dialog).toBeVisible()
  })

  test('creator_settings.wallet.cancel_modal_no_persist', async ({
    page,
    onboardedCreatorUser,
  }) => {
    let payoutPutRequests = 0
    await page.route('**/v1/creators/me/payout-account', async (route) => {
      if (route.request().method() === 'PUT') {
        payoutPutRequests += 1
      }
      await route.continue()
    })

    await gotoWalletSettings(page, onboardedCreatorUser)
    await openPayoutAccountModal(page)

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByLabel('Titular de la cuenta').fill('No debe guardarse')
    await dialog.getByRole('button', { name: 'Cancelar' }).click()

    await expect(dialog).toBeHidden()
    await expect(page.getByText('No debe guardarse')).not.toBeVisible()
    await expect.poll(() => payoutPutRequests).toBe(0)
  })

  test('creator_settings.wallet.replace_payout_account', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await onboardedCreatorUser.signIn(page)
    await installCreatorSettingsMock(page)
    await page.goto('/settings?section=billetera')
    await expect(page.getByRole('heading', { name: 'Billetera' })).toBeVisible()
    await expect(page.getByText('Activa')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Editar' })).toBeVisible()

    await page.getByRole('button', { name: 'Editar' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.getByLabel('Nombre de la cuenta').fill('Cuenta nueva')
    await dialog.getByLabel('Número de cuenta').fill('99998888')

    await Promise.all([
      waitForPayoutAccountPut(page),
      dialog.getByRole('button', { name: 'Guardar' }).click(),
    ])

    await expect(dialog).toBeHidden()
    await expect(page.getByText('Cuenta nueva').first()).toBeVisible()
  })

  test('creator_settings.wallet.payout_account_private', async ({
    page,
    onboardedBrandUser,
  }) => {
    await onboardedBrandUser.signIn(page)

    const token = await getClerkSessionToken(page)
    const res = await page.request.fetch(
      `${API_BASE_URL}/v1/creators/me/payout-account`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )

    expect(res.status()).toBe(403)
    const body = await res.json()
    expect(JSON.stringify(body)).toMatch(/not_creator|forbidden|creator/i)
  })
})

async function gotoWalletSettings(
  page: Page,
  user: { signIn(page: Page): Promise<void> },
  state = createCreatorSettingsMockState(),
) {
  await user.signIn(page)
  await installCreatorSettingsMock(page, state)
  await page.goto('/settings?section=billetera')
  await expect(page.getByRole('heading', { name: 'Billetera' })).toBeVisible()
}

async function fillAchForm(page: Page, dialog: ReturnType<Page['getByRole']>) {
  await dialog.getByLabel('Nombre de la cuenta').fill('Cuenta principal')
  await dialog.getByLabel('Titular de la cuenta').fill('Test Creator')
  await dialog.getByLabel('Número de cuenta').fill('12345678')
  await selectOption(page, 'Tipo de cuenta', 'Checking')
  await dialog.getByLabel('Routing number (ABA)').fill('021000021')
  await dialog.getByLabel('Dirección').fill('1 Main St, New York')
}

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

function waitForPayoutAccountPut(page: Page) {
  return page.waitForResponse(
    (response) =>
      response.url().includes('/v1/creators/me/payout-account') &&
      response.request().method() === 'PUT' &&
      response.status() === 200,
  )
}
