import type { ReactNode } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import {
  BriefcaseBusiness,
  Building2,
  DollarSign,
  Inbox,
  MessageSquare,
} from 'lucide-react'

import { cn } from '#/lib/utils'
import { SignOutButton } from './SignOutButton'
import { SidebarTooltip } from './SidebarTooltip'

const creatorNavItems = [
  { label: 'Inbox', icon: Inbox, to: '/workspace' },
  { label: 'Messages', icon: MessageSquare, to: undefined },
  { label: 'Offers', icon: BriefcaseBusiness, to: '/offers' },
  { label: 'Earnings', icon: DollarSign, to: '/earnings' },
  { label: 'Campaign board', icon: Building2, to: undefined },
] as const

export function CreatorShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="flex w-[72px] shrink-0 flex-col items-center border-r border-sidebar-border bg-sidebar px-3 py-4 text-sidebar-foreground">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground">
          M
        </div>
        <div className="my-4 h-px w-7 bg-sidebar-border" />
        <nav aria-label="Creator navigation" className="flex flex-col gap-2">
          {creatorNavItems.map((item) => (
            <CreatorNavItem
              key={item.label}
              item={item}
              active={item.to ? pathname === item.to : false}
            />
          ))}
        </nav>
        <div className="mt-auto w-full border-t border-sidebar-border pt-2">
          <SignOutButton collapsed />
        </div>
      </aside>
      <main className="flex-1 min-w-0 overflow-auto">{children}</main>
    </div>
  )
}

interface CreatorNavItemProps {
  item: (typeof creatorNavItems)[number]
  active: boolean
}

function CreatorNavItem({ item, active }: CreatorNavItemProps) {
  const Icon = item.icon
  const className = cn(
    'group relative flex size-11 items-center justify-center rounded-2xl text-sidebar-foreground transition-colors',
    active
      ? 'bg-sidebar-accent text-sidebar-primary'
      : 'hover:bg-sidebar-accent hover:text-sidebar-primary',
    !item.to && 'cursor-not-allowed opacity-45 hover:bg-transparent',
  )
  const content = (
    <>
      <Icon className="size-5" aria-hidden="true" />
      <span className="pointer-events-none absolute left-full top-1/2 z-20 ml-3 hidden -translate-y-1/2 group-hover:block group-focus-visible:block">
        <SidebarTooltip label={item.label} />
      </span>
    </>
  )

  if (!item.to) {
    return (
      <button
        type="button"
        className={className}
        aria-label={item.label}
        aria-disabled="true"
      >
        {content}
      </button>
    )
  }

  return (
    <Link to={item.to} className={className} aria-label={item.label}>
      {content}
    </Link>
  )
}
