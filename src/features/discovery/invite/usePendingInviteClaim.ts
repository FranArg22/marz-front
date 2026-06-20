import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

import { inboxQueryKey } from '#/features/inbox/api/inbox'

import { acceptInviteByToken } from './acceptInviteByToken'
import {
  clearPendingInviteToken,
  readPendingInviteToken,
} from './pendingInvite'

// Runs once when an onboarded creator enters the app. If they arrived through a
// brand invite link, redeem it into a pending inbox item instead of accepting
// the invite automatically.
export function usePendingInviteClaim({ enabled = true } = {}): void {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const claimedRef = useRef(false)

  useEffect(() => {
    if (!enabled) return
    if (claimedRef.current) return
    const token = readPendingInviteToken()
    if (!token) return
    claimedRef.current = true
    clearPendingInviteToken()
    acceptInviteByToken(token)
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: inboxQueryKey })
        window.setTimeout(() => {
          void queryClient.invalidateQueries({ queryKey: inboxQueryKey })
        }, 1000)
        void navigate({
          to: '/inbox',
        })
      })
      .catch(() => {
        // Best-effort: an expired/invalid token or transient error should not
        // surface as an error on app load — the creator stays where they are.
      })
  }, [enabled, navigate, queryClient])
}
