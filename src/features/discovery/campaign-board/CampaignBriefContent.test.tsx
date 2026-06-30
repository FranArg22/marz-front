import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { describe, expect, it, vi } from 'vitest'

import type {
  CampaignBoardBriefSnapshot,
  CampaignBoardCommercialSnapshot,
  CampaignBoardTargetingSnapshot,
  CreatorCampaignBoardCard,
} from '#/shared/api/generated/model'

import { CampaignBriefContent } from './CampaignBriefContent'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce(
        (acc, str, index) => acc + str + (values[index] ?? ''),
        '',
      ),
    { __lingui: true },
  ),
}))

const campaignId = '11111111-1111-4111-8111-111111111111'

function makeCard(): CreatorCampaignBoardCard {
  return {
    campaign_id: campaignId,
    brand: {
      brand_workspace_id: '22222222-2222-4222-8222-222222222222',
      name: 'Marz Audio',
      logo_url: null,
      avatar_initials: 'MA',
      vertical: 'tech',
    },
    campaign: {
      name: 'Lanzamiento auriculares M-Pro 2',
      objective: 'brand_awareness',
      description: 'Buscamos creators tech para presentar nuevos auriculares.',
      target_url: 'https://example.com/lanzamiento',
      image_url: 'https://cdn.test/campaign.jpg',
      deadline: '2026-05-12',
      content_type: 'ugc_videos',
    },
    economics: {
      fee_model: 'fixed_per_video',
      fee_min_amount: '250',
      fee_max_amount: '500',
      fee_label: 'USD 250 - 500',
    },
    targeting: {
      niches: ['tech'],
      interests: ['audio'],
      platforms: ['youtube'],
      deliverables: ['long_form'],
      fee_min: '250',
      fee_max: '500',
    },
    match: {
      score: 42,
      score_raw: '42.00',
      band: 'low',
      recommended: false,
      hard_filters_passed: false,
      profile_complete: true,
      positive_reasons: ['Buen fit con audio'],
      mismatch_reasons: ['Tu audiencia principal no está en YouTube'],
    },
    application: {
      status: 'none',
      application_id: null,
      submitted_at: null,
      can_apply: true,
    },
    published_at: '2026-05-09T08:00:00.000Z',
  }
}

function makeBrief(): CampaignBoardBriefSnapshot {
  return {
    content_guidelines: 'Mostrá el producto en uso real, sin guion rígido.',
    brief_pdf_url: 'https://cdn.test/brief.pdf',
  }
}

function makeTargeting(): CampaignBoardTargetingSnapshot {
  return {
    platforms: ['youtube'],
    interests: ['audio'],
    creator_country: 'AR',
    min_creator_tier_slug: 'nano',
    content_type: 'ugc_videos',
  }
}

function makeCommercial(): CampaignBoardCommercialSnapshot {
  return {
    compensation_type: 'payment',
    compensation_notes: 'Pago contra aprobación del contenido.',
    video_reuse_permission_default: true,
  }
}

function renderContent() {
  return render(
    <CampaignBriefContent
      card={makeCard()}
      brief={makeBrief()}
      targeting={makeTargeting()}
      commercial={makeCommercial()}
    />,
  )
}

const deadlineFormatter = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

describe('CampaignBriefContent', () => {
  it('renders the campaign data grouped by creation steps', () => {
    renderContent()

    expect(screen.getByText('Resumen')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Buscamos creators tech para presentar nuevos auriculares.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /example\.com\/lanzamiento/ }),
    ).toHaveAttribute('href', 'https://example.com/lanzamiento')
    expect(
      screen.getByText(deadlineFormatter.format(new Date('2026-05-12'))),
    ).toBeInTheDocument()

    expect(screen.getByText('Audiencia')).toBeInTheDocument()
    expect(screen.getByText('Youtube')).toBeInTheDocument()
    expect(screen.getByText('Audio')).toBeInTheDocument()
    expect(screen.getByText('Nano')).toBeInTheDocument()

    expect(screen.getByText('Compensación')).toBeInTheDocument()
    expect(screen.getByText('Pago monetario')).toBeInTheDocument()
    expect(screen.getByText('USD 250 - 500')).toBeInTheDocument()
    expect(
      screen.getByText('Pago contra aprobación del contenido.'),
    ).toBeInTheDocument()

    expect(screen.getByText('Contenido')).toBeInTheDocument()
    expect(
      screen.getByText('Mostrá el producto en uso real, sin guion rígido.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Sí')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Descargar PDF del brief/ }),
    ).toHaveAttribute('href', 'https://cdn.test/brief.pdf')
  })

  it('does not render removed AI-brief sections', () => {
    renderContent()

    expect(screen.queryByText('Tono')).not.toBeInTheDocument()
    expect(screen.queryByText('Mensajes clave')).not.toBeInTheDocument()
    expect(screen.queryByText('Dimensiones de scoring')).not.toBeInTheDocument()
    expect(
      screen.queryByText('Qué hacer / Qué evitar'),
    ).not.toBeInTheDocument()
  })

  it('does not render application or invite actions', () => {
    renderContent()

    expect(
      screen.queryByRole('button', {
        name: /postularme|aceptar|declinar|invitar/i,
      }),
    ).not.toBeInTheDocument()
  })

  it('has no axe violations', async () => {
    const { container } = renderContent()

    expect(await axe(container)).toHaveNoViolations()
  })
})
