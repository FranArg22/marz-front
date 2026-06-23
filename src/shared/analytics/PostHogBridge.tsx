import { useEffect } from 'react'

import { useUser } from '@clerk/tanstack-react-start'

import { identifyPosthogUser, resetPosthogUser } from './posthog'

/**
 * Vincula la sesión de PostHog con el usuario de Clerk: `identify` al loguear,
 * `reset` al desloguear. Se monta dentro de `ClerkProvider`. No renderiza UI.
 *
 * No-op cuando PostHog no está inicializado (sin `VITE_POSTHOG_KEY` o en E2E):
 * los helpers chequean el flag interno.
 */
export function PostHogBridge() {
  const { isLoaded, isSignedIn, user } = useUser()

  const enabled = isLoaded && !import.meta.env.VITE_E2E
  const userId = isSignedIn ? user.id : undefined
  const email = user?.primaryEmailAddress?.emailAddress
  const name = user?.fullName ?? undefined

  useEffect(() => {
    if (!enabled) return

    if (userId) {
      const properties: Record<string, string> = {}
      if (email) properties.email = email
      if (name) properties.name = name
      identifyPosthogUser(userId, properties)
    } else {
      resetPosthogUser()
    }
  }, [enabled, userId, email, name])

  return null
}
