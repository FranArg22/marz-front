import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'

import type { CampaignOverviewResponse } from '#/shared/api/generated/model'

import { StatsBlock } from './StatsBlock'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

describe('StatsBlock', () => {
  it('renders campaign activity and spend stats', () => {
    render(<StatsBlock overview={makeOverview()} />)

    const stats = within(
      screen.getByRole('region', { name: /estadísticas de campaña/i }),
    ).getAllByRole('article')

    expect(stats).toHaveLength(4)
    expect(screen.getByText('Gastado')).toBeInTheDocument()
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
    expect(screen.getByText('Ofertas')).toBeInTheDocument()
    expect(screen.getByText('Postulaciones')).toBeInTheDocument()
    expect(screen.getByText('$5,200')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.queryByText('Reach')).not.toBeInTheDocument()
    expect(screen.queryByText('Budget')).not.toBeInTheDocument()
    expect(screen.queryByText(/match/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/progress/i)).not.toBeInTheDocument()
  })

  it('is axe-clean', async () => {
    const { container } = render(<StatsBlock overview={makeOverview()} />)

    expect(await axe(container)).toHaveNoViolations()
  })
})

function makeOverview(
  overrides: Partial<CampaignOverviewResponse> = {},
): CampaignOverviewResponse {
  return {
    applications_count: 12,
    reach_available: true,
    reach: 320_000,
    budget_total_usd: '7200.00',
    budget_spent_usd: '3100.00',
    spend_paid_usd: '3100.00',
    spend_pending_approval_usd: '850.00',
    spend_pending_offers_usd: '1200.00',
    spend_pending_offers_count: 3,
    offers_count: 8,
    spend_committed_usd: '2100.00',
    campaign: {
      campaign_id: 'campaign-1',
      name: 'Summer Glow-up 2024',
      objective: 'Brand awareness',
      status: 'active',
      deadline: '2026-06-01',
      platforms: ['instagram'],
      audience_description: 'Latam women 25-34',
      content_model: 'ugc',
      pricing_model: 'fixed_fee',
      action_flags: {
        can_edit: true,
        can_activate: true,
        can_pause: true,
        can_resume: true,
      },
    },
    creators_preview: [],
    recent_activity: [],
    ...overrides,
  }
}
