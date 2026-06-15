import { t } from '@lingui/core/macro'
import { Clapperboard, Settings2, Share2, Users, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { cn } from '#/lib/utils'
import type { SettingsSection } from '#/routes/_creator/settings'

interface SettingsSidebarProps {
  activeSection: SettingsSection
  onSectionChange: (section: SettingsSection) => void
}

const settingsSections: Array<{
  id: SettingsSection
  label: () => string
  icon: LucideIcon
}> = [
  { id: 'general', label: () => t`General`, icon: Settings2 },
  { id: 'colaboraciones', label: () => t`Colaboraciones`, icon: Users },
  { id: 'redes-tarifas', label: () => t`Redes y tarifas`, icon: Share2 },
  { id: 'portfolio', label: () => t`Portfolio`, icon: Clapperboard },
  { id: 'billetera', label: () => t`Billetera`, icon: Wallet },
]

export function SettingsSidebar({
  activeSection,
  onSectionChange,
}: SettingsSidebarProps) {
  return (
    <aside
      aria-label={t`Secciones de ajustes`}
      className="w-full shrink-0 border-b border-border bg-background md:sticky md:top-0 md:h-full md:w-64 md:border-b-0 md:border-r"
    >
      <div className="hidden px-4 pt-6 pb-2 md:block">
        <h2 className="text-lg font-semibold text-foreground">{t`Ajustes`}</h2>
      </div>
      <nav className="flex gap-1 overflow-x-auto p-3 md:flex-col md:overflow-visible md:px-3 md:py-2">
        {settingsSections.map((section) => {
          const active = section.id === activeSection
          const label = section.label()
          const Icon = section.icon

          return (
            <button
              key={section.id}
              type="button"
              aria-current={active ? 'page' : undefined}
              onClick={() => onSectionChange(section.id)}
              className={cn(
                'flex h-10 shrink-0 items-center gap-2.5 rounded-md px-3 text-left text-sm font-medium text-muted-foreground transition-colors outline-none hover:bg-surface-hover hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 md:w-full',
                active && 'bg-primary/10 text-primary hover:bg-primary/10',
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {label}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
