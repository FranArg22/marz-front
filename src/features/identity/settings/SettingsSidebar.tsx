import { t } from '@lingui/core/macro'

import { cn } from '#/lib/utils'
import type { SettingsSection } from '#/routes/_creator/settings'

interface SettingsSidebarProps {
  activeSection: SettingsSection
  onSectionChange: (section: SettingsSection) => void
}

const settingsSections: Array<{
  id: SettingsSection
  label: () => string
}> = [
  { id: 'general', label: () => t`General` },
  { id: 'colaboraciones', label: () => t`Colaboraciones` },
  { id: 'redes-tarifas', label: () => t`Redes y tarifas` },
  { id: 'portfolio', label: () => t`Portfolio` },
  { id: 'billetera', label: () => t`Billetera` },
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
      <nav className="flex gap-1 overflow-x-auto p-3 md:flex-col md:overflow-visible md:p-4">
        {settingsSections.map((section) => {
          const active = section.id === activeSection
          const label = section.label()

          return (
            <button
              key={section.id}
              type="button"
              aria-current={active ? 'page' : undefined}
              onClick={() => onSectionChange(section.id)}
              className={cn(
                'h-10 shrink-0 rounded-md px-3 text-left text-sm font-medium text-muted-foreground transition-colors outline-none hover:bg-surface-hover hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 md:w-full',
                active && 'bg-primary/10 text-primary hover:bg-primary/10',
              )}
            >
              {label}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
