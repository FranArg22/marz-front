import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { NextStep } from './NextStep'
import type { OfferDetailDTO } from '#/features/offers/hooks/useConversationOffers'
import type {
  DeliverableDTO,
  DeliverableStatus,
} from '#/features/deliverables/types'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

const acceptedOffer = {
  id: 'offer-1',
  status: 'accepted',
} as unknown as OfferDetailDTO

function makeDeliverables(statuses: DeliverableStatus[]): DeliverableDTO[] {
  return statuses.map((status, i) => ({
    id: `del-${i}`,
    offer_id: 'offer-1',
    offer_stage_id: null,
    platform: 'youtube',
    format: 'yt_short',
    status,
    deadline: null,
    current_version: null,
    current_draft: null,
    drafts_count: 0,
    change_requests_count: 0,
    latest_change_request: null,
    change_requests: [],
    created_at: '2024-09-01T12:00:00Z',
    updated_at: '2024-09-01T12:00:00Z',
  }))
}

describe('NextStep', () => {
  it('prompts a free-plan brand to mark as paid when delivery is approved', () => {
    render(
      <NextStep
        offer={acceptedOffer}
        sessionKind="brand"
        deliverables={makeDeliverables(['completed'])}
        isFreePlan
      />,
    )
    expect(screen.getByText('Tenés que marcar como pagado')).toBeInTheDocument()
  })

  it('does not prompt a paid-plan brand to mark as paid (auto-settles)', () => {
    render(
      <NextStep
        offer={acceptedOffer}
        sessionKind="brand"
        deliverables={makeDeliverables(['completed'])}
        isFreePlan={false}
      />,
    )
    expect(
      screen.queryByText('Tenés que marcar como pagado'),
    ).not.toBeInTheDocument()
    expect(screen.getByText('Procesando el pago')).toBeInTheDocument()
  })
})
