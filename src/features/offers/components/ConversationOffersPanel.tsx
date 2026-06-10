import type { ReactNode } from 'react'
import { t } from '@lingui/core/macro'

import { ContextPanel } from '#/shared/ui/ContextPanel'
import { useConversationOffersPaginated } from '#/features/offers/hooks/useConversationOffers'
import { useGetConversationDeliverablesQuery } from '#/features/deliverables/api/conversationDeliverables'
import { useMe } from '#/shared/api/generated/accounts/accounts'
import type { MarkAsPaidOffer } from '#/shared/payments/markAsPaidEligibility'
import type { CanSendOfferMeta } from '#/shared/types/offerMeta'
import { getWorkspacePlan } from '#/features/offers/utils/workspacePlan'
import { CurrentOfferBlock } from './CurrentOfferBlock'
import { NextStep } from './NextStep'
import { OffersArchiveBlock } from './OffersArchiveBlock'

interface ConversationOffersPanelProps {
  conversationId: string
  sessionKind: 'brand' | 'creator'
  onUploadDraft: (deliverableId: string) => void
  onMarkAsPaid?: (offer: MarkAsPaidOffer) => void
  onSubmitLink?: (deliverableId: string, isResubmission: boolean) => void
  headerSlot?: ReactNode
  canSendOffer?: CanSendOfferMeta
  onSendOffer?: () => void
}

export function ConversationOffersPanel({
  conversationId,
  sessionKind,
  onUploadDraft,
  onMarkAsPaid,
  onSubmitLink,
  headerSlot = null,
  canSendOffer,
  onSendOffer,
}: ConversationOffersPanelProps) {
  const {
    current,
    archiveItems,
    nextCursor,
    fetchNextPage,
    isFetchingNextPage,
  } = useConversationOffersPaginated(conversationId)

  const deliverablesQuery = useGetConversationDeliverablesQuery(conversationId)

  const meQuery = useMe()
  const actorKind =
    meQuery.data?.status === 200 ? meQuery.data.data.kind : undefined
  const isFreePlan =
    getWorkspacePlan(
      meQuery.data?.status === 200
        ? meQuery.data.data.brand_workspace?.plan
        : undefined,
    ) === 'free'

  // Scope deliverables to the offers-context current offer. The deliverables
  // read derives its own "current offer", which lags after a new offer is sent
  // (it still points at the previous, already-fulfilled offer); the offers
  // context is authoritative, so filter by its id to avoid showing the prior
  // offer's deliverables under the new one.
  const deliverables = current
    ? (deliverablesQuery.data?.deliverables ?? []).filter(
        (deliverable) => deliverable.offer_id === current.id,
      )
    : []

  return (
    <ContextPanel
      headerSlot={headerSlot}
      nextStepSlot={
        <NextStep
          offer={current}
          sessionKind={sessionKind}
          deliverables={deliverables}
          isFreePlan={isFreePlan}
        />
      }
      offerSlot={
        actorKind ? (
          <CurrentOfferBlock
            offer={current}
            actorKind={actorKind}
            conversationId={conversationId}
            deliverables={deliverables}
            sessionKind={sessionKind}
            onUploadDraft={onUploadDraft}
            onMarkAsPaid={onMarkAsPaid}
            onSubmitLink={onSubmitLink}
            canSendOffer={canSendOffer}
            onSendOffer={onSendOffer}
          />
        ) : null
      }
      archiveSlot={
        actorKind ? (
          <OffersArchiveBlock
            items={archiveItems}
            nextCursor={nextCursor}
            onLoadMore={fetchNextPage}
            isLoadingMore={isFetchingNextPage}
            actorKind={actorKind}
            defaultOpen={!current}
          />
        ) : null
      }
      errorSlot={
        deliverablesQuery.isError ? (
          <p className="px-1 text-xs text-muted-foreground">
            {t`Error al cargar entregables`}
          </p>
        ) : null
      }
    />
  )
}
