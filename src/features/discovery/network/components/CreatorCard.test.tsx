import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  DiscoveryCreatePairKindEnum,
  DiscoveryCreatorCard,
} from '#/shared/api/generated/model'

import { CreatorCard } from './CreatorCard'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

const navigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
}))

function makeCard(
  kind: DiscoveryCreatePairKindEnum,
  conversationId: string | null = null,
): DiscoveryCreatorCard {
  return {
    account_id: 'acc-1',
    display_name: 'Creator One',
    avatar_url: 'https://example.test/a.png',
    country: 'AR',
    age: 28,
    tags: [],
    platforms: [],
    pair_state: {
      kind,
      conversation_id: conversationId,
      last_connection_request_id: null,
    },
  }
}

describe('CreatorCard pair-state CTA mapping', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('no_contact: invite enabled, no reinvite warning, no chat CTA', () => {
    const onInvite = vi.fn()
    render(<CreatorCard card={makeCard('no_contact')} onInvite={onInvite} />)

    expect(screen.getByRole('button', { name: /Invitar/ })).toBeEnabled()
    expect(screen.queryByText('Ir al chat')).not.toBeInTheDocument()
  })

  it('connection_pending: no invite action, shows sent state badge', () => {
    render(
      <CreatorCard card={makeCard('connection_pending')} onInvite={vi.fn()} />,
    )

    expect(
      screen.queryByRole('button', { name: /Invitar/ }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('Invitación enviada')).toBeInTheDocument()
  })

  it('connection_rejected: re-invite is enabled with a warning tooltip', async () => {
    const user = userEvent.setup()
    const onInvite = vi.fn()
    render(
      <CreatorCard card={makeCard('connection_rejected')} onInvite={onInvite} />,
    )

    const inviteButton = screen.getByRole('button', {
      name: 'Invitar de nuevo',
    })
    expect(inviteButton).toBeEnabled()
    await user.click(inviteButton)
    expect(onInvite).toHaveBeenCalledTimes(1)
  })

  it('connection_expired: re-invite enabled', () => {
    render(
      <CreatorCard card={makeCard('connection_expired')} onInvite={vi.fn()} />,
    )

    expect(
      screen.getByRole('button', { name: 'Invitar de nuevo' }),
    ).toBeEnabled()
  })

  it('open_conversation: shows chat CTA and navigates on click', async () => {
    const user = userEvent.setup()
    render(
      <CreatorCard
        card={makeCard('open_conversation', 'conv-1')}
        onInvite={vi.fn()}
      />,
    )

    const chatButton = screen.getByRole('button', { name: 'Ir al chat' })
    expect(chatButton).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Invitar/ }),
    ).not.toBeInTheDocument()
    await user.click(chatButton)

    expect(navigate).toHaveBeenCalledWith({
      to: '/workspace/conversations/$conversationId',
      params: { conversationId: 'conv-1' },
    })
  })

  it('active_collaboration: no invite action, chat CTA present', () => {
    render(
      <CreatorCard
        card={makeCard('active_collaboration', 'conv-9')}
        onInvite={vi.fn()}
      />,
    )

    expect(screen.getByText('Colaborando')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Invitar/ }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ir al chat' })).toBeInTheDocument()
  })

  it('selection mode: toggles selection for an invitable creator', async () => {
    const user = userEvent.setup()
    const onToggleSelect = vi.fn()
    render(
      <CreatorCard
        card={makeCard('no_contact')}
        onInvite={vi.fn()}
        selectionMode
        onToggleSelect={onToggleSelect}
      />,
    )

    await user.click(
      screen.getByRole('button', { name: /Seleccionar Creator One/ }),
    )
    expect(onToggleSelect).toHaveBeenCalledWith('acc-1')
  })

  it('selection mode: shows the pair state instead of a checkbox for a non-invitable creator', async () => {
    const user = userEvent.setup()
    const onToggleSelect = vi.fn()
    render(
      <CreatorCard
        card={makeCard('connection_pending')}
        onInvite={vi.fn()}
        selectionMode
        onToggleSelect={onToggleSelect}
      />,
    )

    expect(screen.getByText('Invitación enviada')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: /Seleccionar Creator One/ }),
    )
    expect(onToggleSelect).not.toHaveBeenCalled()
  })
})
