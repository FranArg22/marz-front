import { useState } from 'react'
import type { ReactNode } from 'react'
import { t } from '@lingui/core/macro'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Loader2 } from 'lucide-react'

import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'
import { ApproveDraftButton } from './ApproveDraftButton'
import { InlineVideoPlayer } from './InlineVideoPlayer'
import { RequestChangesModal } from './RequestChangesModal'
import { listDrafts } from '#/shared/api/generated/deliverables/deliverables'
import type { DraftDTO } from '#/shared/api/generated/model'

interface DraftReviewDialogProps {
  deliverableId: string
  trigger: ReactNode
  /** Invoked after approve or request-changes succeeds. */
  onResolved?: () => void
  /** Override the latest draft. If absent, fetches via listDrafts(deliverableId). */
  initialDraft?: DraftDTO | null
  /** Used for the chat invalidation in ApproveDraftButton; "" works when not consumed. */
  conversationId?: string
  /**
   * Whether the approve / request-changes actions are available. Only true
   * while the draft is pending review (`draft_submitted`). When false the
   * dialog is a read-only player. Defaults to true so callers that already
   * mount the dialog exclusively for pending drafts stay unchanged.
   */
  canReview?: boolean
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

export function DraftReviewDialog({
  deliverableId,
  trigger,
  onResolved,
  initialDraft,
  conversationId = '',
  canReview = true,
}: DraftReviewDialogProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('review')

  const shouldFetch = open && !initialDraft
  const draftQuery = useQuery<DraftDTO | null>({
    queryKey: ['draft-review', deliverableId],
    queryFn: () => fetchLatestDraft(deliverableId),
    enabled: shouldFetch,
    staleTime: 30_000,
  })

  function handleResolved() {
    onResolved?.()
    setOpen(false)
    setStep('review')
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) setStep('review')
  }

  const draft = initialDraft ?? draftQuery.data ?? null
  const isLoading = !initialDraft && draftQuery.isLoading
  const isError = !initialDraft && draftQuery.isError
  const aspect: 'landscape' | 'portrait' = 'portrait'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent
        className={
          step === 'review'
            ? 'flex h-[100dvh] max-h-[100dvh] max-w-full flex-col justify-center gap-4 rounded-none border-0 sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:max-w-md sm:justify-start sm:rounded-lg sm:border'
            : 'sm:max-w-2xl'
        }
      >
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
              ? canReview
                ? t`Revisar video borrador`
                : t`Ver video borrador`
              : t`Solicitar cambios al video borrador`}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin" aria-hidden />
          </div>
        ) : isError || !draft ? (
          <p className="text-sm text-muted-foreground">
            {t`No pudimos cargar el video borrador. Probá refrescar.`}
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

            {canReview ? (
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
                  conversationId={conversationId}
                  version={draft.version}
                  currentVersion={draft.version}
                  draftId={draft.id}
                  onApproved={handleResolved}
                />
              </div>
            ) : null}
          </div>
        ) : (
          <RequestChangesModal
            title={t`Solicitar cambios al video borrador`}
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
