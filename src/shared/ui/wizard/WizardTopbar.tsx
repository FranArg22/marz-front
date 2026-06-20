import { cn } from '#/lib/utils'
import { MarzLogo } from '#/shared/ui/MarzLogo'

interface WizardTopbarProps {
  stepLabel?: string
  onExit?: () => void
  exitLabel?: string
  className?: string
}

export function WizardTopbar({
  stepLabel,
  onExit,
  exitLabel = 'Salir',
  className,
}: WizardTopbarProps) {
  return (
    <header
      className={cn(
        'flex h-16 w-full items-center justify-between bg-background px-8',
        className,
      )}
    >
      <MarzLogo />

      <div className="flex items-center gap-4">
        {stepLabel && (
          <span className="text-[length:var(--font-size-xs)] font-medium text-muted-foreground">
            {stepLabel}
          </span>
        )}
        {onExit && (
          <button
            type="button"
            onClick={onExit}
            className="flex h-8 items-center rounded-full border border-border bg-card px-3 text-[length:var(--font-size-xs)] font-medium text-muted-foreground transition-colors hover:bg-surface-hover"
          >
            {exitLabel}
          </button>
        )}
      </div>
    </header>
  )
}
