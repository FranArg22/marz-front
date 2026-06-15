import type { ReactNode } from 'react'

import { cn } from '#/lib/utils'

interface SettingsCardProps {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}

// Patrón de las pantallas de Ajustes (diseño marzv2): card con header
// (título + subtítulo) y filas internas separadas por divisores.
export function SettingsCard({
  title,
  description,
  children,
  footer,
}: SettingsCardProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <header className="px-6 py-5">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </header>
      <div className="divide-y divide-border border-t border-border">
        {children}
      </div>
      {footer ? (
        <div className="border-t border-border px-6 py-4">{footer}</div>
      ) : null}
    </section>
  )
}

interface SettingsRowProps {
  label: string
  hint?: string
  required?: boolean
  /** Alinea el control arriba (para textarea/grupos altos) en vez de centrado. */
  align?: 'center' | 'start'
  children: ReactNode
}

// Fila label-izquierda / control-derecha del patrón de Ajustes.
export function SettingsRow({
  label,
  hint,
  required,
  align = 'center',
  children,
}: SettingsRowProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 px-6 py-4 md:flex-row md:gap-6',
        align === 'center' ? 'md:items-center' : 'md:items-start',
      )}
    >
      <div className="md:w-2/5 md:shrink-0 md:pt-1.5">
        <span className="text-sm font-medium text-foreground">
          {label}
          {required ? <span className="ml-0.5 text-destructive">*</span> : null}
        </span>
        {hint ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </div>
      <div className="min-w-0 md:flex-1">{children}</div>
    </div>
  )
}
