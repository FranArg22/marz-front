import { t } from '@lingui/core/macro'

export interface ShellNavigationItem {
  id: string
  label: () => string
  icon: string
  href?: string
  disabled?: boolean
  disabledReason?: () => string
}

export interface ShellNavigationConfig {
  brand: ShellNavigationItem[]
  creator: ShellNavigationItem[]
}

export const shellNavigationConfig: ShellNavigationConfig = {
  brand: [
    {
      id: 'dashboard',
      label: () => t`Dashboard`,
      icon: 'layout-dashboard',
      href: '/inicio',
    },
    {
      id: 'discovery',
      label: () => t`Explorar`,
      icon: 'compass',
      href: '/discovery',
    },
    {
      id: 'inbox',
      label: () => t`Inbox`,
      icon: 'inbox',
      href: '/inbox',
    },
    {
      id: 'workspace',
      label: () => t`Workspace`,
      icon: 'message-square',
      href: '/workspace',
    },
    {
      id: 'campaigns',
      label: () => t`Campañas`,
      icon: 'megaphone',
      href: '/campaigns',
    },
    {
      id: 'creators',
      label: () => t`Creadores`,
      icon: 'users',
      href: '/creators',
    },
    {
      id: 'videos',
      label: () => t`Videos`,
      icon: 'video',
      href: '/videos',
    },
    {
      id: 'payments',
      label: () => t`Pagos`,
      icon: 'wallet',
      href: '/payments',
    },
    {
      id: 'settings',
      label: () => t`Ajustes`,
      icon: 'settings',
      href: '/ajustes',
    },
  ],
  creator: [
    {
      id: 'inbox',
      label: () => t`Inbox`,
      icon: 'inbox',
      href: '/inbox',
    },
    {
      id: 'workspace',
      label: () => t`Workspace`,
      icon: 'message-square',
      href: '/workspace',
    },
    {
      id: 'campaigns',
      label: () => t`Campañas`,
      icon: 'briefcase',
      href: '/discover/campaigns',
    },
    {
      id: 'earnings',
      label: () => t`Ganancias`,
      icon: 'dollar-sign',
      href: '/earnings',
    },
    {
      id: 'settings',
      label: () => t`Ajustes`,
      icon: 'settings',
      href: '/settings',
    },
  ],
}

export function resolveActiveSidebarItem(
  items: ShellNavigationItem[],
  pathname: string,
): ShellNavigationItem | null {
  let activeItem: ShellNavigationItem | null = null
  let activeHrefLength = 0

  for (const item of items) {
    if (item.disabled || !item.href) {
      continue
    }

    const matchesPath =
      pathname === item.href || pathname.startsWith(`${item.href}/`)

    if (!matchesPath) {
      continue
    }

    if (!activeItem || item.href.length > activeHrefLength) {
      activeItem = item
      activeHrefLength = item.href.length
    }
  }

  return activeItem
}
