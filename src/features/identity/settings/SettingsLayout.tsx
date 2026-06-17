import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { Building2, CreditCard } from 'lucide-react'

import { t } from '@lingui/core/macro'

import { cn } from '#/lib/utils'

const settingsTabs = [
  {
    id: 'general',
    label: () => t`General`,
    icon: Building2,
    href: '/ajustes/general',
    testId: 'settings.nav.general',
  },
  {
    id: 'subscription',
    label: () => t`Suscripción`,
    icon: CreditCard,
    href: '/ajustes/suscripcion',
    testId: 'settings.nav.subscription',
  },
] as const

export function SettingsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const activeTab =
    settingsTabs.find(
      (tab) => pathname === tab.href || pathname.startsWith(`${tab.href}/`),
    ) ?? settingsTabs[0]

  return (
    <section className="flex h-full min-h-0 overflow-hidden">
      <aside className="flex w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r border-border px-4 py-6">
        <div className="space-y-1 px-2">
          <h1 className="text-base font-semibold text-foreground">
            {t`Ajustes`}
          </h1>
          <p className="text-xs leading-normal text-muted-foreground">
            {t`Perfil de marca y suscripción del workspace.`}
          </p>
        </div>
        <nav
          aria-label={t`Secciones de ajustes`}
          className="flex flex-col gap-1"
        >
          {settingsTabs.map((tab) => {
            const Icon = tab.icon
            const active = tab.id === activeTab.id

            return (
              <Link
                key={tab.id}
                to={tab.href}
                data-testid={tab.testId}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors',
                  active
                    ? 'bg-muted font-semibold text-foreground'
                    : 'font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                )}
              >
                <Icon aria-hidden="true" className="size-4" />
                {tab.label()}
              </Link>
            )
          })}
        </nav>
      </aside>
      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-8">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          <h2 className="text-2xl font-semibold tracking-normal text-foreground">
            {activeTab.label()}
          </h2>
          <Outlet />
        </div>
      </div>
    </section>
  )
}
