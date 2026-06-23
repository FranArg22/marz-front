import { ChevronLeft, MessageCircle } from 'lucide-react'

import { t } from '@lingui/core/macro'

import { showIntercom } from '#/shared/intercom/intercom'
import { useIntercomStore } from '#/shared/intercom/store'

/**
 * Tab compacto pegado al borde derecho, apenas por encima de la bottom-nav.
 * Solo mobile (`md:hidden`); en desktop usamos el launcher nativo de Intercom.
 * Reposa un poco metido contra el borde y se asienta al tocarlo, abriendo el
 * Messenger.
 */
export function IntercomMobileTab() {
  const unreadCount = useIntercomStore((s) => s.unreadCount)

  return (
    <button
      type="button"
      aria-label={t`Soporte`}
      onClick={() => showIntercom()}
      className="fixed right-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 flex translate-x-1 items-center gap-0.5 rounded-l-full border border-r-0 border-white/10 bg-zinc-900/70 py-2 pr-1.5 pl-2.5 text-white/70 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-transform duration-150 ease-[var(--ease-out-quint)] active:translate-x-0 active:scale-95 md:hidden"
    >
      <MessageCircle aria-hidden="true" className="size-4" />
      <ChevronLeft aria-hidden="true" className="-ml-0.5 size-3.5" />
      {unreadCount > 0 ? (
        <span
          aria-hidden="true"
          className="absolute -top-0.5 left-1 size-2 rounded-full bg-red-600"
        />
      ) : null}
    </button>
  )
}
