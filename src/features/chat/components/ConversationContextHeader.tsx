import { ChevronDown } from 'lucide-react'
import { t } from '@lingui/core/macro'

import type { ConversationDetailCounterpart } from '#/features/chat/types'

interface ConversationContextHeaderProps {
  counterpart: ConversationDetailCounterpart
  sessionKind: 'brand' | 'creator'
  /** Si se provee (solo brand), abre el perfil del creador al clickear. */
  onOpenProfile?: () => void
}

export function ConversationContextHeader({
  counterpart,
  sessionKind,
  onOpenProfile,
}: ConversationContextHeaderProps) {
  const fallback = counterpart.display_name.charAt(0).toUpperCase()
  const counterpartName = counterpart.display_name

  if (sessionKind === 'creator') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-4">
        <CounterpartAvatar
          src={counterpart.avatar_url}
          name={counterpart.display_name}
          fallback={fallback}
          size="lg"
        />
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-sm font-semibold text-foreground">
            {counterpart.display_name}
          </span>
        </div>
      </div>
    )
  }

  const content = (
    <>
      <CounterpartAvatar
        src={counterpart.avatar_url}
        name={counterpart.display_name}
        fallback={fallback}
        size="md"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
        <span className="truncate text-sm font-semibold text-foreground">
          {counterpart.display_name}
        </span>
        {counterpart.handle ? (
          <span className="truncate text-xs text-muted-foreground">
            @{counterpart.handle}
          </span>
        ) : null}
      </div>
      <ChevronDown
        aria-hidden="true"
        className="size-4 shrink-0 text-muted-foreground"
      />
    </>
  )

  if (onOpenProfile) {
    return (
      <button
        type="button"
        onClick={onOpenProfile}
        aria-label={t`Ver perfil de ${counterpartName}`}
        className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {content}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      {content}
    </div>
  )
}

interface CounterpartAvatarProps {
  src?: string | null
  name: string
  fallback: string
  size: 'md' | 'lg'
}

function CounterpartAvatar({
  src,
  name,
  fallback,
  size,
}: CounterpartAvatarProps) {
  /* eslint-disable-next-line lingui/no-unlocalized-strings -- Tailwind size classes are not translatable UI copy. */
  const sizeClass = size === 'lg' ? 'size-14 text-xl' : 'size-10 text-sm'

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary font-semibold text-primary-foreground`}
    >
      {src ? (
        <img src={src} alt={name} className="size-full object-cover" />
      ) : (
        <span>{fallback}</span>
      )}
    </div>
  )
}
