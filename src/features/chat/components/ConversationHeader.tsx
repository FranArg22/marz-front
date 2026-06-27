import type { ReactNode } from 'react'
import { t } from '@lingui/core/macro'

import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { TooltipProvider } from '#/components/ui/tooltip'
import type { ConversationDetail } from '#/features/chat/types'

interface ConversationHeaderProps {
  conversation: ConversationDetail
  leadingSlot?: ReactNode
  trailingSlot?: ReactNode
  /** Si se provee, el avatar + nombre abren el perfil del creador. */
  onOpenProfile?: () => void
}

export function ConversationHeader({
  conversation,
  leadingSlot,
  trailingSlot,
  onOpenProfile,
}: ConversationHeaderProps) {
  const { counterpart } = conversation
  const fallback = counterpart.display_name.charAt(0).toUpperCase()
  const counterpartName = counterpart.display_name

  const identity = (
    <>
      <Avatar size="lg">
        {counterpart.avatar_url ? (
          <AvatarImage
            src={counterpart.avatar_url}
            alt={counterpart.display_name}
          />
        ) : null}
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-sm font-semibold text-foreground">
          {counterpart.display_name}
        </span>
        {counterpart.handle ? (
          <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
            @{counterpart.handle}
          </span>
        ) : null}
      </div>
    </>
  )

  return (
    <TooltipProvider>
      <header
        aria-label={t`Conversación con ${counterpartName}`}
        className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-5 py-3"
      >
        {leadingSlot}
        {onOpenProfile ? (
          <button
            type="button"
            onClick={onOpenProfile}
            aria-label={t`Ver perfil de ${counterpartName}`}
            className="-mx-2 flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {identity}
          </button>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {identity}
          </div>
        )}

        {trailingSlot}
      </header>
    </TooltipProvider>
  )
}
