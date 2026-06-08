import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  Campaign,
  CampaignDetailResponse,
} from '#/shared/api/generated/model'
import { ApiError } from '#/shared/api/mutator'

import { CampaignInlineEditor } from './CampaignInlineEditor'

const mutateUpdateCampaign = vi.fn()
const mutatePresignImage = vi.fn()
const mutatePresignBriefPdf = vi.fn()

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

vi.mock('#/features/campaigns/wizard/mutations', () => ({
  useUpdateCampaignMutation: () => ({
    mutateAsync: mutateUpdateCampaign,
    isPending: false,
  }),
  usePresignImageMutation: () => ({
    mutateAsync: mutatePresignImage,
    isPending: false,
  }),
  usePresignBriefPdfMutation: () => ({
    mutateAsync: mutatePresignBriefPdf,
    isPending: false,
  }),
}))

vi.mock('#/features/campaigns/wizard/queries', () => ({
  useInterestsQuery: () => ({
    data: {
      status: 200,
      data: {
        items: [
          { slug: 'beauty', label_es: 'Beauty' },
          { slug: 'gaming', label_es: 'Gaming' },
        ],
      },
    },
  }),
  useCreatorTiersQuery: () => ({
    data: {
      status: 200,
      data: {
        items: [
          { slug: 'micro', label_es: 'Micro', followers_min: 1000 },
          { slug: 'macro', label_es: 'Macro', followers_min: 100000 },
        ],
      },
    },
  }),
}))

describe('CampaignInlineEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mutatePresignImage.mockResolvedValue({
      s3_key: 'tmp/campaigns/campaign-1/new-image.webp',
    })
    mutatePresignBriefPdf.mockResolvedValue({
      s3_key: 'tmp/campaigns/campaign-1/brief.pdf',
    })
  })

  it('renders immutable fields as readonly display without controls', () => {
    renderEditor()

    expect(screen.getByText('Tipo de contenido')).toBeInTheDocument()
    expect(screen.getByText('Pricing model')).toBeInTheDocument()
    expect(screen.getByText('Plataformas')).toBeInTheDocument()
    expect(screen.getByText('País creator')).toBeInTheDocument()
    expect(screen.getByText('Tipo de compensación')).toBeInTheDocument()

    expect(
      screen.queryByRole('textbox', { name: /tipo de contenido/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('textbox', { name: /pricing model/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('group', { name: /^plataformas$/i }),
    ).not.toBeInTheDocument()
  })

  it('saves an editable name with only that field and current If-Match version', async () => {
    const user = userEvent.setup()
    mutateUpdateCampaign.mockResolvedValue({
      status: 200,
      data: makeCampaign({ name: 'Nueva campaña', version: 8 }),
      headers: new Headers(),
    })
    renderEditor()

    await user.click(screen.getByRole('button', { name: /nombre/i }))
    const input = screen.getByRole('textbox', { name: /^nombre$/i })
    await user.clear(input)
    await user.type(input, 'Nueva campaña')
    await user.click(screen.getByRole('button', { name: /^guardar$/i }))

    expect(mutateUpdateCampaign).toHaveBeenCalledWith({
      campaignId: 'campaign-1',
      data: { name: 'Nueva campaña' },
      ifMatch: '7',
    })
    expect(await screen.findByText('Nueva campaña')).toBeInTheDocument()
    expect(screen.getByText('Versión 8')).toBeInTheDocument()
  })

  it('uploads an image before saving image_s3_key', async () => {
    const user = userEvent.setup()
    mutateUpdateCampaign.mockResolvedValue({
      status: 200,
      data: makeCampaign({
        image_s3_key: 'tmp/campaigns/campaign-1/new-image.webp',
        version: 8,
      }),
      headers: new Headers(),
    })
    renderEditor()

    await user.click(screen.getByRole('button', { name: /imagen/i }))
    const file = new File(['image'], 'image.webp', { type: 'image/webp' })
    await user.upload(screen.getByLabelText(/^imagen$/i), file)

    expect(mutatePresignImage).toHaveBeenCalledWith({ file })
    await waitFor(() => {
      expect(mutateUpdateCampaign).toHaveBeenCalledWith({
        campaignId: 'campaign-1',
        data: { image_s3_key: 'tmp/campaigns/campaign-1/new-image.webp' },
        ifMatch: '7',
      })
    })
    expect(
      await screen.findByText('tmp/campaigns/campaign-1/new-image.webp'),
    ).toBeInTheDocument()
  })

  it('shows the concurrency banner and reload action on version mismatch', async () => {
    const user = userEvent.setup()
    mutateUpdateCampaign.mockRejectedValue(
      new ApiError(
        412,
        'concurrency.version_mismatch',
        'version mismatch',
        undefined,
        {
          code: 'concurrency.version_mismatch',
          message: 'version mismatch',
        },
      ),
    )
    renderEditor()

    await user.click(screen.getByRole('button', { name: /nombre/i }))
    await user.clear(screen.getByRole('textbox', { name: /^nombre$/i }))
    await user.type(screen.getByRole('textbox', { name: /^nombre$/i }), 'Otra')
    await user.click(screen.getByRole('button', { name: /^guardar$/i }))

    const alert = await screen.findByRole('alert')
    expect(
      within(alert).getByText(
        'El dato cambió desde otra sesión. Recargá la página para ver la versión actualizada.',
      ),
    ).toBeInTheDocument()
    expect(
      within(alert).getByRole('button', { name: /recargar/i }),
    ).toBeInTheDocument()
  })
})

type TestCampaign = CampaignDetailResponse &
  Partial<Omit<Campaign, keyof CampaignDetailResponse>>

function renderEditor(campaign: TestCampaign = makeCampaign()) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <CampaignInlineEditor campaignId="campaign-1" campaign={campaign} />
    </QueryClientProvider>,
  )
}

function makeCampaign(overrides: Partial<Campaign> = {}): TestCampaign {
  return {
    id: 'campaign-1',
    campaign_id: 'campaign-1',
    brand_workspace_id: 'workspace-1',
    status: 'active',
    version: 7,
    name: 'Campaña original',
    objective: 'Awareness',
    description: 'Descripción original',
    target_url: 'https://example.com',
    image_s3_key: 'tmp/campaigns/campaign-1/image.webp',
    content_type: 'ugc_videos',
    pricing_model: 'pay_per_post',
    platforms: ['instagram'],
    interests: ['beauty'],
    creator_country: 'AR',
    min_creator_tier_slug: 'micro',
    compensation_type: 'payment',
    compensation_notes: 'Notas',
    video_reuse_permission_default: true,
    content_guidelines: 'Guías',
    brief_pdf_s3_key: null,
    action_flags: {
      can_edit: true,
      can_activate: true,
      can_pause: true,
      can_resume: true,
    },
    plan_capabilities: {
      allows_automatic_matching: true,
      allows_campaign_board: true,
      allows_email_invites: true,
      allows_in_platform_invites: true,
    },
    budget: {
      amount: '1000',
      currency: 'USD',
    },
    audience: {
      description: 'Audiencia',
    },
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
    deadline: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}
