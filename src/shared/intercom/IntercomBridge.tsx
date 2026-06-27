import { useEffect } from 'react'

import { useUser } from '@clerk/tanstack-react-start'

import { env } from '#/env'
import { useIsMobile } from '#/shared/hooks/useIsMobile'

import { bootIntercom, onUnreadCountChange, shutdownIntercom } from './intercom'
import { useIntercomStore } from './store'

/**
 * Arranca el Messenger de Intercom para el usuario logueado e identifica la
 * sesión (Opción 2: usuarios identificados, sin verificación HMAC).
 *
 * - Desktop usa el launcher nativo de Intercom (burbuja abajo a la derecha).
 * - Mobile lo oculta (`hide_default_launcher`) y muestra un tab propio
 *   (`IntercomMobileTab`) que abre el mismo Messenger.
 *
 * Se monta dentro de `ClerkProvider`. No renderiza UI.
 */
export function IntercomBridge() {
  const { isLoaded, isSignedIn, user } = useUser()
  const isMobile = useIsMobile()
  const setUnreadCount = useIntercomStore((s) => s.setUnreadCount)

  // No cargamos el widget externo durante los tests e2e (evita flakiness).
  const enabled = isLoaded && isSignedIn && !import.meta.env.VITE_E2E

  const userId = user?.id
  const email = user?.primaryEmailAddress?.emailAddress
  const name = user?.fullName ?? undefined
  const createdAt = user?.createdAt
    ? Math.floor(user.createdAt.getTime() / 1000)
    : undefined

  // Boot + identify. Re-ejecuta ante cambios de identidad o de breakpoint: el
  // SDK re-vincula y actualiza la config (incluido `hide_default_launcher`) sin
  // recargar el widget.
  useEffect(() => {
    if (!enabled || !userId) return

    bootIntercom({
      app_id: env.VITE_INTERCOM_APP_ID,
      region: 'us',
      user_id: userId,
      email,
      name,
      created_at: createdAt,
      hide_default_launcher: isMobile,
      // En desktop subimos el launcher para que no tape botones clave
      // (p. ej. "Continuar"). En mobile el launcher nativo está oculto.
      vertical_padding: isMobile ? undefined : 88,
    })
    onUnreadCountChange(setUnreadCount)
  }, [enabled, userId, email, name, createdAt, isMobile, setUnreadCount])

  // Cierra la sesión de Intercom al desloguear o desmontar.
  useEffect(() => {
    if (!enabled) return

    return () => {
      shutdownIntercom()
      setUnreadCount(0)
    }
  }, [enabled, setUnreadCount])

  return null
}
