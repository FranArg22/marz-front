import { useState } from 'react'
import { t } from '@lingui/core/macro'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Eye, Loader2 } from 'lucide-react'

import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { ApproveDraftButton } from '#/features/deliverables/components/ApproveDraftButton'
import { InlineVideoPlayer } from '#/features/deliverables/components/InlineVideoPlayer'
import { RequestChangesModal } from '#/features/deliverables/components/RequestChangesModal'
import { listDrafts } from '#/shared/api/generated/deliverables/deliverables'
import type { DraftDTO } from '#/shared/api/generated/model'

import { inboxQueryKey } from './api/inbox'

interface InboxDraftReviewPopoverProps {
  deliverableId: string
}

type Step = 'review' | 'request_changes'

async function fetchLatestDraft(
  deliverableId: string,
): Promise<DraftDTO | null> {
  const response = await listDrafts(deliverableId)
  if (response.status !== 200) {
    throw new Error(`Failed to fetch drafts: ${response.status}`)
  }
  const drafts = (response.data as { drafts?: DraftDTO[] }).drafts ?? []
  if (drafts.length === 0) return null
  return drafts.reduce((latest, current) =>
    current.version > latest.version ? current : latest,
  )
}

export function InboxDraftReviewPopover({
  deliverableId,
}: InboxDraftReviewPopoverProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('review')
  const queryClient = useQueryClient()

  const draftQuery = useQuery<DraftDTO | null>({
    queryKey: ['inbox', 'draft', deliverableId],
    queryFn: () => fetchLatestDraft(deliverableId),
    enabled: open,
    staleTime: 30_000,
  })

  function handleResolved() {
    void queryClient.invalidateQueries({ queryKey: inboxQueryKey })
    setOpen(false)
    setStep('review')
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) setStep('review')
  }

  const draft = draftQuery.data ?? null
  const aspect: 'landscape' | 'portrait' = 'landscape'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={t`Revisar draft`}
                className="shrink-0 rounded-full"
              >
                <Eye className="size-4" aria-hidden />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>{t`Revisar draft`}</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'request_changes' ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setStep('review')}
                aria-label={t`Volver`}
                className="size-7"
              >
                <ArrowLeft className="size-4" aria-hidden />
              </Button>
            ) : null}
            {step === 'review'
              ? t`Revisar draft`
              : t`Solicitar cambios al draft`}
          </DialogTitle>
        </DialogHeader>

        {draftQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin" aria-hidden />
          </div>
        ) : draftQuery.isError || !draft ? (
          <p className="text-sm text-muted-foreground">
            {t`No pudimos cargar el draft. Probá refrescar.`}
          </p>
        ) : step === 'review' ? (
          <div className="flex flex-col gap-4">
            <InlineVideoPlayer
              playbackUrl={draft.playback_url}
              thumbnailUrl={draft.thumbnail_url ?? undefined}
              durationSec={draft.duration_sec ?? undefined}
              aspect={aspect}
              deliverableId={deliverableId}
              draftId={draft.id}
            />

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('request_changes')}
              >
                {t`Solicitar cambios`}
              </Button>
              <ApproveDraftButton
                deliverableId={deliverableId}
                conversationId=""
                version={draft.version}
                currentVersion={draft.version}
                draftId={draft.id}
                onApproved={handleResolved}
              />
            </div>
          </div>
        ) : (
          <RequestChangesModal
            title={t`Solicitar cambios al draft`}
            target="draft"
            deliverableId={deliverableId}
            draftId={draft.id}
            playbackUrl={draft.playback_url}
            thumbnailUrl={draft.thumbnail_url ?? undefined}
            durationSec={draft.duration_sec ?? undefined}
            aspect={aspect}
            inline
            onSubmitted={handleResolved}
            onClose={() => setStep('review')}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
