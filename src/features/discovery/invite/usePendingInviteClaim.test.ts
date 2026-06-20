import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { storePendingInviteToken } from './pendingInvite'
import { usePendingInviteClaim } from './usePendingInviteClaim'

const mockNavigate = vi.fn()
const mockAcceptInviteByToken = vi.fn()
const mockInvalidateQueries = vi.fn()

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('#/features/inbox/api/inbox', () => ({
  inboxQueryKey: ['inbox'],
}))

vi.mock('./acceptInviteByToken', () => ({
  acceptInviteByToken: (token: string) => mockAcceptInviteByToken(token),
}))

describe('usePendingInviteClaim', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
    window.localStorage.clear()
  })

  it('redeems a stored invite token into the creator inbox', async () => {
    const setTimeoutSpy = vi.spyOn(window, 'setTimeout')
    mockAcceptInviteByToken.mockResolvedValue({
      connection_request_id: 'connection-request-1',
      route: '/inbox',
    })
    storePendingInviteToken('invite-token')

    renderHook(() => usePendingInviteClaim())

    await waitFor(() => {
      expect(mockAcceptInviteByToken).toHaveBeenCalledWith('invite-token')
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/inbox' })
    })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['inbox'],
    })
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1000)
    expect(window.localStorage.getItem('marz.pending_invite_token')).toBeNull()
    expect(mockNavigate).not.toHaveBeenCalledWith(
      expect.objectContaining({ to: '/workspace/conversations/$conversationId' }),
    )
  })
})
