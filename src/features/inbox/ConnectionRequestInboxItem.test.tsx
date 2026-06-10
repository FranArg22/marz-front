import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useAcceptDiscoveryConnectionRequest,
  useRejectDiscoveryConnectionRequest,
} from '#/shared/api/generated/creator/creator'
import { useGetDiscoveryConnectionRequest } from '#/shared/api/generated/discovery/discovery'
import { ApiError } from '#/shared/api/mutator'

import type { InboxItem } from './api/inbox'
import { ConnectionRequestInboxItem } from './ConnectionRequestInboxItem'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), info: vi.fn(), success: vi.fn() },
}))

const navigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
}))

const invalidateQueries = vi.fn().mockResolvedValue(undefined)
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries }),
}))

vi.mock('#/shared/api/generated/creator/creator', () => ({
  useAcceptDiscoveryConnectionRequest: vi.fn(),
  useRejectDiscoveryConnectionRequest: vi.fn(),
}))

vi.mock('#/shared/api/generated/discovery/discovery', () => ({
  useGetDiscoveryConnectionRequest: vi.fn(),
}))

const mockUseAccept = vi.mocked(useAcceptDiscoveryConnectionRequest)
const mockUseReject = vi.mocked(useRejectDiscoveryConnectionRequest)
const mockUseGet = vi.mocked(useGetDiscoveryConnectionRequest)

let acceptOptions: { mutation?: Record<string, unknown> } | undefined
let rejectOptions: { mutation?: Record<string, unknown> } | undefined
const acceptMutate = vi.fn()
const rejectMutate = vi.fn()

function makeItem(connectionRequestId?: string): InboxItem {
  return {
    id: 'item-1',
    section: 'action',
    kind: 'connection_request_received',
    status: 'pending',
    campaign: null,
    counterpart: null,
    meta: { primary: 'Marca SA', secondary: '', timestamp: 'hoy' },
    title: 'Solicitud',
    preview: '',
    occurred_at: '2026-06-01T00:00:00Z',
    source_ref: { type: 'connection_request', id: 'cr-1' },
    inline_actions: [],
    navigation_action: null,
    can_mark_read: true,
    metadata:
      connectionRequestId === undefined
        ? {}
        : { connection_request_id: connectionRequestId },
  } as unknown as InboxItem
}

describe('ConnectionRequestInboxItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    acceptOptions = undefined
    rejectOptions = undefined

    mockUseAccept.mockImplementation((options) => {
      acceptOptions = options as typeof acceptOptions
      return { mutate: acceptMutate, isPending: false } as unknown as ReturnType<
        typeof useAcceptDiscoveryConnectionRequest
      >
    })
    mockUseReject.mockImplementation((options) => {
      rejectOptions = options as typeof rejectOptions
      return { mutate: rejectMutate, isPending: false } as unknown as ReturnType<
        typeof useRejectDiscoveryConnectionRequest
      >
    })
    mockUseGet.mockReturnValue({
      data: undefined,
    } as unknown as ReturnType<typeof useGetDiscoveryConnectionRequest>)
  })

  it('renders nothing when the connection_request_id is missing', () => {
    const { container } = render(<ConnectionRequestInboxItem item={makeItem()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('accept: mutates with the connection request id', async () => {
    const user = userEvent.setup()
    render(<ConnectionRequestInboxItem item={makeItem('cr-1')} />)

    await user.click(screen.getByRole('button', { name: /Aceptar/ }))
    expect(acceptMutate).toHaveBeenCalledWith({ id: 'cr-1' })
  })

  it('accept success: navigates to the new conversation and invalidates inbox', async () => {
    render(<ConnectionRequestInboxItem item={makeItem('cr-1')} />)

    await (
      acceptOptions?.mutation?.onSuccess as (data: unknown) => Promise<void>
    )({ status: 200, data: { conversation_id: 'conv-7' } })

    expect(invalidateQueries).toHaveBeenCalled()
    expect(navigate).toHaveBeenCalledWith({
      to: '/workspace/conversations/$conversationId',
      params: { conversationId: 'conv-7' },
    })
  })

  it('accept error 410: shows an expired toast and refreshes the inbox', () => {
    render(<ConnectionRequestInboxItem item={makeItem('cr-1')} />)
    ;(acceptOptions?.mutation?.onError as (error: unknown) => void)(
      new ApiError(410, 'connection_request_expired', 'Gone'),
    )

    expect(toast.error).toHaveBeenCalledWith('Esta invitación ya venció.')
    expect(invalidateQueries).toHaveBeenCalled()
  })

  it('accept error (non-410): shows a generic toast', () => {
    render(<ConnectionRequestInboxItem item={makeItem('cr-1')} />)
    ;(acceptOptions?.mutation?.onError as (error: unknown) => void)(
      new ApiError(500, 'boom', 'Server error'),
    )

    expect(toast.error).toHaveBeenCalledWith('Algo salió mal. Intentá de nuevo.')
  })

  it('reject: mutates with the connection request id', async () => {
    const user = userEvent.setup()
    render(<ConnectionRequestInboxItem item={makeItem('cr-1')} />)

    await user.click(screen.getByRole('button', { name: /Rechazar/ }))
    expect(rejectMutate).toHaveBeenCalledWith({ id: 'cr-1' })
  })

  it('reject error: shows a generic toast', () => {
    render(<ConnectionRequestInboxItem item={makeItem('cr-1')} />)
    ;(rejectOptions?.mutation?.onError as () => void)()

    expect(toast.error).toHaveBeenCalledWith('Algo salió mal. Intentá de nuevo.')
  })
})
