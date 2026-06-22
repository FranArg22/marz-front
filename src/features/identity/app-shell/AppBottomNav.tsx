import { useState } from 'react'

import { Link } from '@tanstack/react-router'
import { Menu } from 'lucide-react'

import { t } from '@lingui/core/macro'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { cn } from '#/lib/utils'

import { resolveActiveSidebarItem, shellNavigationConfig } from './navigation'
import type { ShellNavigationItem } from './navigation'
import { resolveNavIcon } from './navigationIcons'

type AppBottomNavAccountKind = 'brand' | 'creator'

interface AppBottomNavProps {
  accountKind: AppBottomNavAccountKind
  pathname: string
  /** Muestra el puntito de notificación sobre el ícono de inbox. */
  inboxHasBadge?: boolean
}

/** Máximo de slots visibles en la barra; el último se reserva para "Menú"
 * cuando el ambiente tiene más secciones que las que entran. */
const MAX_SLOTS = 5

function tabClassName(isActive: boolean, disabled = false) {
  return cn(
    'relative z-10 flex w-16 flex-col items-center gap-1 rounded-full py-1.5 text-[10px] font-medium leading-none transition-colors duration-150 ease-[var(--ease-out-quint)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
    isActive ? 'text-white' : 'text-white/60',
    disabled && 'cursor-not-allowed opacity-50',
  )
}

/**
 * Barra de navegación inferior flotante para mobile. Reemplaza al `AppSidebar`
 * (oculto por debajo de `md:`) reusando los mismos items, iconos, labels y
 * rutas. Si el ambiente tiene más de `MAX_SLOTS` secciones, las que sobran se
 * agrupan en un popover "Menú". En desktop no se renderiza.
 */
export function AppBottomNav({
  accountKind,
  pathname,
  inboxHasBadge = false,
}: AppBottomNavProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const items = shellNavigationConfig[accountKind]
  const activeItem = resolveActiveSidebarItem(items, pathname)

  const hasMenu = items.length > MAX_SLOTS
  const mainItems = hasMenu ? items.slice(0, MAX_SLOTS - 1) : items
  const menuItems = hasMenu ? items.slice(MAX_SLOTS - 1) : []

  const activeMainIndex = mainItems.findIndex(
    (item) => item.id === activeItem?.id,
  )
  const isMenuActive =
    hasMenu && menuItems.some((item) => item.id === activeItem?.id)
  const activeIndex =
    activeMainIndex >= 0
      ? activeMainIndex
      : isMenuActive
        ? mainItems.length
        : -1

  const renderTab = (item: ShellNavigationItem) => {
    const Icon = resolveNavIcon(item.icon)
    const isActive = activeItem?.id === item.id
    const disabled = item.disabled === true
    const label = item.label()
    const showBadge = item.id === 'inbox' && inboxHasBadge

    const content = (
      <>
        <span className="relative">
          <Icon aria-hidden="true" className="size-[22px]" />
          {showBadge ? (
            <span
              aria-hidden="true"
              className="absolute -right-1 -top-0.5 size-2 rounded-full bg-red-600"
            />
          ) : null}
        </span>
        <span className="max-w-full truncate">{label}</span>
      </>
    )

    if (disabled || !item.href) {
      return (
        <button
          key={item.id}
          type="button"
          aria-label={label}
          aria-disabled={disabled ? 'true' : undefined}
          className={tabClassName(isActive, disabled)}
        >
          {content}
        </button>
      )
    }

    return (
      <Link
        key={item.id}
        to={item.href}
        aria-label={label}
        aria-current={isActive ? ('page' as const) : undefined}
        className={cn(tabClassName(isActive), 'active:scale-95')}
      >
        {content}
      </Link>
    )
  }

  return (
    <nav
      data-testid="app-bottom-nav"
      aria-label={t`Navegación`}
      className="fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4 md:hidden"
    >
      <div className="relative flex items-center rounded-full border border-white/10 bg-zinc-900/60 px-1.5 py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        {activeIndex >= 0 ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-1.5 left-1.5 w-16 px-1 transition-transform duration-200 ease-[var(--ease-out-quint)] motion-reduce:transition-none"
            style={{ transform: `translateX(${activeIndex * 4}rem)` }}
          >
            <span className="block size-full rounded-full bg-white/15" />
          </span>
        ) : null}
        {mainItems.map(renderTab)}
        {hasMenu ? (
          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverTrigger
              className={cn(tabClassName(isMenuActive), 'active:scale-95')}
            >
              <Menu aria-hidden="true" className="size-[22px]" />
              <span className="max-w-full truncate">{t`Menú`}</span>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="end"
              sideOffset={12}
              className="w-auto origin-[var(--radix-popover-content-transform-origin)] rounded-3xl border-white/10 bg-zinc-900/60 p-3 text-white shadow-[0_8px_30px_rgba(0,0,0,0.45)] backdrop-blur-xl"
            >
              <div className="grid grid-cols-5">
                {menuItems.map((item) => {
                  const Icon = resolveNavIcon(item.icon)
                  const isActive = activeItem?.id === item.id
                  const disabled = item.disabled === true
                  const label = item.label()

                  const cellContent = (
                    <>
                      <span
                        className={cn(
                          'flex size-12 items-center justify-center rounded-full transition-colors duration-150 ease-[var(--ease-out-quint)]',
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-white/10 text-white/80',
                        )}
                      >
                        <Icon aria-hidden="true" className="size-5" />
                      </span>
                      <span className="w-full truncate text-center text-[10px] font-medium leading-none text-white/90">
                        {label}
                      </span>
                    </>
                  )

                  const cellClassName =
                    'flex w-16 flex-col items-center gap-1.5 rounded-2xl py-1 outline-none focus-visible:ring-2 focus-visible:ring-white/40'

                  if (disabled || !item.href) {
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-label={label}
                        aria-disabled={disabled ? 'true' : undefined}
                        className={cn(
                          cellClassName,
                          disabled && 'cursor-not-allowed opacity-50',
                        )}
                      >
                        {cellContent}
                      </button>
                    )
                  }

                  return (
                    <Link
                      key={item.id}
                      to={item.href}
                      aria-label={label}
                      aria-current={isActive ? ('page' as const) : undefined}
                      onClick={() => setMenuOpen(false)}
                      className={cn(cellClassName, 'active:scale-95')}
                    >
                      {cellContent}
                    </Link>
                  )
                })}
              </div>
            </PopoverContent>
          </Popover>
        ) : null}
      </div>
    </nav>
  )
}
