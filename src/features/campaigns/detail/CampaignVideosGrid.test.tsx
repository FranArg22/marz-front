import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CampaignVideoListResponse } from '#/shared/api/generated/model'

import { CampaignVideosGrid } from './CampaignVideosGrid'
import { useCampaignVideosQuery } from './videos/useCampaignVideosQuery'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

vi.mock('./videos/useCampaignVideosQuery', () => ({
  useCampaignVideosQuery: vi.fn(),
}))

const useCampaignVideosQueryMock = vi.mocked(useCampaignVideosQuery)

beforeEach(() => {
  useCampaignVideosQueryMock.mockReset()
})

describe('CampaignVideosGrid', () => {
  it('shows clear filters when empty with active filters', async () => {
    const user = userEvent.setup()
    const onClearFilters = vi.fn()
    useCampaignVideosQueryMock.mockReturnValue(
      queryResult({ data: [], total_visible: 0, next_cursor: null }),
    )

    renderGrid({ hasActiveFilters: true, onClearFilters })

    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    expect(onClearFilters).toHaveBeenCalled()
  })

  it('shows invite creators when empty without active participants', async () => {
    const user = userEvent.setup()
    const onInviteCreators = vi.fn()
    useCampaignVideosQueryMock.mockReturnValue(
      queryResult({ data: [], total_visible: 0, next_cursor: null }),
    )

    renderGrid({ hasActiveParticipants: false, onInviteCreators })

    await user.click(screen.getByRole('button', { name: 'Invitar creadores' }))
    expect(onInviteCreators).toHaveBeenCalled()
  })

  it('shows active creators CTA when empty with active participants', async () => {
    const user = userEvent.setup()
    const onInviteCreators = vi.fn()
    useCampaignVideosQueryMock.mockReturnValue(
      queryResult({ data: [], total_visible: 0, next_cursor: null }),
    )

    renderGrid({ hasActiveParticipants: true, onInviteCreators })

    await user.click(
      screen.getByRole('button', { name: 'Ver creadores activos' }),
    )
    expect(onInviteCreators).toHaveBeenCalled()
  })

  it('renders video cards when data is available', () => {
    useCampaignVideosQueryMock.mockReturnValue(
      queryResult({
        data: [makeVideo()],
        total_visible: 1,
        next_cursor: null,
      }),
    )

    renderGrid()

    expect(
      screen.getByRole('button', {
        name: 'Abrir revisión de video de Lumina Studio',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('Unboxing Reel')).toBeInTheDocument()
    expect(screen.getAllByText('Instagram')).toHaveLength(2)
    expect(screen.getByText('En revisión')).toBeInTheDocument()
  })

  it('requests the next cursor when Cargar más is clicked', async () => {
    const user = userEvent.setup()
    const onParamsChange = vi.fn()
    useCampaignVideosQueryMock.mockReturnValue(
      queryResult({
        data: [makeVideo()],
        total_visible: 1,
        next_cursor: 'cursor-2',
      }),
    )

    renderGrid({ params: { limit: 12 }, onParamsChange })

    await user.click(screen.getByRole('button', { name: 'Cargar más' }))

    expect(onParamsChange).toHaveBeenCalledWith({
      limit: 12,
      cursor: 'cursor-2',
    })
  })
})

function renderGrid(
  props: Partial<Parameters<typeof CampaignVideosGrid>[0]> = {},
) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <CampaignVideosGrid
        scope={{ type: 'campaign', campaignId: 'campaign-1' }}
        params={{ limit: 24 }}
        hasActiveFilters={false}
        hasActiveParticipants={true}
        onParamsChange={vi.fn()}
        onClearFilters={vi.fn()}
        onInviteCreators={vi.fn()}
        {...props}
      />
    </QueryClientProvider>,
  )
}

function queryResult(data: CampaignVideoListResponse) {
  return {
    data,
    error: null,
    isPending: false,
    isError: false,
  } as ReturnType<typeof useCampaignVideosQuery>
}

function makeVideo(
  overrides: Partial<CampaignVideoListResponse['data'][number]> = {},
): CampaignVideoListResponse['data'][number] {
  return {
    deliverable_id: 'video-1',
    current_draft_id: 'draft-1',
    current_link_id: null,
    reviewer_url: '/campaigns/campaign-1/deliverables/video-1',
    thumbnail_url: null,
    playback_url: null,
    playback_url_expires_at: null,
    status: 'draft_submitted',
    duration_sec: 95,
    platform: 'instagram',
    format: 'Unboxing Reel',
    creator: {
      account_id: 'creator-1',
      profile_id: 'profile-1',
      handle: 'lumina',
      display_name: 'Lumina Studio',
      avatar_url: null,
      tier: null,
      niches: ['Beauty'],
      country: null,
      city: null,
      primary_platform: null,
    },
    submitted_at: '2026-05-09T12:00:00.000Z',
    updated_at: '2026-05-09T12:00:00.000Z',
    ...overrides,
  }
}
