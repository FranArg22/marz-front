import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { cn } from '#/lib/utils'

interface ChatRailItemProps {
  name: string
  preview: string
  avatarUrl?: string
  avatarFallback?: string
  online?: boolean
  active?: boolean
  unread?: boolean
  /** Cantidad de mensajes sin leer; muestra un badge verde con el número. */
  unreadCount?: number
  variant?: 'full' | 'compact'
  onClick?: () => void
}

export function ChatRailItem({
  name,
  preview,
  avatarUrl,
  avatarFallback,
  online = false,
  active = false,
  unread = false,
  unreadCount = 0,
  variant = 'full',
  onClick,
}: ChatRailItemProps) {
  const compact = variant === 'compact'
  const unreadLabel = unreadCount > 99 ? '99+' : String(unreadCount)
  return (
    <button
      type="button"
      onClick={onClick}
      title={compact ? name : undefined}
      className={cn(
        'flex cursor-pointer items-center gap-3 text-left transition-colors',
        compact
          ? 'mx-auto size-10 justify-center rounded-full'
          : 'w-full justify-start rounded-full px-3 py-2.5',
        active ? 'bg-surface-active' : 'hover:bg-surface-hover',
      )}
    >
      <div className="relative shrink-0">
        <Avatar className="size-10">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
          <AvatarFallback>{avatarFallback ?? initials(name)}</AvatarFallback>
        </Avatar>
        {online ? (
          <span
            aria-hidden
            className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-card bg-success"
          />
        ) : null}
        {compact && unreadCount > 0 ? (
          <span
            aria-hidden
            className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-card bg-success px-1 text-[9px] font-semibold leading-none text-success-foreground"
          >
            {unreadLabel}
          </span>
        ) : null}
      </div>
      {compact ? null : (
        <>
          <div className="min-w-0 flex-1">
            <span
              className={cn(
                'block truncate text-sm',
                unread ? 'font-semibold' : 'font-medium',
              )}
            >
              {name}
            </span>
            <p className="truncate text-xs text-muted-foreground">{preview}</p>
          </div>
          {unreadCount > 0 ? (
            <span
              aria-hidden
              className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-success px-1.5 text-[11px] font-semibold leading-none text-success-foreground"
            >
              {unreadLabel}
            </span>
          ) : null}
        </>
      )}
    </button>
  )
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}
