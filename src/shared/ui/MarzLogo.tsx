import { cn } from '#/lib/utils'

interface MarzLogoProps {
  /** Render the "Marz" wordmark next to the mark. */
  showWordmark?: boolean
  className?: string
}

/**
 * Marz brand mark, same asset used in the app sidebar. Swaps between the light
 * and dark variants following the active theme.
 */
export function MarzLogo({ showWordmark = true, className }: MarzLogoProps) {
  // Con el wordmark visible las imágenes son decorativas; el texto da el nombre.
  const alt = showWordmark ? '' : 'Marz'

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <img
        src="/marz-mark-light.png"
        alt={alt}
        className="size-8 rounded-[var(--radius-md)] object-contain dark:hidden"
      />
      <img
        src="/marz-mark-dark.png"
        alt={alt}
        className="hidden size-8 rounded-[var(--radius-md)] object-contain dark:block"
      />
      {showWordmark && (
        <span className="text-base font-bold text-foreground">Marz</span>
      )}
    </div>
  )
}
