import {
  BarChart3,
  Briefcase,
  BriefcaseBusiness,
  Compass,
  DollarSign,
  Inbox,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Settings,
  Users,
  Video,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { t } from '@lingui/core/macro'

import { TooltipProvider } from '#/components/ui/tooltip'

import { AppSidebarItem } from './AppSidebarItem'
import { resolveActiveSidebarItem, shellNavigationConfig } from './navigation'
import type { ShellNavigationItem } from './navigation'

type AppSidebarAccountKind = 'brand' | 'creator'

interface AppSidebarProps {
  accountKind: AppSidebarAccountKind
  pathname: string
}

const iconByName: Record<string, LucideIcon> = {
  'bar-chart-3': BarChart3,
  briefcase: Briefcase,
  'briefcase-business': BriefcaseBusiness,
  compass: Compass,
  'dollar-sign': DollarSign,
  inbox: Inbox,
  'layout-dashboard': LayoutDashboard,
  megaphone: Megaphone,
  'message-square': MessageSquare,
  settings: Settings,
  users: Users,
  video: Video,
  wallet: Wallet,
}

export function AppSidebar({ accountKind, pathname }: AppSidebarProps) {
  const items = shellNavigationConfig[accountKind]
  const activeItem = resolveActiveSidebarItem(items, pathname)

  const renderItem = (item: ShellNavigationItem) => {
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
  }

  const footerItem = items.find((item) => item.id === 'settings')
  const mainItems = items.filter((item) => item.id !== 'settings')

  return (
    <TooltipProvider>
      <aside
        data-testid="app-sidebar"
        data-width="64px"
        aria-label={t`Navegación principal`}
        className="flex h-full w-16 shrink-0 flex-col items-center bg-sidebar"
      >
        <div className="flex h-14 w-full shrink-0 items-center justify-center">
          <img
            src="/marz-mark-light.png"
            alt="Marz"
            className="size-8 rounded-[var(--radius-md)] object-contain dark:hidden"
          />
          <img
            src="/marz-mark-dark.png"
            alt="Marz"
            className="hidden size-8 rounded-[var(--radius-md)] object-contain dark:block"
          />
        </div>
        <div className="h-px w-7 bg-sidebar-border" />
        <div className="flex w-full flex-1 flex-col items-center gap-2 py-4">
          {mainItems.map(renderItem)}
          {footerItem ? (
            <div className="mt-auto">{renderItem(footerItem)}</div>
          ) : null}
        </div>
      </aside>
    </TooltipProvider>
  )
}
