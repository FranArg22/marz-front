import { expect, test } from '../../support/fixtures'
import type { Page } from '@playwright/test'

const campaignId = '00000000-0000-4000-8000-000000000212'
const brandWorkspaceId = '00000000-0000-4000-8000-000000000213'

type CampaignDetail = ReturnType<typeof makeCampaignDetail>

function makeCampaignDetail(
  overrides: Partial<{
    name: string
    image_s3_key: string
  }> = {},
) {
  return {
    campaign_id: campaignId,
    id: campaignId,
    brand_workspace_id: brandWorkspaceId,
    name: overrides.name ?? 'Campaña inline original',
    objective: 'Brand awareness',
    status: 'active',
    budget: { amount: '42000', currency: 'USD' },
    deadline: '2026-06-30T00:00:00Z',
    platforms: ['instagram'],
    audience: { description: 'Creators de belleza en Argentina' },
    commercial: {
      content_model: 'ugc',
      pricing_model: 'pay_per_post',
    },
    brief_flags: {
      has_confirmed_brief: true,
      has_source_url: true,
      has_source_text: false,
      has_source_pdf: false,
      has_ai_generation: false,
    },
    action_flags: {
      can_edit: true,
      can_activate: true,
      can_pause: true,
      can_resume: true,
    },
    plan_capabilities: {
      allows_email_invites: true,
      allows_in_platform_invites: true,
      allows_campaign_board: true,
      allows_automatic_matching: true,
    },
    description: 'Descripción original de la campaña',
    target_url: 'https://example.com',
    image_s3_key:
      overrides.image_s3_key ?? 'tmp/campaigns/e2e/original-image.png',
    content_type: 'ugc_videos',
    pricing_model: 'pay_per_post',
    interests: ['beauty'],
    creator_country: 'AR',
    min_creator_tier_slug: 'micro',
    compensation_type: 'payment',
    compensation_notes: 'Notas de compensación',
    video_reuse_permission_default: true,
    content_guidelines: 'Guidelines originales para creators.',
    brief_pdf_s3_key: null,
    created_at: '2026-05-09T10:00:00Z',
    updated_at: '2026-05-09T10:00:00Z',
  }
}

function makePatchCampaign(
  overrides: Partial<{
    name: string
    image_s3_key: string
  }> = {},
) {
  return {
    id: campaignId,
    brand_workspace_id: brandWorkspaceId,
    status: 'active',
    version: 8,
    name: overrides.name ?? 'Campaña inline actualizada',
    description: 'Descripción original de la campaña',
    target_url: 'https://example.com',
    image_s3_key:
      overrides.image_s3_key ?? 'tmp/campaigns/e2e/original-image.png',
    content_type: 'ugc_videos',
    pricing_model: 'pay_per_post',
    platforms: ['instagram'],
    interests: ['beauty'],
    creator_country: 'AR',
    min_creator_tier_slug: 'micro',
    compensation_type: 'payment',
    compensation_notes: 'Notas de compensación',
    video_reuse_permission_default: true,
    content_guidelines: 'Guidelines originales para creators.',
    brief_pdf_s3_key: null,
    created_at: '2026-05-09T10:00:00Z',
    updated_at: '2026-05-09T10:00:00Z',
  }
}

function makeCampaignOverview(campaign: CampaignDetail) {
  return {
    applications_count: 3,
    reach_available: true,
    reach: 120000,
    budget_total_usd: '42000.00',
    budget_spent_usd: '1200.00',
    campaign: {
      campaign_id: campaign.campaign_id,
      name: campaign.name,
      objective: campaign.objective,
      status: campaign.status,
      deadline: campaign.deadline,
      platforms: campaign.platforms,
      audience_description: campaign.audience.description,
      content_model: campaign.commercial.content_model,
      pricing_model: campaign.commercial.pricing_model,
      action_flags: campaign.action_flags,
    },
    creators_preview: [],
    recent_activity: [],
  }
}

async function mockLookups(page: Page) {
  await page.route('**/api/v1/interests', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [{ slug: 'beauty', label_es: 'Belleza' }],
      }),
    })
  })

  await page.route('**/api/v1/creator-tiers', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [{ slug: 'micro', label_es: 'Micro', followers_min: 1000 }],
      }),
    })
  })
}

