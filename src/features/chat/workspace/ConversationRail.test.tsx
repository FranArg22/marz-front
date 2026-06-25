import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { ConversationRail } from './ConversationRail'
import * as activeCampaignsModule from '#/shared/api/activeCampaigns'
import type {
  ConversationListItem,
  ConversationListResponse,
} from '#/shared/api/generated/model'
import { brandWorkspaceSearchSchema } from './workspaceSearchSchema'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}))

const mockCustomFetch = vi.fn()

vi.mock('#/shared/api/mutator', () => ({
  customFetch: (...args: unknown[]) => mockCustomFetch(...args),
}))

function makeConversation(id: string, name: string): ConversationListItem {
  return {
    id,
    counterpart: {
      kind: 'creator_profile',
      id: `creator-${id}`,
      display_name: name,
      avatar_url: null,
      handle: null,
    },
    last_activity_at: new Date().toISOString(),
    last_message_preview: {
      kind: 'text',
      text: `Message from ${name}`,
      author_is_self: false,
    },
    unread_count: 0,
    needs_reply: false,
    created_at: new Date().toISOString(),
  }
}

function makeResponse(
  items: ConversationListItem[],
  nextCursor: string | null = null,
): { data: ConversationListResponse; status: number } {
  return {
    data: {
      items,
      next_cursor: nextCursor,
      total_visible: items.length,
    },
    status: 200,
  }
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

const defaultSearch = {
  filter: 'all' as const,
  search: undefined,
  campaign_id: undefined,
}

beforeEach(() => {
  mockCustomFetch.mockReset()
})

describe('ConversationRail', () => {
  it('shows loading skeleton initially', () => {
    mockCustomFetch.mockReturnValue(new Promise(() => {}))
    render(<ConversationRail search={defaultSearch} />, {
      wrapper: createWrapper(),
    })

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders conversation items after loading', async () => {
    mockCustomFetch.mockResolvedValueOnce(
      makeResponse([
        makeConversation('1', 'María López'),
        makeConversation('2', 'Juan Pérez'),
      ]),
    )

    render(<ConversationRail search={defaultSearch} />, {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(screen.getByText('María López')).toBeInTheDocument()
    })
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
  })

  it('renders no_conversations empty state when list is empty with default filters', async () => {
    mockCustomFetch.mockResolvedValueOnce(makeResponse([]))

    render(<ConversationRail search={defaultSearch} />, {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(
        screen.getByText('Las conversaciones se inician con invitaciones de conexión'),
      ).toBeInTheDocument()
    })
  })

  it('shows error state with retry button', async () => {
    mockCustomFetch.mockRejectedValueOnce(new Error('Network error'))

    render(<ConversationRail search={defaultSearch} />, {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(
        screen.getByText('No se pudieron cargar las conversaciones'),
      ).toBeInTheDocument()
    })
    expect(screen.getByText('Reintentar')).toBeInTheDocument()
  })

  it('renders no_search_results empty state when search is active', async () => {
    mockCustomFetch.mockResolvedValueOnce(makeResponse([]))

    render(<ConversationRail search={{ ...defaultSearch, search: 'foo' }} />, {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(
        screen.getByText('No hay conversaciones que coincidan'),
      ).toBeInTheDocument()
    })
  })

  it('renders campaign empty state when campaign_id is set and no conversations', async () => {
    mockCustomFetch.mockResolvedValueOnce(makeResponse([]))

    render(
      <ConversationRail
        search={{ filter: 'all', search: undefined, campaign_id: 'camp-1' }}
      />,
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(
        screen.getByText('No hay conversaciones para esta campaña'),
      ).toBeInTheDocument()
    })
  })

  it('renders no_filter_results empty state when filter is active', async () => {
    mockCustomFetch.mockResolvedValueOnce(makeResponse([]))

    render(
      <ConversationRail search={{ ...defaultSearch, filter: 'unread' }} />,
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(
        screen.getByText('No hay conversaciones no leídas'),
      ).toBeInTheDocument()
    })
  })

  it('renders campaign filter for brand when URL has no campaign_id (Zod omits key)', async () => {
    // Regression: brandWorkspaceSearchSchema.parse({}) yields an object WITHOUT
    // a campaign_id property, so `'campaign_id' in search` is false. The rail
    // must not gate the CampaignFilterSelect on that key being present.
    const search = brandWorkspaceSearchSchema.parse({ filter: 'all' })
    expect('campaign_id' in search).toBe(false)

    mockCustomFetch.mockResolvedValueOnce(
      makeResponse([makeConversation('1', 'María López')]),
    )
    vi.spyOn(activeCampaignsModule, 'useActiveCampaigns').mockReturnValue({
      data: [
        {
          id: 'camp-1',
          name: 'Seed Campaign',
          status: 'active',
          budget_currency: 'USD',
          budget_remaining: '0.00',
        },
      ],
      isLoading: false,
    } as ReturnType<typeof activeCampaignsModule.useActiveCampaigns>)

    render(<ConversationRail search={search} sessionKind="brand" />, {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(screen.getByLabelText('Filtrar por campaña')).toBeInTheDocument()
    })
  })

  it('renders list role for accessibility', async () => {
    mockCustomFetch.mockResolvedValueOnce(
      makeResponse([makeConversation('1', 'Test User')]),
    )

    render(<ConversationRail search={defaultSearch} />, {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(screen.getByRole('list')).toBeInTheDocument()
    })
  })
})
