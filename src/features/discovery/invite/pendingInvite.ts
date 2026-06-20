const STORAGE_KEY = 'marz.pending_invite_token'

// The invite token is captured on the public /invite/$token landing and read
// back after the creator finishes signup + onboarding, so they can be connected
// to the inviting brand even when they register with a different email.
export function storePendingInviteToken(token: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, token)
  } catch {
    // localStorage can be unavailable (private mode); the invite link still
    // works for already-signed-in creators, so this is best-effort.
  }
}

export function readPendingInviteToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function clearPendingInviteToken(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // best-effort
  }
}
