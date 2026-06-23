import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { t } from '@lingui/core/macro'

import { cn } from '#/lib/utils'

import { trackWorkspaceOpened } from './analytics'
import { useWorkspaceRailSubscription } from './useWorkspaceRailSubscription'
import { useConversationRailStore } from './conversationRailStore'

interface WorkspaceLayoutProps {
  railCompact?: ReactNode
  railFull?: ReactNode
  children: ReactNode
  sessionKind?: 'brand' | 'creator'
  /** En mobile el rail y la conversación son páginas excluyentes (estilo
   * WhatsApp): con una conversación abierta el rail se oculta y el chat ocupa
   * toda la pantalla. En `md+` ambos conviven. */
  hasActiveConversation?: boolean
}

export function WorkspaceLayout({
  railCompact,
  railFull,
  children,
  sessionKind,
  hasActiveConversation = false,
}: WorkspaceLayoutProps) {
  // WS disabled until backend exposes workspace_rail topic — enable when marz-api#ws-rail lands
  useWorkspaceRailSubscription({ enabled: false })

  const isRailOpen = useConversationRailStore((s) => s.isOpen)
  const closeRail = useConversationRailStore((s) => s.close)

  useEffect(() => {
    if (!sessionKind) return
    trackWorkspaceOpened({ session_kind: sessionKind })
  }, [sessionKind])

  return (
    <div className="relative flex h-full">
      {/* Rail inline:
          - mobile (<md): lista full-width, se oculta al abrir una conversación
          - tablet (md–xl): rail compacto de iconos
          - desktop (xl+): rail completo */}
      <aside
        role="region"
        aria-label={t`Chat`}
        className={cn(
          'shrink-0 overflow-hidden border-r border-border bg-background',
          'w-full md:w-14 xl:w-80',
          hasActiveConversation ? 'hidden md:block' : 'block',
        )}
      >
        <div className="relative h-full">
          <div className="absolute left-0 top-0 hidden h-full w-14 md:block xl:hidden">
            {railCompact}
          </div>
          <div className="absolute left-0 top-0 h-full w-full md:hidden xl:block xl:w-80">
            {railFull}
          </div>
        </div>
      </aside>

      {/* Drawer (tablet md–xl) para expandir el rail compacto */}
      <button
        type="button"
        aria-label={t`Cerrar conversaciones`}
        onClick={closeRail}
        aria-hidden={!isRailOpen}
        tabIndex={isRailOpen ? 0 : -1}
        className={cn(
          'absolute inset-0 z-20 hidden bg-foreground/20 transition-opacity duration-300 ease-out md:block xl:hidden',
          isRailOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <aside
        role="region"
        aria-label={t`Chat`}
        aria-hidden={!isRailOpen}
        className={cn(
          'absolute left-0 top-0 z-30 hidden h-full w-72 flex-col border-r border-border bg-background shadow-xl transition-transform duration-300 ease-out md:flex xl:hidden',
          isRailOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {railFull}
      </aside>

      <main
        className={cn(
          'flex-1 flex-col overflow-hidden',
          hasActiveConversation ? 'flex' : 'hidden md:flex',
        )}
      >
        {children}
      </main>
    </div>
  )
}
