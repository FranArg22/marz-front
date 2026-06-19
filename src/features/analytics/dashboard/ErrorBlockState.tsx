import { t } from '@lingui/core/macro'
import { AlertCircle } from 'lucide-react'

import { Button } from '#/components/ui/button'

interface ErrorBlockStateProps {
  onRetry: () => void
}

export function ErrorBlockState({ onRetry }: ErrorBlockStateProps) {
  return (
    <div
      role="alert"
      className="flex min-h-[220px] flex-col items-center justify-center px-6 py-10 text-center"
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <AlertCircle className="size-5" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">
        {t`Algo salió mal`}
      </h3>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-4 rounded-full"
        onClick={onRetry}
      >
        {t`Reintentar`}
      </Button>
    </div>
  )
}
