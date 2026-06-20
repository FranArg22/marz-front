import { Check, Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { t } from '@lingui/core/macro'

import { Button } from '#/components/ui/button'

interface SectionSaveBarProps {
  isDirty: boolean
  isSubmitting: boolean
  error: string | null
  onSave: () => void
  onReset?: () => void
  leftSlot?: ReactNode
}

export function SectionSaveBar({
  isDirty,
  isSubmitting,
  error,
  onSave,
  onReset,
  leftSlot,
}: SectionSaveBarProps) {
  const canSave = isDirty && !isSubmitting

  return (
    <div className="sticky bottom-0 mt-8 border-t border-border bg-background/95 px-0 py-4 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>{leftSlot}</div>
        <div className="flex flex-wrap items-center gap-2">
          {onReset ? (
            <Button
              type="button"
              variant="outline"
              onClick={onReset}
              disabled={!isDirty || isSubmitting}
            >
              {t`Descartar`}
            </Button>
          ) : null}
          <Button type="button" onClick={onSave} disabled={!canSave}>
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            {isSubmitting ? t`Guardando...` : t`Guardar cambios`}
          </Button>
        </div>
      </div>
      {error ? (
        <p className="mt-2 text-right text-sm text-destructive">{error}</p>
      ) : null}
    </div>
  )
}
