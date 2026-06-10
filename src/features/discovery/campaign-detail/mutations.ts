import { t } from '@lingui/core/macro'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { matchesCreatorsQueryForCampaign } from '#/features/campaigns/detail/creators/useCampaignParticipantsQuery'
import {
  acceptCampaignDiscoveryApplication,
  rejectCampaignDiscoveryApplication,
} from '#/shared/api/generated/campaigns/campaigns'
import type { DiscoveryApplicationDecisionResponse } from '#/shared/api/generated/model'
import { useIdempotencyKey, withIdempotencyKey } from '#/shared/api/idempotency'
import { ApiError } from '#/shared/api/mutator'

type NavigateToConversation = (conversationId: string) => void

interface MutationOptions {
  onConversationReady?: NavigateToConversation
}

interface ApplicationVariables {
  applicationId: string
}

export function useAcceptApplication(
  campaignId: string,
  options: MutationOptions = {},
) {
  const queryClient = useQueryClient()
  const idempotency = useIdempotencyKey<ApplicationVariables>(
    ({ applicationId }) => applicationId,
  )

  return useMutation({
    mutationFn: async (variables: ApplicationVariables) => {
      const response = await acceptCampaignDiscoveryApplication(
        campaignId,
        variables.applicationId,
        withIdempotencyKey(idempotency.get(variables)),
      )

      if (response.status !== 200) {
        throw new ApiError(
          response.status,
          'accept_application_error',
          'Accept application request failed',
        )
      }
      return response.data
    },
    onSuccess: async (data: DiscoveryApplicationDecisionResponse) => {
      idempotency.reset()
      await invalidateApplications(queryClient, campaignId, {
        participants: true,
      })
      if (data.conversation?.id) {
        options.onConversationReady?.(data.conversation.id)
      }
    },
    onError: (error) => {
      const existingConversationId = handleDiscoveryMutationError(error)
      if (existingConversationId) {
        options.onConversationReady?.(existingConversationId)
      }
    },
  })
}

export function useRejectApplication(campaignId: string) {
  const queryClient = useQueryClient()
  const idempotency = useIdempotencyKey<ApplicationVariables>(
    ({ applicationId }) => applicationId,
  )

  return useMutation({
    mutationFn: async (variables: ApplicationVariables) => {
      const response = await rejectCampaignDiscoveryApplication(
        campaignId,
        variables.applicationId,
        withIdempotencyKey(idempotency.get(variables)),
      )

      if (response.status !== 200) {
        throw new ApiError(
          response.status,
          'reject_application_error',
          'Reject application request failed',
        )
      }
      return response.data
    },
    onSuccess: async () => {
      idempotency.reset()
      await invalidateApplications(queryClient, campaignId)
    },
    onError: handleDiscoveryMutationError,
  })
}

async function invalidateApplications(
  queryClient: ReturnType<typeof useQueryClient>,
  campaignId: string,
  options: { participants?: boolean } = {},
) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: ['campaign', campaignId, 'applications'],
    }),
    options.participants
      ? queryClient.invalidateQueries({
          predicate: matchesCreatorsQueryForCampaign(campaignId),
        })
      : Promise.resolve(),
  ])
}

export function handleDiscoveryMutationError(error: unknown) {
  if (!(error instanceof ApiError)) {
    toast.error(t`Algo salió mal. Intentá de nuevo.`)
    return undefined
  }

  if (error.status === 409) {
    if (error.code === 'conversation_already_exists') {
      const conversationId = getConversationId(error)
      toast.info(t`Ya existe una conversación con este creator.`)
      return conversationId
    }
    if (error.code === 'application_not_actionable') {
      toast.error(t`Esta aplicación ya no se puede modificar.`)
      return undefined
    }
  }

  toast.error(t`Algo salió mal. Intentá de nuevo.`)
  return undefined
}

function getConversationId(error: ApiError) {
  const details: unknown = error.details
  if (!details || typeof details !== 'object') return undefined
  if (!('conversation_id' in details)) return undefined

  const conversationId = details.conversation_id
  return typeof conversationId === 'string' ? conversationId : undefined
}
