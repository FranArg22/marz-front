import { t } from '@lingui/core/macro'

import { TooltipProvider } from '#/components/ui/tooltip'
import { cn } from '#/lib/utils'

import { AppSidebarItem } from './AppSidebarItem'
import { resolveActiveSidebarItem, shellNavigationConfig } from './navigation'
import type { ShellNavigationItem } from './navigation'
import { resolveNavIcon } from './navigationIcons'

type AppSidebarAccountKind = 'brand' | 'creator'

interface AppSidebarProps {
  accountKind: AppSidebarAccountKind
  pathname: string
  className?: string
  /** Muestra el puntito de notificación sobre el ícono de inbox. */
  inboxHasBadge?: boolean
}

export function AppSidebar({
  accountKind,
  pathname,
  className,
  inboxHasBadge = false,
}: AppSidebarProps) {
  const items = shellNavigationConfig[accountKind]
  const activeItem = resolveActiveSidebarItem(items, pathname)

  const renderItem = (
    item: ShellNavigationItem,
    hasMovingIndicator = false,
  ) => {
    const Icon = resolveNavIcon(item.icon)
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
        hasMovingIndicator={hasMovingIndicator}
        showBadge={item.id === 'inbox' && inboxHasBadge}
      />
    )
  }

  const footerItem = items.find((item) => item.id === 'settings')
  const mainItems = items.filter((item) => item.id !== 'settings')
  const activeMainIndex = mainItems.findIndex(
    (item) => item.id === activeItem?.id,
  )

  return (
    <TooltipProvider>
      <aside
        data-testid="app-sidebar"
        data-width="59px"
        aria-label={t`Navegación principal`}
        className={cn(
          'flex h-full w-[59px] shrink-0 flex-col items-center bg-sidebar',
          className,
        )}
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
        <div className="relative flex w-full flex-1 flex-col items-center gap-2 py-4">
          {activeMainIndex >= 0 ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-4 left-1/2 size-11 rounded-[20px] bg-sidebar-accent transition-transform duration-200 ease-[var(--ease-out-quint)] motion-reduce:transition-none"
              style={{
                transform: `translate(-50%, calc(${activeMainIndex} * 3.25rem))`,
              }}
            />
          ) : null}
          {mainItems.map((item) => renderItem(item, true))}
          {footerItem ? (
            <div className="mt-auto">{renderItem(footerItem)}</div>
          ) : null}
        </div>
      </aside>
    </TooltipProvider>
  )
}
