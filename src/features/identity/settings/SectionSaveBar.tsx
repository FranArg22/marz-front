import { Loader2 } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { Button } from '#/components/ui/button'

interface SectionSaveBarProps {
  isDirty: boolean
  isSubmitting: boolean
  error: string | null
  onSave: () => void
  onReset?: () => void
}

export function SectionSaveBar({
  isDirty,
  isSubmitting,
  error,
  onSave,
  onReset,
}: SectionSaveBarProps) {
  const canSave = isDirty && !isSubmitting

  return (
    <div className="sticky bottom-0 mt-8 border-t border-border bg-background/95 px-0 py-4 backdrop-blur">
      <div className="flex flex-wrap items-center justify-end gap-2">
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
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
          {isSubmitting ? t`Guardando...` : t`Guardar`}
        </Button>
      </div>
      {error ? (
        <p className="mt-2 text-right text-sm text-destructive">{error}</p>
      ) : null}
    </div>
  )
}
