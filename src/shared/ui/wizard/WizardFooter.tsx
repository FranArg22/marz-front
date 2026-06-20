import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '#/lib/utils'

interface WizardFooterProps {
  onBack?: () => void
  onNext: () => void
  nextDisabled?: boolean
  nextLabel?: string
  backLabel?: string
  isLoading?: boolean
  className?: string
}

export function WizardFooter({
  onBack,
  onNext,
  nextDisabled = false,
  nextLabel = 'Continuar',
  backLabel = 'Atrás',
  isLoading = false,
  className,
}: WizardFooterProps) {
  return (
    <div
      className={cn('flex w-full items-center justify-center gap-3', className)}
    >
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-semibold text-foreground transition-[transform,background-color,border-color,color] duration-150 ease-out hover:bg-surface-hover motion-safe:active:scale-[0.97]"
        >
          <ArrowLeft size={16} />
          {backLabel}
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled || isLoading}
        className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground transition-[transform,opacity,background-color] duration-150 ease-out hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-[0.97] motion-safe:disabled:active:scale-100"
      >
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            {nextLabel}
            <ArrowRight size={16} />
          </>
        )}
      </button>
    </div>
  )
}
