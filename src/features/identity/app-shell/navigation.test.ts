import { describe, expect, it } from 'vitest'

import { resolveActiveSidebarItem, shellNavigationConfig } from './navigation'
import type { ShellNavigationItem } from './navigation'

const brandItems = shellNavigationConfig.brand
const creatorItems = shellNavigationConfig.creator

function itemIds(items: ShellNavigationItem[]) {
  return items.map((item) => item.id)
}

function enabledItemIds(items: ShellNavigationItem[]) {
  return items.reduce<string[]>((ids, item) => {
    if (!item.disabled) ids.push(item.id)
    return ids
  }, [])
}

describe('shellNavigationConfig', () => {
  it('defines brand items in order with dashboard first and disabled', () => {
    expect(itemIds(brandItems)).toEqual([
      'dashboard',
      'discovery',
      'inbox',
      'workspace',
      'campaigns',
      'creators',
      'videos',
      'payments',
      'settings',
    ])
    expect(enabledItemIds(brandItems)).toEqual([
      'discovery',
      'inbox',
      'workspace',
      'campaigns',
      'creators',
      'videos',
      'payments',
      'settings',
    ])
  })

  it('defines creator items in order with inbox, workspace, campaigns, earnings and settings enabled', () => {
    expect(itemIds(creatorItems)).toEqual([
      'inbox',
      'workspace',
      'campaigns',
      'earnings',
      'settings',
      'analytics',
    ])
    expect(enabledItemIds(creatorItems)).toEqual([
      'inbox',
      'workspace',
      'campaigns',
      'earnings',
      'settings',
    ])
  })

  it('uses message-square for the workspace icon', () => {
    const workspace = brandItems.find((item) => item.id === 'workspace')

    expect(workspace?.icon).toBe('message-square')
  })

  it('defines payments only for brand navigation with wallet icon', () => {
    const brandPayments = brandItems.find((item) => item.id === 'payments')
    const creatorPayments = creatorItems.find((item) => item.id === 'payments')

    expect(brandPayments?.id).toBe('payments')
    expect(brandPayments?.icon).toBe('wallet')
    expect(brandPayments?.href).toBe('/payments')
    expect(brandPayments?.label()).toBe('Pagos')
    expect(creatorPayments).toBeUndefined()
  })

  it('defines discovery for brand navigation with compass icon', () => {
    const brandDiscovery = brandItems.find((item) => item.id === 'discovery')
    const creatorDiscovery = creatorItems.find((item) => item.id === 'discovery')

    expect(brandDiscovery?.id).toBe('discovery')
    expect(brandDiscovery?.icon).toBe('compass')
    expect(brandDiscovery?.href).toBe('/discovery')
    expect(brandDiscovery?.label()).toBe('Explorar')
    expect(creatorDiscovery).toBeUndefined()
  })

  it('defines settings only for brand navigation with settings icon', () => {
    const brandSettings = brandItems.find((item) => item.id === 'settings')
    const creatorSettings = creatorItems.find((item) => item.id === 'settings')

    expect(brandSettings?.id).toBe('settings')
    expect(brandSettings?.icon).toBe('settings')
    expect(brandSettings?.href).toBe('/ajustes')
    expect(brandSettings?.label()).toBe('Ajustes')
    expect(creatorSettings).toBeUndefined()
  })

  it('keeps disabled items non-navigable', () => {
    const disabledItems = [...brandItems, ...creatorItems].filter(
      (item) => item.disabled,
    )

    expect(disabledItems.length).toBeGreaterThan(0)
    for (const item of disabledItems) {
      expect(item.href).toBeUndefined()
      expect(item.disabledReason?.()).toBe('Próximamente')
    }
  })
})

describe('resolveActiveSidebarItem', () => {
  it('resolves workspace for /workspace', () => {
    expect(resolveActiveSidebarItem(brandItems, '/workspace')?.id).toBe(
      'workspace',
    )
  })

  it('resolves inbox for /inbox', () => {
    expect(resolveActiveSidebarItem(brandItems, '/inbox')?.id).toBe('inbox')
  })

  it('resolves payments for /payments descendants', () => {
    expect(resolveActiveSidebarItem(brandItems, '/payments')?.id).toBe(
      'payments',
    )
    expect(resolveActiveSidebarItem(brandItems, '/payments/export')?.id).toBe(
      'payments',
    )
  })

  it('resolves campaigns for /campaigns descendants', () => {
    expect(resolveActiveSidebarItem(brandItems, '/campaigns')?.id).toBe(
      'campaigns',
    )
    expect(resolveActiveSidebarItem(brandItems, '/campaigns/new')?.id).toBe(
      'campaigns',
    )
  })

  it('resolves discovery for /discovery descendants', () => {
    expect(resolveActiveSidebarItem(brandItems, '/discovery')?.id).toBe(
      'discovery',
    )
    expect(resolveActiveSidebarItem(brandItems, '/discovery/saved')?.id).toBe(
      'discovery',
    )
  })

  it('resolves settings for /ajustes descendants', () => {
    expect(resolveActiveSidebarItem(brandItems, '/ajustes')?.id).toBe(
      'settings',
    )
    expect(
      resolveActiveSidebarItem(brandItems, '/ajustes/suscripcion')?.id,
    ).toBe('settings')
  })

  it('returns null when no enabled item matches', () => {
    expect(resolveActiveSidebarItem(creatorItems, '/auth')).toBeNull()
  })

  it('returns the enabled item with the longest href match', () => {
    const items: ShellNavigationItem[] = [
      {
        id: 'workspace',
        label: () => 'Workspace',
        icon: 'message-square',
        href: '/workspace',
      },
      {
        id: 'conversation',
        label: () => 'Conversation',
        icon: 'message-square',
        href: '/workspace/conversations',
      },
    ]

    expect(
      resolveActiveSidebarItem(items, '/workspace/conversations/123')?.id,
    ).toBe('conversation')
  })
})
