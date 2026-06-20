import type { ReactNode } from 'react'
import { t } from '@lingui/core/macro'

import { cn } from '#/lib/utils'

import type { InboxCreatorBoxModel } from './groupInboxItemsByCounterpart'
import { InboxHistoryPopover } from './InboxMessagePreviewPopover'

interface InboxCreatorHistoryPopoverProps {
  box: InboxCreatorBoxModel
  trigger: ReactNode
}

export function InboxCreatorHistoryPopover({
  box,
  trigger,
}: InboxCreatorHistoryPopoverProps) {
  const counterpartName = box.counterpart.display_name

  return (
    <InboxHistoryPopover
      title={t`Pendientes de ${counterpartName}`}
      trigger={trigger}
      isEmpty={box.items.length <= 1}
    >
      <HistoryList box={box} />
    </InboxHistoryPopover>
  )
}

function HistoryList({
  box,
  className,
}: {
  box: InboxCreatorBoxModel
  className?: string
}) {
  return (
    <ul className={cn('flex flex-col gap-2', className)}>
      {box.items.map((item) => (
        <li key={item.id} className="rounded-md bg-muted px-2 py-1.5">
          <div className="flex min-w-0 items-baseline gap-2">
            <p className="truncate text-xs font-medium text-foreground">
              {item.title}
            </p>
            <time
              dateTime={item.occurred_at}
              className="shrink-0 text-[11px] text-muted-foreground"
            >
              {item.meta.timestamp}
            </time>
          </div>
          {item.preview ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {item.preview}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
