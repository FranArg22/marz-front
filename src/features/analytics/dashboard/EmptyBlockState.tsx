import { t } from '@lingui/core/macro'
import { SearchX } from 'lucide-react'

import { Button } from '#/components/ui/button'

interface EmptyBlockStateProps {
  onClear: () => void
}

export function EmptyBlockState({ onClear }: EmptyBlockStateProps) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <SearchX className="size-5" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">
        {t`Sin datos para estos filtros`}
      </h3>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-4 rounded-full"
        onClick={onClear}
      >
        {t`Limpiar filtros`}
      </Button>
    </div>
  )
}
