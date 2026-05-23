import {
  BarChart3,
  Briefcase,
  BriefcaseBusiness,
  DollarSign,
  Inbox,
  Megaphone,
  MessageSquare,
  Users,
  Video,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { t } from '@lingui/core/macro'

import { TooltipProvider } from '#/components/ui/tooltip'

import { AppSidebarItem } from './AppSidebarItem'
import { resolveActiveSidebarItem, shellNavigationConfig } from './navigation'
import { useShellIdentityLabel } from './useShellIdentityLabel'

type AppSidebarAccountKind = 'brand' | 'creator'

interface AppSidebarProps {
  accountKind: AppSidebarAccountKind
  pathname: string
}

const iconByName: Record<string, LucideIcon> = {
  'bar-chart-3': BarChart3,
  briefcase: Briefcase,
  'briefcase-business': BriefcaseBusiness,
  'dollar-sign': DollarSign,
  inbox: Inbox,
  megaphone: Megaphone,
  'message-square': MessageSquare,
  users: Users,
  video: Video,
  wallet: Wallet,
}

export function AppSidebar({ accountKind, pathname }: AppSidebarProps) {
  const items = shellNavigationConfig[accountKind]
  const activeItem = resolveActiveSidebarItem(items, pathname)
  const initials = useShellIdentityLabel(accountKind)

  return (
    <TooltipProvider>
      <aside
        data-testid="app-sidebar"
        data-width="72px"
        aria-label={t`Navegación principal`}
        className="flex h-full w-[72px] shrink-0 flex-col items-center border-r border-sidebar-border bg-background"
      >
        <div className="flex h-14 w-full shrink-0 items-center justify-center">
          <div
            aria-hidden="true"
            className="flex size-9 items-center justify-center rounded-[var(--radius-md)] bg-primary text-base font-bold text-primary-foreground"
          >
            {initials}
          </div>
        </div>
        <div className="h-px w-7 bg-sidebar-border" />
        <div className="flex w-full flex-1 flex-col items-center gap-2 pt-4">
          {items.map((item) => {
            const Icon = iconByName[item.icon] ?? Inbox
            const disabled = item.disabled === true

            const label = item.label()
            const tooltipLabel = disabled
              ? (item.disabledReason?.() ?? t`Próximamente`)
              : label

            return (
              <AppSidebarItem
                key={item.id}
                label={label}
                icon={Icon}
                href={item.href}
                active={activeItem?.id === item.id}
                disabled={disabled}
                tooltipLabel={tooltipLabel}
              />
            )
          })}
        </div>
      </aside>
    </TooltipProvider>
  )
}
