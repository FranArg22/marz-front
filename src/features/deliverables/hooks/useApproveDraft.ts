import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { toast } from 'sonner'
import { t } from '@lingui/core/macro'

import { useApproveDraftMutation } from '#/features/deliverables/api/draftUpload'
import { ApiError } from '#/shared/api/mutator'
import { getConversationDeliverablesQueryKey } from '#/shared/queries/deliverables'
import { getMessagesQueryKey } from '#/shared/queries/messages'

export function useApproveDraft(deliverableId: string, conversationId: string) {
  const queryClient = useQueryClient()
  const mutation = useApproveDraftMutation(deliverableId)

  const mutate = useCallback(
    (options?: {
      onSuccess?: () => void
      onError?: (error: ApiError) => void
    }) => {
      mutation.mutate(undefined, {
        onSuccess: () => {
          void queryClient.invalidateQueries({
            queryKey: getConversationDeliverablesQueryKey(conversationId),
          })
          void queryClient.invalidateQueries({
            queryKey: getMessagesQueryKey(conversationId),
          })
          options?.onSuccess?.()
        },
        onError: (error) => {
          const message =
            error instanceof ApiError
              ? error.message
              : t`Something went wrong. Try again.`
          toast.error(message)
          if (error instanceof ApiError) options?.onError?.(error)
        },
      })
    },
    [mutation, queryClient, conversationId],
  )

  return {
    ...mutation,
    mutate,
  }
}
