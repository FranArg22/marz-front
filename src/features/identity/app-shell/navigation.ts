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

const DISABLED_REASON = () => t`Próximamente`

export const shellNavigationConfig: ShellNavigationConfig = {
  brand: [
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
      label: () => t`Campaigns`,
      icon: 'megaphone',
      href: '/campaigns',
    },
    {
      id: 'payments',
      label: () => t`Payments & Spending`,
      icon: 'wallet',
      href: '/payments',
    },
    {
      id: 'creators',
      label: () => t`Creators`,
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
      id: 'analytics',
      label: () => t`Analytics`,
      icon: 'bar-chart-3',
      disabled: true,
      disabledReason: DISABLED_REASON,
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
      label: () => t`Campaigns`,
      icon: 'briefcase',
      href: '/discover/campaigns',
    },
    {
      id: 'earnings',
      label: () => t`Earnings`,
      icon: 'dollar-sign',
      href: '/earnings',
    },
    {
      id: 'analytics',
      label: () => t`Analytics`,
      icon: 'bar-chart-3',
      disabled: true,
      disabledReason: DISABLED_REASON,
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
