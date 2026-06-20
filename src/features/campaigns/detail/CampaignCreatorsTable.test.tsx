import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'

import type { CampaignParticipantListResponse } from '#/shared/api/generated/model'

import { CampaignCreatorsTable } from './CampaignCreatorsTable'
import { useCampaignParticipantsQuery } from './creators/useCampaignParticipantsQuery'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('./creators/useCampaignParticipantsQuery', () => ({
  useCampaignParticipantsQuery: vi.fn(),
}))

const useCampaignParticipantsQueryMock = vi.mocked(useCampaignParticipantsQuery)

beforeEach(() => {
  mockNavigate.mockReset()
  useCampaignParticipantsQueryMock.mockReset()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('CampaignCreatorsTable', () => {
  it('renders participants and requests the next cursor', async () => {
    const user = userEvent.setup()
    const onParamsChange = vi.fn()
    useCampaignParticipantsQueryMock.mockReturnValue(
      queryResult({
        data: [makeParticipant()],
        total_visible: 1,
        next_cursor: 'cursor-2',
      }),
    )

    render(
      <CampaignCreatorsTable
        scope={{
          type: 'campaign',
          campaignId: 'campaign-1',
        }}
        params={{ limit: 24 }}
        onParamsChange={onParamsChange}
        hasActiveFilters={false}
        onClearFilters={vi.fn()}
        onFindCreators={vi.fn()}
      />,
    )

    expect(screen.getByText('Lumina Studio')).toBeInTheDocument()
    expect(screen.getByText('@lumina')).toBeInTheDocument()
    expect(screen.getByText('YouTube')).toBeInTheDocument()
    expect(screen.getByText('En revisión')).toBeInTheDocument()
    expect(screen.getByText('3 de 4 entregados')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cargar más' }))

    expect(onParamsChange).toHaveBeenCalledWith({
      limit: 24,
      cursor: 'cursor-2',
    })
  })

  it('navigates to conversation when row action is available', async () => {
    const user = userEvent.setup()
    useCampaignParticipantsQueryMock.mockReturnValue(
      queryResult({
        data: [makeParticipant({ conversation_id: 'conversation-1' })],
        total_visible: 1,
        next_cursor: null,
      }),
    )

    renderTable()

    await user.click(screen.getByRole('button', { name: 'Abrir conversación' }))

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/workspace/conversations/$conversationId',
      params: { conversationId: 'conversation-1' },
      search: { filter: 'all', campaign_id: 'campaign-1' },
    })
  })

  it('shows Discovery CTA when empty without filters', async () => {
    const user = userEvent.setup()
    const onFindCreators = vi.fn()
    useCampaignParticipantsQueryMock.mockReturnValue(
      queryResult({ data: [], total_visible: 0, next_cursor: null }),
    )

    renderTable({ onFindCreators })

    expect(
      screen.getByRole('heading', {
        name: 'Todavía no hay creadores en esta campaña',
      }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Buscar creadores' }))
    expect(onFindCreators).toHaveBeenCalled()
  })

  it('shows clear filters CTA when empty with filters', async () => {
    const user = userEvent.setup()
    const onClearFilters = vi.fn()
    useCampaignParticipantsQueryMock.mockReturnValue(
      queryResult({ data: [], total_visible: 0, next_cursor: null }),
    )

    renderTable({ hasActiveFilters: true, onClearFilters })

    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    expect(onClearFilters).toHaveBeenCalled()
  })

  it('renders relative last activity for participants with recent activity', () => {
    const now = new Date('2026-05-09T12:00:00.000Z')
    vi.useFakeTimers()
    vi.setSystemTime(now)
    useCampaignParticipantsQueryMock.mockReturnValue(
      queryResult({
        data: [
          makeParticipant({
            last_activity_at: new Date(
              now.getTime() - 60_000 * 5,
            ).toISOString(),
          }),
        ],
        total_visible: 1,
        next_cursor: null,
      }),
    )

    renderTable()

    expect(screen.queryByText('Respuesta pendiente')).not.toBeInTheDocument()
  })

  it('is axe-clean', async () => {
    useCampaignParticipantsQueryMock.mockReturnValue(
      queryResult({
        data: [makeParticipant()],
        total_visible: 1,
        next_cursor: null,
      }),
    )

    const { container } = renderTable()

    expect(await axe(container)).toHaveNoViolations()
  })
})

function renderTable(
  props: Partial<Parameters<typeof CampaignCreatorsTable>[0]> = {},
) {
  return render(
    <CampaignCreatorsTable
      scope={{
        type: 'campaign',
        campaignId: 'campaign-1',
      }}
      params={{ limit: 24 }}
      onParamsChange={vi.fn()}
      hasActiveFilters={false}
      onClearFilters={vi.fn()}
      onFindCreators={vi.fn()}
      {...props}
    />,
  )
}

function queryResult(data: CampaignParticipantListResponse) {
  return {
    data,
    error: null,
    isPending: false,
    isError: false,
  } as ReturnType<typeof useCampaignParticipantsQuery>
}

function makeParticipant(
  overrides: Partial<CampaignParticipantListResponse['data'][number]> = {},
): CampaignParticipantListResponse['data'][number] {
  return {
    participant_id: 'creator-1',
    creator: {
      account_id: 'creator-1',
      profile_id: 'profile-1',
      display_name: 'Lumina Studio',
      handle: 'lumina',
      avatar_url: null,
      preview_url: null,
      niche: 'Beauty',
      platforms: [{ platform: 'youtube', handle: 'lumina', followers: 1200 }],
    },
    platforms: ['youtube'],
    status: 'in_review',
    net_deliverables: { completed: 3, expected: 4 },
    last_activity_at: null,
    conversation_id: null,
    actions: { open_workspace: true, invite_creator: false },
    ...overrides,
  }
}
