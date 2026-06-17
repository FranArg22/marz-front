import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { PlanUsageResponse } from '#/shared/api/generated/model/planUsageResponse'

import { PlanUsageCard } from './PlanUsageCard'

function usage(
  overrides: Partial<PlanUsageResponse> = {},
): PlanUsageResponse {
  return {
    campaigns_active: { current: 1, limit: 1, available: true },
    creators_active: { current: 3, limit: 5, available: true },
    invitations: {
      current: 10,
      limit: 30,
      cycle_resets_at: '2026-06-15T00:00:00Z',
      available: true,
    },
    ...overrides,
  }
}

describe('PlanUsageCard', () => {
  it('renders starter usage with progress bars and reset date', () => {
    render(<PlanUsageCard usage={usage()} />)

    expect(screen.getByText('Uso del plan')).toBeInTheDocument()
    expect(screen.getByText('1 de 1')).toBeInTheDocument()
    expect(screen.getByText('3 de 5')).toBeInTheDocument()
    expect(screen.getByText('10 de 30')).toBeInTheDocument()
    // Cycle reset moved to a card-level footer (design C9aEtz).
    expect(screen.getByText('Reinicio de ciclo')).toBeInTheDocument()
    expect(screen.getByText(/15.*jun.*2026/i)).toBeInTheDocument()
    expect(screen.getAllByRole('progressbar')).toHaveLength(3)
  })

  it('renders unlimited scale usage without progress bars', () => {
    render(
      <PlanUsageCard
        usage={usage({
          campaigns_active: { current: 4, limit: null, available: true },
          creators_active: { current: 18, limit: null, available: true },
          invitations: {
            current: 80,
            limit: null,
            cycle_resets_at: null,
            available: true,
          },
        })}
      />,
    )

    expect(screen.getByText('4 de ∞')).toBeInTheDocument()
    expect(screen.getByText('18 de ∞')).toBeInTheDocument()
    expect(screen.getByText('80 de ∞')).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('renders invitations limit zero as N/A for free plan', () => {
    render(
      <PlanUsageCard
        usage={usage({
          invitations: {
            current: 0,
            limit: 0,
            cycle_resets_at: null,
            available: true,
          },
        })}
      />,
    )

    const invitations = screen.getByTestId('plan-usage.invitations')
    expect(within(invitations).getByText('N/A')).toBeInTheDocument()
    expect(
      within(invitations).queryByRole('progressbar'),
    ).not.toBeInTheDocument()
  })

  it('renders unavailable campaigns fallback without breaking other metrics', () => {
    render(
      <PlanUsageCard
        usage={usage({
          campaigns_active: { current: null, limit: null, available: false },
        })}
      />,
    )

    const campaigns = screen.getByTestId('plan-usage.campaigns')
    expect(within(campaigns).getByText('No disponible')).toBeInTheDocument()
    expect(screen.getByText('3 de 5')).toBeInTheDocument()
    expect(screen.getByText('10 de 30')).toBeInTheDocument()
  })
})
