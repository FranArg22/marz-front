import { useState } from 'react'
import { Eye, Play } from 'lucide-react'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { useQueryClient } from '@tanstack/react-query'

import { Button } from '#/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '#/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { cn } from '#/lib/utils'
import type { DraftDTO, ChangeRequestDTO } from '#/features/deliverables/types'
import { getListDraftsQueryKey } from '#/shared/api/generated/deliverables/deliverables'
import { DraftReviewDialog } from './DraftReviewDialog'
import { InlineVideoPlayer } from './InlineVideoPlayer'

interface DraftVersionListProps {
  drafts: DraftDTO[]
  changeRequests: ChangeRequestDTO[]
  deliverableId?: string
  /** When true, shows the review (approve / request changes) button for the latest submitted draft. */
  canReview?: boolean
}

function getStatusMeta(
  status: 'approved' | 'changes_requested' | 'submitted',
  isCurrent: boolean,
) {
  // A superseded version is no longer awaiting review — "Pendiente de revisión"
  // only makes sense for the latest one.
  if (status === 'submitted' && !isCurrent) {
    return { label: t`Reemplazada`, tone: 'text-muted-foreground' }
  }
  const map: Record<typeof status, { label: string; tone: string }> = {
    approved: {
      label: t`Aprobado`,
      tone: 'text-success',
    },
    changes_requested: {
      label: t`Cambios solicitados`,
      tone: 'text-warning',
    },
    submitted: {
      label: t`Pendiente de revisión`,
      tone: 'text-muted-foreground',
    },
  }
  return map[status]
}

function getDraftStatus(
  draft: DraftDTO,
  changeRequestDraftIds: ReadonlySet<string>,
): 'approved' | 'changes_requested' | 'submitted' {
  if (draft.approved_at != null) return 'approved'
  if (changeRequestDraftIds.has(draft.id)) return 'changes_requested'
  return 'submitted'
}

export function DraftVersionList({
  drafts,
  changeRequests,
  deliverableId,
  canReview = false,
}: DraftVersionListProps) {
  const [previewDraft, setPreviewDraft] = useState<DraftDTO | null>(null)
  const maxVersion = Math.max(...drafts.map((d) => d.version), 0)
  const queryClient = useQueryClient()

  const changeRequestDraftIds = new Set<string>(
    changeRequests.map((cr) => cr.draft_id),
  )

  if (drafts.length === 0) return null

  function handleResolved() {
    if (!deliverableId) return
    void queryClient.invalidateQueries({
      queryKey: getListDraftsQueryKey(deliverableId),
    })
  }

  return (
    <div
      className="divide-y divide-border rounded-md border border-border bg-background"
      data-testid="draft-version-list"
    >
      {drafts.map((draft) => {
        const isCurrent = draft.version === maxVersion
        const status = getDraftStatus(draft, changeRequestDraftIds)
        const meta = getStatusMeta(status, isCurrent)
        const version = draft.version

        return (
          <div
            key={draft.id}
            data-testid="draft-version-row"
            data-version={draft.version}
            className="flex items-center gap-3 px-2.5 py-2"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-xs font-medium text-foreground">
                <Trans>Versión {version}</Trans>
                {isCurrent ? (
                  <span className="ml-1.5 text-muted-foreground">
                    · {t`Última`}
                  </span>
                ) : null}
              </span>
              <span className={cn('text-[11px]', meta.tone)}>{meta.label}</span>
            </div>
            <TooltipProvider delayDuration={200}>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 rounded-full bg-muted hover:bg-muted/80"
                      aria-label={t`Reproducir versión ${version}`}
                      onClick={() => setPreviewDraft(draft)}
                    >
                      <Play className="size-3.5 fill-current" aria-hidden />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t`Reproducir versión ${version}`}</TooltipContent>
                </Tooltip>
                {canReview &&
                isCurrent &&
                status === 'submitted' &&
                deliverableId ? (
                  <Tooltip>
                    <DraftReviewDialog
                      deliverableId={deliverableId}
                      initialDraft={draft}
                      onResolved={handleResolved}
                      trigger={
                        // TooltipTrigger (not the Tooltip root) is the trigger
                        // so DraftReviewDialog's DialogTrigger asChild lands on
                        // a single slottable element and both triggers merge
                        // onto the button — otherwise the click never opens the
                        // dialog (the Tooltip root swallows the asChild slot).
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8 shrink-0 rounded-full"
                            aria-label={t`Revisar y decidir versión ${version}`}
                          >
                            <Eye className="size-3.5" aria-hidden />
                          </Button>
                        </TooltipTrigger>
                      }
                    />
                    <TooltipContent>{t`Aprobar o pedir cambios`}</TooltipContent>
                  </Tooltip>
                ) : null}
              </div>
            </TooltipProvider>
          </div>
        )
      })}

      {previewDraft &&
        (() => {
          const previewVersion = previewDraft.version
          return (
            <Dialog
              open
              onOpenChange={(open) => {
                if (!open) setPreviewDraft(null)
              }}
            >
              <DialogContent
                className="max-w-lg"
                aria-labelledby="preview-draft-title"
                aria-describedby={undefined}
              >
                <DialogTitle id="preview-draft-title" className="sr-only">
                  {t`Previsualizar video borrador v${previewVersion}`}
                </DialogTitle>
                <InlineVideoPlayer
                  playbackUrl={previewDraft.playback_url}
                  thumbnailUrl={previewDraft.thumbnail_url ?? undefined}
                  durationSec={previewDraft.duration_sec ?? undefined}
                  deliverableId={deliverableId}
                  draftId={previewDraft.id}
                />
              </DialogContent>
            </Dialog>
          )
        })()}
    </div>
  )
}
