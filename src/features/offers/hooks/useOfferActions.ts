import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { t } from '@lingui/core/macro'

import { acceptOffer, rejectOffer } from '#/shared/api/generated/offers/offers'
import type {
  acceptOfferResponse,
  rejectOfferResponse,
} from '#/shared/api/generated/offers/offers'
import type { AcceptOffer402 } from '#/shared/api/generated/model'
import { OfferAcceptErrorCode } from '#/shared/api/generated/model'
import { ApiError } from '#/shared/api/mutator'
import { getConversationOffersQueryKey } from '#/shared/queries/offers'
import { getConversationDeliverablesQueryKey } from '#/shared/queries/deliverables'

import { trackOfferEvent } from '../analytics'
import type { OfferMode } from '../types'

interface AcceptVariables {
  offerId: string
  sentAt: string
  offerMode: OfferMode
}

interface RejectVariables {
  offerId: string
  sentAt: string
  offerMode: OfferMode
  reason?: string
}

interface UseOfferActionsOptions {
  conversationId: string
}

function timeToResponseSeconds(sentAt: string): number {
  return Math.floor((Date.now() - new Date(sentAt).getTime()) / 1000)
}

export function useOfferActions({ conversationId }: UseOfferActionsOptions) {
  const queryClient = useQueryClient()
  const offersQueryKey = getConversationOffersQueryKey(conversationId)
  const deliverablesQueryKey =
    getConversationDeliverablesQueryKey(conversationId)

  const acceptMutation = useMutation<
    acceptOfferResponse,
    Error,
    AcceptVariables,
    { snapshot: unknown }
  >({
    mutationFn: ({ offerId }) => acceptOffer(offerId),
    onMutate: async ({ offerId }) => {
      await queryClient.cancelQueries({ queryKey: offersQueryKey })
      const snapshot = queryClient.getQueryData(offersQueryKey)
      queryClient.setQueryData(offersQueryKey, (old: unknown) => {
        if (!Array.isArray(old)) return old

        return old.map((offer: Record<string, unknown>) =>
          offer.id === offerId ? { ...offer, status: 'accepted' } : offer,
        )
      })
      return { snapshot }
    },
    onSuccess: (_data, variables) => {
      trackOfferEvent('offer_accepted', {
        actor_kind: 'creator',
        offer_mode: variables.offerMode,
        time_to_response_seconds: timeToResponseSeconds(variables.sentAt),
      })
    },
    onError: (error, _vars, context) => {
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(offersQueryKey, context.snapshot)
      }
      if (error instanceof ApiError && error.status === 402) {
        const body = error.body as AcceptOffer402 | undefined
        const code = body?.error.code

        if (code === OfferAcceptErrorCode.hold_expired) {
          toast.error(t`Los fondos reservados expiraron`)
        } else if (code === OfferAcceptErrorCode.card_declined) {
          toast.error(t`El brand necesita actualizar su tarjeta`)
        } else {
          toast.error(t`No se pudo procesar el pago`)
        }

        void queryClient.invalidateQueries({ queryKey: offersQueryKey })
        return
      }
      if (error instanceof ApiError && error.status === 409) {
        toast.error(t`Offer expired`)
        void queryClient.invalidateQueries({ queryKey: offersQueryKey })
        return
      }
      toast.error(t`Something went wrong. Try again.`)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: offersQueryKey })
      void queryClient.invalidateQueries({ queryKey: deliverablesQueryKey })
    },
  })

  const rejectMutation = useMutation<
    rejectOfferResponse,
    Error,
    RejectVariables,
    { snapshot: unknown }
  >({
    mutationFn: ({ offerId, reason }) =>
      rejectOffer(offerId, reason ? { reason } : {}),
    onMutate: async ({ offerId }) => {
      await queryClient.cancelQueries({ queryKey: offersQueryKey })
      const snapshot = queryClient.getQueryData(offersQueryKey)
      queryClient.setQueryData(offersQueryKey, (old: unknown) => {
        if (!Array.isArray(old)) return old

        return old.map((offer: Record<string, unknown>) =>
          offer.id === offerId ? { ...offer, status: 'rejected' } : offer,
        )
      })
      return { snapshot }
    },
    onSuccess: (_data, variables) => {
      trackOfferEvent('offer_rejected', {
        actor_kind: 'creator',
        offer_mode: variables.offerMode,
        time_to_response_seconds: timeToResponseSeconds(variables.sentAt),
      })
    },
    onError: (error, _vars, context) => {
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(offersQueryKey, context.snapshot)
      }
      if (error instanceof ApiError && error.status === 409) {
        toast.error(t`Offer is no longer actionable`)
        void queryClient.invalidateQueries({ queryKey: offersQueryKey })
        return
      }
      toast.error(t`Something went wrong. Try again.`)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: offersQueryKey })
    },
  })

  return {
    accept: acceptMutation,
    reject: rejectMutation,
    isActing: acceptMutation.isPending || rejectMutation.isPending,
  }
}
