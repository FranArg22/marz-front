import type { Page } from '@playwright/test'

import { test, expect } from '../../support/fixtures'

const WALLET_API = '**/v1/creators/me/wallet'
const WITHDRAWALS_API = '**/v1/creators/me/withdrawals**'
const EARNINGS_API = '**/v1/creators/me/earnings**'

interface WalletPayload {
  balance: { amount: string; currency: string }
  withdrawal_fee_pct: string
  min_withdrawal: { amount: string; currency: string }
  can_withdraw: boolean
  eligibility: {
    requires_w8ben: boolean
    w8ben_redirect_url: string | null
    has_payout_account: boolean
    has_inflight_withdrawal: boolean
  }
}

const DEFAULT_WALLET: WalletPayload = {
  balance: { amount: '100.00', currency: 'USD' },
  withdrawal_fee_pct: '2.5',
  min_withdrawal: { amount: '10.00', currency: 'USD' },
  can_withdraw: true,
  eligibility: {
    requires_w8ben: false,
    w8ben_redirect_url: null,
    has_payout_account: true,
    has_inflight_withdrawal: false,
  },
}

const STUB_EARNINGS = {
  period: '30d',
  generated_at: '2026-06-30T00:00:00Z',
  kpis: {
    total_earned: { amount: '500.00' },
    earned_in_period: { amount: '200.00' },
    pending_payout: { amount: '0.00' },
    next_payout: {
      amount: '0.00',
      estimated_date: null,
      date_available: false,
    },
  },
  monthly_earnings: [],
  pending_bonuses: { items: [], next_cursor: null, has_more: false },
  payments: {
    items: [],
    next_cursor: null,
    has_more: false,
    total_visible: 0,
  },
  empty_states: {
    no_payments_ever: true,
    no_period_payments: true,
    no_pending_bonuses: true,
  },
}

async function mockWallet(page: Page, overrides: Partial<WalletPayload> = {}) {
  const wallet = {
    ...DEFAULT_WALLET,
    ...overrides,
    eligibility: {
      ...DEFAULT_WALLET.eligibility,
      ...overrides.eligibility,
    },
  }
  await page.route(WALLET_API, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(wallet),
    })
  })
}

async function mockEarnings(page: Page) {
  await page.route(EARNINGS_API, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(STUB_EARNINGS),
    })
  })
}

async function mockWithdrawalsList(
  page: Page,
  items: unknown[] = [],
  total = items.length,
) {
  await page.route(WITHDRAWALS_API, async (route) => {
    const url = route.request().url()
    if (
      route.request().method() === 'GET' &&
      !url.match(/\/withdrawals\/[^/?]/)
    ) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items, total, page: 1, per_page: 10 }),
      })
      return
    }
    await route.fallback()
  })
}

async function gotoEarnings(
  page: Page,
  user: { signIn(page: Page): Promise<void> },
) {
  await user.signIn(page)
  await page.goto('/earnings')
  await expect(page.getByRole('heading', { name: 'Ganancias' })).toBeVisible()
}

