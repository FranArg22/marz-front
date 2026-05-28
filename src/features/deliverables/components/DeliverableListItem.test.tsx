import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { DeliverableListItem } from './DeliverableListItem'
import type { DeliverableDTO } from '#/features/deliverables/types'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

function makeDeliverable(overrides?: Partial<DeliverableDTO>): DeliverableDTO {
  return {
    id: 'del-1',
    offer_id: 'offer-1',
    offer_stage_id: null,
    platform: 'youtube',
    format: 'Video',
    status: 'completed',
    deadline: '2026-05-01',
    current_version: null,
    current_draft: null,
    drafts_count: 0,
    change_requests_count: 0,

    latest_change_request: null,
    change_requests: [],
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
    ...overrides,
  }
}

function renderItem(
  props?: Partial<Parameters<typeof DeliverableListItem>[0]>,
) {
  const onUploadDraft = vi.fn()
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <DeliverableListItem
        deliverable={makeDeliverable()}
        sessionKind="brand"
        onUploadDraft={onUploadDraft}
        {...props}
      />
    </QueryClientProvider>,
  )
  return { onUploadDraft }
}

describe('DeliverableListItem', () => {
  it('renders the status badge for a paid deliverable', () => {
    renderItem({ deliverable: makeDeliverable({ status: 'paid' }) })

    expect(screen.getByText('Pagado')).toBeInTheDocument()
  })
})
