import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

import { acceptInviteByToken } from './acceptInviteByToken'
import {
  clearPendingInviteToken,
  readPendingInviteToken,
} from './pendingInvite'

// Runs once when an onboarded creator enters the app. If they arrived through a
// brand invite link, the token was stored on the public landing before signup;
// here we redeem it (token-based, any email) and drop them into the conversation
// with the inviting brand.
export function usePendingInviteClaim(): void {
  const navigate = useNavigate()
  const claimedRef = useRef(false)

  useEffect(() => {
    if (claimedRef.current) return
    const token = readPendingInviteToken()
    if (!token) return
    claimedRef.current = true
    clearPendingInviteToken()
    acceptInviteByToken(token)
      .then((result) => {
        void navigate({
          to: '/workspace/conversations/$conversationId',
          params: { conversationId: result.conversation_id },
          search: { filter: 'all', campaign_id: undefined },
        })
      })
      .catch(() => {
        // Best-effort: an expired/invalid token or transient error should not
        // surface as an error on app load — the creator stays where they are.
      })
  }, [navigate])
}