async function mockCampaignReadModels(
  page: Page,
  getCampaign: () => CampaignDetail,
) {
  await page.route(`**/v1/campaigns/${campaignId}/detail`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(getCampaign()),
    })
  })

  await page.route(`**/v1/campaigns/${campaignId}/overview**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(makeCampaignOverview(getCampaign())),
    })
  })
}

async function openCampaignDetail(page: Page) {
  await page.goto(`/campaigns/${campaignId}`)
  await expect(page.getByText('Brief y configuración')).toBeVisible()
}

test.describe('campaign detail inline edit', () => {
  test('edits name with PATCH If-Match and updates the UI', async ({
    page,
    onboardedBrandUser,
  }) => {
    let campaign = makeCampaignDetail()
    let patchBody: unknown = null
    let ifMatch: string | null = null

    await mockLookups(page)
    await mockCampaignReadModels(page, () => campaign)
    await page.route(`**/v1/campaigns/${campaignId}`, async (route) => {
      if (route.request().method() === 'PATCH') {
        patchBody = route.request().postDataJSON()
        ifMatch = route.request().headers()['if-match'] ?? null
        const updatedCampaign = makePatchCampaign({
          name: 'Campaña inline actualizada',
        })
        campaign = makeCampaignDetail({
          name: 'Campaña inline actualizada',
        })
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(updatedCampaign),
        })
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(campaign),
      })
    })

    await onboardedBrandUser.signIn(page)
    await openCampaignDetail(page)

    await page.getByRole('button', { name: /Nombre/ }).click()
    await page.getByRole('textbox', { name: /^Nombre$/ }).fill(
      'Campaña inline actualizada',
    )
    await page.getByRole('button', { name: /^Guardar$/ }).click()

    await expect(page.getByText('Campaña inline actualizada')).toBeVisible()
    expect(patchBody).toEqual({ name: 'Campaña inline actualizada' })
    expect(ifMatch).toBe('*')
  })

  test('replaces image through presign, upload, PATCH, and UI update', async ({
    page,
    onboardedBrandUser,
  }) => {
    let campaign = makeCampaignDetail()
    let presignCalled = false
    let uploadCalled = false
    let patchBody: unknown = null
    let ifMatch: string | null = null

    await mockLookups(page)
    await mockCampaignReadModels(page, () => campaign)
    await page.route('**/v1/campaigns/uploads/image-presign', async (route) => {
      presignCalled = true
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          upload_url: '/e2e-upload/campaign-inline-image.png',
          s3_key: 'tmp/campaigns/e2e/campaign-inline-image.png',
          expires_in: 900,
          required_headers: { 'content-type': 'image/png' },
          max_bytes: 5 * 1024 * 1024,
        }),
      })
    })
    await page.route('**/e2e-upload/campaign-inline-image.png', async (route) => {
      uploadCalled = true
      await route.fulfill({ status: 200, body: '' })
    })
    await page.route(`**/v1/campaigns/${campaignId}`, async (route) => {
      if (route.request().method() === 'PATCH') {
        patchBody = route.request().postDataJSON()
        ifMatch = route.request().headers()['if-match'] ?? null
        const updatedCampaign = makePatchCampaign({
          image_s3_key: 'tmp/campaigns/e2e/campaign-inline-image.png',
        })
        campaign = makeCampaignDetail({
          image_s3_key: 'tmp/campaigns/e2e/campaign-inline-image.png',
        })
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(updatedCampaign),
        })
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(campaign),
      })
    })

    await onboardedBrandUser.signIn(page)
    await openCampaignDetail(page)

    await page.getByRole('button', { name: /Imagen/ }).click()
    await page.getByLabel(/^Imagen$/).setInputFiles({
      name: 'campaign-inline-image.png',
      mimeType: 'image/png',
      buffer: Buffer.from('inline-image'),
    })

    await expect(
      page.getByText('tmp/campaigns/e2e/campaign-inline-image.png'),
    ).toBeVisible()
    expect(presignCalled).toBe(true)
    expect(uploadCalled).toBe(true)
    expect(patchBody).toEqual({
      image_s3_key: 'tmp/campaigns/e2e/campaign-inline-image.png',
    })
    expect(ifMatch).toBe('*')
  })

  test('shows concurrency banner with reload action when PATCH returns 412', async ({
    page,
    onboardedBrandUser,
  }) => {
    const campaign = makeCampaignDetail()
    let ifMatch: string | null = null

    await mockLookups(page)
    await mockCampaignReadModels(page, () => campaign)
    await page.route(`**/v1/campaigns/${campaignId}`, async (route) => {
      if (route.request().method() === 'PATCH') {
        ifMatch = route.request().headers()['if-match'] ?? null
        await route.fulfill({
          status: 412,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              code: 'concurrency.version_mismatch',
              message: 'version mismatch',
            },
          }),
        })
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(campaign),
      })
    })

    await onboardedBrandUser.signIn(page)
    await openCampaignDetail(page)

    await page.getByRole('button', { name: /Nombre/ }).click()
    await page
      .getByRole('textbox', { name: /^Nombre$/ })
      .fill('Nombre con conflicto')
    await page.getByRole('button', { name: /^Guardar$/ }).click()

    await expect(
      page.getByText(
        'El dato cambió desde otra sesión. Recargá la página para ver la versión actualizada.',
      ),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /Recargar/ })).toBeVisible()
    expect(ifMatch).toBe('*')
  })
})
