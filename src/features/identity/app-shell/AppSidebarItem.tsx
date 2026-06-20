import { Link } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import { Tooltip as TooltipPrimitive } from 'radix-ui'

import { cn } from '#/lib/utils'

interface AppSidebarItemProps {
  label: string
  icon: LucideIcon
  href?: string
  active: boolean
  disabled: boolean
  tooltipLabel: string
  /** When true, the active background is drawn by the parent's sliding
   * indicator pill, so the item only contributes the active text color. */
  hasMovingIndicator?: boolean
}

export function AppSidebarItem({
  label,
  icon: Icon,
  href,
  active,
  disabled,
  tooltipLabel,
  hasMovingIndicator = false,
}: AppSidebarItemProps) {
  const itemClassName = cn(
    'relative z-10 flex size-11 items-center justify-center rounded-[20px] transition-[background-color,color,transform] duration-150 ease-[var(--ease-out-quint)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    active
      ? cn('text-primary', !hasMovingIndicator && 'bg-sidebar-accent')
      : 'bg-transparent text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-foreground',
    disabled &&
      'cursor-not-allowed opacity-50 hover:bg-transparent active:scale-100',
  )

  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>
        {disabled || !href ? (
          <button
            type="button"
            aria-label={label}
            aria-disabled={disabled ? 'true' : undefined}
            className={itemClassName}
          >
            <Icon aria-hidden="true" className="size-[22px]" />
          </button>
        ) : (
          <Link
            to={href}
            aria-label={label}
            aria-current={active ? ('page' as const) : undefined}
            className={itemClassName}
          >
            <Icon aria-hidden="true" className="size-[22px]" />
          </Link>
        )}
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side="right"
          sideOffset={10}
          collisionPadding={8}
          className="z-50 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-950 shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
        >
          {tooltipLabel}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}
