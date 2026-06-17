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
  },
  {
    id: 'subscription',
    label: () => t`Suscripción`,
    icon: CreditCard,
    href: '/ajustes/suscripcion',
  },
] as const

export function SettingsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-normal text-foreground">
              {t`Ajustes`}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t`Gestioná el perfil de marca y la suscripción del workspace.`}
            </p>
          </div>
          <nav aria-label={t`Secciones de ajustes`} className="flex gap-5">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon
              const active =
                pathname === tab.href || pathname.startsWith(`${tab.href}/`)

              return (
                <Link
                  key={tab.id}
                  to={tab.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative flex items-center gap-2 px-1 pb-3 pt-1 text-sm transition-colors',
                    active
                      ? 'font-semibold text-foreground'
                      : 'font-medium text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {tab.label()}
                  {active ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary"
                    />
                  ) : null}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto w-full max-w-5xl">
          <Outlet />
        </div>
      </div>
    </section>
  )
}