test.describe('Earnings — Withdrawals', () => {
  test('earnings.withdrawals.shows_balance', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await mockWallet(page, {
      balance: { amount: '152.50', currency: 'USD' },
    })
    await mockEarnings(page)
    await mockWithdrawalsList(page)
    await gotoEarnings(page, onboardedCreatorUser)

    await expect(page.getByText('Balance disponible')).toBeVisible()
    await expect(page.getByText('$153')).toBeVisible()

    await expect(page.getByText('Próximo pago')).not.toBeVisible()

    await expect(
      page.getByRole('button', { name: 'Retirar' }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Retirar' }),
    ).toBeEnabled()
  })

  test('earnings.withdrawals.happy_path', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await mockWallet(page, {
      balance: { amount: '100.00', currency: 'USD' },
    })
    await mockEarnings(page)
    await mockWithdrawalsList(page)

    await page.route(WITHDRAWALS_API, async (route) => {
      if (route.request().method() === 'POST') {
        const url = route.request().url()
        if (url.match(/\/withdrawals\/[^/?]/)) {
          await route.fallback()
          return
        }
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'w-1',
            status: 'requested',
            gross: '50.00',
            fee: '1.25',
            net: '48.75',
            currency: 'USD',
            requested_at: '2026-06-30T10:00:00Z',
          }),
        })
        return
      }
      await route.fallback()
    })

    await gotoEarnings(page, onboardedCreatorUser)

    await page.getByRole('button', { name: 'Retirar' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(
      dialog.getByText('Retirar fondos'),
    ).toBeVisible()

    await dialog.getByLabel('Monto bruto').fill('50')

    await expect(dialog.getByText('Retirás')).toBeVisible()
    await expect(dialog.getByText('$50.00')).toBeVisible()
    await expect(dialog.getByText(/Comisión/)).toBeVisible()
    await expect(dialog.getByText('$1.25', { exact: false })).toBeVisible()
    await expect(dialog.getByText('Vas a recibir')).toBeVisible()
    await expect(dialog.getByText('$48.75')).toBeVisible()

    await dialog.getByRole('button', { name: 'Confirmar retiro' }).click()

    await expect(dialog.getByText('Solicitud enviada')).toBeVisible()

    await dialog.getByRole('button', { name: 'Cerrar' }).click()
    await expect(dialog).toBeHidden()
  })

  test('earnings.withdrawals.below_minimum_blocked', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await mockWallet(page)
    await mockEarnings(page)
    await mockWithdrawalsList(page)
    await gotoEarnings(page, onboardedCreatorUser)

    await page.getByRole('button', { name: 'Retirar' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.getByLabel('Monto bruto').fill('5')

    await expect(dialog.getByText('Mínimo $10.00')).toBeVisible()
    await expect(
      dialog.getByRole('button', { name: 'Confirmar retiro' }),
    ).toBeDisabled()
  })

  test('earnings.withdrawals.inflight_button_disabled', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await mockWallet(page, {
      can_withdraw: false,
      eligibility: {
        requires_w8ben: false,
        w8ben_redirect_url: null,
        has_payout_account: true,
        has_inflight_withdrawal: true,
      },
    })
    await mockEarnings(page)
    await mockWithdrawalsList(page)
    await gotoEarnings(page, onboardedCreatorUser)

    const btn = page.getByRole('button', { name: 'Retiro en proceso' })
    await expect(btn).toBeVisible()
    await expect(btn).toBeDisabled()
  })

  test('earnings.withdrawals.w8ben_gate', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await mockWallet(page, {
      can_withdraw: false,
      eligibility: {
        requires_w8ben: true,
        w8ben_redirect_url: 'https://pagos.go-marz.com/w8?token=abc',
        has_payout_account: true,
        has_inflight_withdrawal: false,
      },
    })
    await mockEarnings(page)
    await mockWithdrawalsList(page)
    await gotoEarnings(page, onboardedCreatorUser)

    const w8benButton = page.getByRole('button', {
      name: 'Completar formulario W-8BEN',
    })
    await expect(w8benButton).toBeVisible()

    await w8benButton.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(
      dialog.getByText('Formulario W-8BEN requerido'),
    ).toBeVisible()
    await expect(
      dialog.getByRole('button', { name: /Completar formulario/ }),
    ).toBeVisible()
  })

  test('earnings.withdrawals.history_list', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await mockWallet(page)
    await mockEarnings(page)
    await mockWithdrawalsList(page, [
      {
        id: 'w-1',
        status: 'sent',
        net: { amount: '97.50', currency: 'USD' },
        requested_at: '2026-06-01T10:00:00Z',
        sent_at: '2026-06-02T09:00:00Z',
      },
      {
        id: 'w-2',
        status: 'requested',
        net: { amount: '48.75', currency: 'USD' },
        requested_at: '2026-06-28T10:00:00Z',
        sent_at: null,
      },
    ])
    await gotoEarnings(page, onboardedCreatorUser)

    await expect(
      page.getByRole('heading', { name: 'Historial de retiros' }),
    ).toBeVisible()

    await expect(page.getByText('Enviado ✓')).toBeVisible()
    await expect(page.getByText('En cola')).toBeVisible()

    await expect(page.getByText('$97.50')).toBeVisible()
    await expect(page.getByText('$48.75')).toBeVisible()

    const rows = page.locator('tbody tr')
    const sentRow = rows.filter({ hasText: '$97.50' })
    const requestedRow = rows.filter({ hasText: '$48.75' })

    await expect(
      requestedRow.getByRole('button', { name: 'Cancelar' }),
    ).toBeVisible()
    await expect(
      sentRow.getByRole('button', { name: 'Cancelar' }),
    ).not.toBeVisible()
  })

  test('earnings.withdrawals.detail_comprobante', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await mockWallet(page)
    await mockEarnings(page)
    await mockWithdrawalsList(page, [
      {
        id: 'w-1',
        status: 'sent',
        net: { amount: '97.50', currency: 'USD' },
        requested_at: '2026-06-01T10:00:00Z',
        sent_at: '2026-06-02T09:00:00Z',
      },
    ])

    await page.route('**/v1/creators/me/withdrawals/w-1', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'w-1',
            status: 'sent',
            gross: { amount: '100.00', currency: 'USD' },
            fee: { amount: '2.50', currency: 'USD' },
            net: { amount: '97.50', currency: 'USD' },
            requested_at: '2026-06-01T10:00:00Z',
            sent_at: '2026-06-02T09:00:00Z',
            mercury_transaction_id: 'txn_123',
          }),
        })
        return
      }
      await route.continue()
    })

    await gotoEarnings(page, onboardedCreatorUser)

    await page.getByRole('button', { name: 'Ver detalle' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Comprobante de retiro')).toBeVisible()

    await expect(dialog.getByText('$100.00')).toBeVisible()
    await expect(dialog.getByText('$2.50', { exact: false })).toBeVisible()
    await expect(dialog.getByText('$97.50')).toBeVisible()

    await expect(dialog.getByText('Enviado ✓')).toBeVisible()

    await expect(dialog.getByText('txn_123')).toBeVisible()

    await expect(
      dialog.getByRole('button', { name: 'Cancelar retiro' }),
    ).not.toBeVisible()
  })

  test('earnings.withdrawals.cancel_requested', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await mockWallet(page, {
      balance: { amount: '100.00', currency: 'USD' },
    })
    await mockEarnings(page)

    let cancelled = false
    await page.route(WITHDRAWALS_API, async (route) => {
      const url = route.request().url()
      if (
        route.request().method() === 'GET' &&
        !url.match(/\/withdrawals\/[^/?]/)
      ) {
        const status = cancelled ? 'cancelled' : 'requested'
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              {
                id: 'w-3',
                status,
                net: { amount: '48.75', currency: 'USD' },
                requested_at: '2026-06-28T10:00:00Z',
                sent_at: null,
              },
            ],
            total: 1,
            page: 1,
            per_page: 10,
          }),
        })
        return
      }
      await route.fallback()
    })

    await page.route('**/v1/creators/me/withdrawals/w-3/cancel', async (route) => {
      cancelled = true
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'w-3', status: 'cancelled' }),
      })
    })

    await gotoEarnings(page, onboardedCreatorUser)

    const row = page.locator('tbody tr').filter({ hasText: '$48.75' })
    await expect(row.getByText('En cola')).toBeVisible()

    await row.getByRole('button', { name: 'Cancelar' }).click()

    const confirmDialog = page.getByRole('dialog')
    await expect(confirmDialog).toBeVisible()
    await expect(
      confirmDialog.getByText('¿Cancelar este retiro?'),
    ).toBeVisible()

    await confirmDialog
      .getByRole('button', { name: 'Confirmar cancelación' })
      .click()

    await expect(row.getByText('Cancelado')).toBeVisible()
    await expect(
      row.getByRole('button', { name: 'Cancelar' }),
    ).not.toBeVisible()
  })
})
