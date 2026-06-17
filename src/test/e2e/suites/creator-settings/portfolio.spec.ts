import type { Page } from '@playwright/test'

import { API_BASE_URL } from '../../support/env'
import { test, expect, getClerkSessionToken } from '../../support/fixtures'

test.describe('Creator settings — portfolio', () => {
  test('creator_settings.portfolio.manage_sample_videos', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await onboardedCreatorUser.signIn(page)
    await seedSampleVideos(page, [
      'https://videos.example.com/e2e-portfolio-one',
      'https://videos.example.com/e2e-portfolio-two',
    ])
    await gotoPortfolioSettings(page)

    await expect(videoSlotLabels(page)).toHaveCount(3)

    await page
      .getByLabel('URL del video')
      .first()
      .fill('https://youtu.be/test-video-1')
    await page.getByRole('button', { name: 'Quitar link' }).first().click()
    await page
      .getByLabel('URL del video')
      .first()
      .fill('https://youtu.be/test-video-2')
    await page.getByRole('button', { name: 'Quitar link' }).nth(1).click()

    const saveButton = page.getByRole('button', { name: 'Guardar' })
    await expect(saveButton).toBeEnabled()
    await Promise.all([waitForSampleVideosSave(page), saveButton.click()])
    await expect(saveButton).toBeDisabled()

    await page.reload()
    await expect(page.getByRole('heading', { name: 'Portfolio' })).toBeVisible()
    await expect(videoSlotLabels(page)).toHaveCount(3)
    await expect(page.getByText('https://youtu.be/test-video-2')).toBeVisible()
    await expect(page.getByText('https://youtu.be/test-video-1')).toBeVisible()
    await expect(page.getByText('Pendiente')).toHaveCount(1)
    await expect(page.getByRole('button', { name: 'Quitar link' })).toHaveCount(
      2,
    )
  })

  test('creator_settings.portfolio.reject_invalid_url', async ({
    page,
    onboardedCreatorUser,
  }) => {
    let sampleVideosPutRequests = 0
    await page.route('**/v1/creators/me/sample-videos', async (route) => {
      if (route.request().method() === 'PUT') sampleVideosPutRequests += 1
      await route.continue()
    })

    await onboardedCreatorUser.signIn(page)
    await seedSampleVideos(page, [])
    await gotoPortfolioSettings(page)

    await page.getByLabel('URL del video').first().fill('no-es-una-url')

    const saveButton = page.getByRole('button', { name: 'Guardar' })
    await expect(
      page.getByText(/URL v[aá]lida|http:\/\/|https:\/\//i),
    ).toBeVisible()
    await expect(saveButton).toBeDisabled()
    await page.waitForLoadState('networkidle')

    expect(sampleVideosPutRequests).toBe(0)
  })
})

async function gotoPortfolioSettings(page: Page) {
  await page.goto('/settings?section=portfolio')
  await expect(page.getByRole('heading', { name: 'Portfolio' })).toBeVisible()
}

function videoSlotLabels(page: Page) {
  return page.getByText(/^Video [1-3]$/)
}

function waitForSampleVideosSave(page: Page) {
  return page.waitForResponse(
    (response) =>
      response.url().includes('/v1/creators/me/sample-videos') &&
      response.request().method() === 'PUT' &&
      response.status() === 200,
  )
}

async function seedSampleVideos(page: Page, urls: string[]) {
  const token = await getClerkSessionToken(page)
  const res = await page.request.fetch(
    `${API_BASE_URL}/v1/creators/me/sample-videos`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        videos: urls.map((url) => ({ url })),
      },
    },
  )
  expect(res.ok()).toBe(true)
}
