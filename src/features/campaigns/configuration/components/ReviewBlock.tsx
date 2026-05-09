import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'

interface ReviewBlockProps {
  title: string
  Icon: LucideIcon
  action: ReactNode
  children: ReactNode
  className?: string
}

export function ReviewBlock({
  title,
  Icon,
  action,
  children,
  className,
}: ReviewBlockProps) {
  return (
    <section
      className={cn(
        'flex flex-col gap-3 rounded-3xl border border-border bg-card p-5',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <h2 className="min-w-0 flex-1 text-sm font-semibold text-foreground">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

interface ReviewBlockActionProps {
  children: ReactNode
  onClick: () => void
}

export function ReviewBlockAction({
  children,
  onClick,
}: ReviewBlockActionProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-auto px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 hover:text-primary"
      onClick={onClick}
    >
      {children}
    </Button>
  )
}
