import { useState } from 'react'
import type { ReactNode } from 'react'
import { t } from '@lingui/core/macro'
import { HoverCard } from 'radix-ui'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import { useIsMobile } from '#/features/identity/onboarding/hooks/useIsMobile'
import { cn } from '#/lib/utils'

interface MessagePreviewEntry {
  id: string
  preview: string
  occurred_at: string
  author_account_id: string
}

interface InboxMessagePreviewPopoverProps {
  previews: MessagePreviewEntry[]
  selfAccountId: string | null
  trigger: ReactNode
}

export function InboxMessagePreviewPopover({
  previews,
  selfAccountId,
  trigger,
}: InboxMessagePreviewPopoverProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)

  if (previews.length === 0) {
    return <>{trigger}</>
  }

  if (isMobile) {
    return (
      <>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            event.preventDefault()
            setOpen(true)
          }}
          className="text-left"
        >
          {trigger}
        </button>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{t`Mensajes recientes`}</SheetTitle>
            </SheetHeader>
            <ul className="mt-4 flex flex-col gap-3">
              {previews.map((entry) => (
                <PreviewRow
                  key={entry.id}
                  entry={entry}
                  isSelf={entry.author_account_id === selfAccountId}
                />
              ))}
            </ul>
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return (
    <HoverCard.Root open={open} onOpenChange={setOpen} openDelay={150}>
      <HoverCard.Trigger asChild>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            event.preventDefault()
            setOpen((value) => !value)
          }}
          className="text-left"
        >
          {trigger}
        </button>
      </HoverCard.Trigger>
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
            {t`Mensajes recientes`}
          </p>
          <ul className="flex flex-col gap-2">
            {previews.map((entry) => (
              <PreviewRow
                key={entry.id}
                entry={entry}
                isSelf={entry.author_account_id === selfAccountId}
              />
            ))}
          </ul>
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  )
}

function PreviewRow({
  entry,
  isSelf,
}: {
  entry: MessagePreviewEntry
  isSelf: boolean
}) {
  return (
    <li
      className={cn(
        'rounded-md px-2 py-1 text-xs',
        isSelf ? 'bg-primary/10 text-foreground' : 'bg-muted text-foreground',
      )}
    >
      <p className="truncate">{entry.preview}</p>
    </li>
  )
}
