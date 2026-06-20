import { useState } from 'react'
import type { ReactNode } from 'react'
import { HoverCard } from 'radix-ui'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import { useIsMobile } from '#/features/identity/onboarding/hooks/useIsMobile'
import { cn } from '#/lib/utils'

interface InboxHistoryPopoverProps {
  children: ReactNode
  isEmpty: boolean
  title: string
  trigger: ReactNode
}

export function InboxHistoryPopover({
  children,
  isEmpty,
  title,
  trigger,
}: InboxHistoryPopoverProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)

  if (isEmpty) {
    return <>{trigger}</>
  }

  if (isMobile) {
    return (
      <>
        <div
          onClick={(event) => {
            event.stopPropagation()
            event.preventDefault()
            setOpen(true)
          }}
          className="min-w-0 text-left"
        >
          {trigger}
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{title}</SheetTitle>
            </SheetHeader>
            <div className="mt-4">{children}</div>
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return (
    <HoverCard.Root open={open} onOpenChange={setOpen} openDelay={150}>
      <HoverCard.Trigger asChild>{trigger}</HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          side="top"
          align="start"
          sideOffset={6}
          className={cn(
            'z-50 w-80 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-md',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
          )}
        >
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            {title}
          </p>
          {children}
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  )
}
