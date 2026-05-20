import { t } from '@lingui/core/macro'
import { useQueryClient } from '@tanstack/react-query'
import { Eye } from 'lucide-react'

import { Button } from '#/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { DraftReviewDialog } from '#/features/deliverables/components/DraftReviewDialog'

import { inboxQueryKey } from './api/inbox'

interface InboxDraftReviewPopoverProps {
  deliverableId: string
}

export function InboxDraftReviewPopover({
  deliverableId,
}: InboxDraftReviewPopoverProps) {
  const queryClient = useQueryClient()

  return (
    <DraftReviewDialog
      deliverableId={deliverableId}
      onResolved={() => {
        void queryClient.invalidateQueries({ queryKey: inboxQueryKey })
      }}
      trigger={
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={t`Revisar draft`}
                className="shrink-0 rounded-full"
              >
                <Eye className="size-4" aria-hidden />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t`Revisar draft`}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      }
    />
  )
}
