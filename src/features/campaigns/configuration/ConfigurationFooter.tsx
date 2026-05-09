import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { Button } from '#/components/ui/button'

interface ConfigurationFooterProps {
  onBack: () => void
  onContinue: () => void
  backDisabled?: boolean
  continueDisabled: boolean
  isPending: boolean
}

export function ConfigurationFooter({
  onBack,
  onContinue,
  backDisabled = false,
  continueDisabled,
  isPending,
}: ConfigurationFooterProps) {
  return (
    <div className="flex w-full items-center gap-3 pt-4">
      <Button
        type="button"
        variant="outline"
        className="rounded-full"
        onClick={onBack}
        disabled={backDisabled || isPending}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t`Atrás`}
      </Button>
      <div className="flex-1" />
      <Button
        type="button"
        className="rounded-full"
        onClick={onContinue}
        disabled={continueDisabled || isPending}
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        {t`Continuar`}
        {!isPending ? (
          <ArrowRight className="size-4" aria-hidden="true" />
        ) : null}
      </Button>
    </div>
  )
}
