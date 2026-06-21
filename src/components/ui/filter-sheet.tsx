import type { ReactNode } from 'react'
import { useState } from 'react'

import { t } from '@lingui/core/macro'
import { SlidersHorizontal } from 'lucide-react'

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '#/components/ui/sheet'
import { cn } from '#/lib/utils'

interface FilterSheetProps {
  /** Cantidad de filtros activos; se muestra como badge en el botón. */
  activeCount?: number
  /** Acción de "Limpiar". Si no se pasa, no se muestra el botón. */
  onClear?: () => void
  /** Deshabilita "Limpiar" cuando no hay filtros activos. */
  clearDisabled?: boolean
  title?: string
  description?: string
  /** Controles del filtro, apilados a ancho completo dentro del sheet. */
  children: ReactNode
  /** Clases extra para el botón disparador. */
  triggerClassName?: string
}

/**
 * Botón "Filtros" + bottom sheet (drawer desde abajo) para mobile. Reemplaza a
 * la fila de chips/selects en pantallas chicas: deja un único renglón con el
 * disparador y mete los controles dentro del sheet. Los filtros se aplican en
 * vivo, así que el footer sólo ofrece "Limpiar" y "Listo".
 */
export function FilterSheet({
  activeCount = 0,
  onClear,
  clearDisabled,
  title = t`Filtros`,
  description,
  children,
  triggerClassName,
}: FilterSheetProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border bg-transparent px-3.5 text-xs font-medium text-foreground transition-[transform,background-color] duration-150 ease-[var(--ease-out-quint)] hover:bg-surface-hover active:scale-[0.97]',
            triggerClassName,
          )}
        >
          <SlidersHorizontal className="size-3.5" aria-hidden />
          {t`Filtros`}
          {activeCount > 0 ? (
            <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
              {activeCount}
            </span>
          ) : null}
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="max-h-[85dvh] gap-0 rounded-t-3xl border-border p-0 ease-[var(--ease-drawer)] data-[state=closed]:duration-200 data-[state=open]:duration-300"
      >
        <div className="flex justify-center pt-3 pb-1" aria-hidden>
          <span className="h-1 w-10 rounded-full bg-border" />
        </div>
        <SheetHeader className="px-5 pt-2 pb-4">
          <SheetTitle>{title}</SheetTitle>
          {description ? (
            <SheetDescription>{description}</SheetDescription>
          ) : null}
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-4">
          {children}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {onClear ? (
            <button
              type="button"
              onClick={onClear}
              disabled={clearDisabled}
              className="px-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            >
              {t`Limpiar`}
            </button>
          ) : (
            <span />
          )}
          <SheetClose asChild>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-transform duration-150 ease-[var(--ease-out-quint)] active:scale-[0.97]"
            >
              {t`Listo`}
            </button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  )
}
