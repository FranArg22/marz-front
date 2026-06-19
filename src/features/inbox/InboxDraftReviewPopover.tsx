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
    // Tooltip wraps the dialog so DraftReviewDialog's DialogTrigger asChild
    // lands on the TooltipTrigger (a single slottable element) and both
    // triggers merge onto the button. Passing the whole Tooltip as the trigger
    // breaks the asChild slot and the click never opens the dialog.
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <DraftReviewDialog
          deliverableId={deliverableId}
          onResolved={() => {
            void queryClient.invalidateQueries({ queryKey: inboxQueryKey })
          }}
          trigger={
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={t`Revisar video borrador`}
                className="shrink-0 rounded-full"
              >
                <Eye className="size-4" aria-hidden />
              </Button>
            </TooltipTrigger>
          }
        />
        <TooltipContent>{t`Revisar video borrador`}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
