import { t } from '@lingui/core/macro'
import type { LucideIcon } from 'lucide-react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'

export interface SettingsMobileNavItem {
  id: string
  label: string
  icon: LucideIcon
}

interface SettingsMobileNavProps {
  items: SettingsMobileNavItem[]
  activeId: string
  onSelect: (id: string) => void
}

/**
 * Selector de sección de ajustes para mobile (oculto en `md:`).
 * Compartido entre los ajustes de marca y de creador para que ambas
 * pantallas resuelvan la navegación de la misma forma.
 */
export function SettingsMobileNav({
  items,
  activeId,
  onSelect,
}: SettingsMobileNavProps) {
  return (
    <div className="shrink-0 border-b border-border bg-background px-4 py-3 md:hidden">
      <Select value={activeId} onValueChange={onSelect}>
        <SelectTrigger
          aria-label={t`Secciones de ajustes`}
          className="h-11 w-full rounded-xl bg-card text-sm font-medium"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => {
            const Icon = item.icon
            return (
              <SelectItem key={item.id} value={item.id}>
                <Icon aria-hidden="true" className="size-4" />
                {item.label}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  )
}
