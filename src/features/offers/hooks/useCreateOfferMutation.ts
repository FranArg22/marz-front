import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { CreateOfferRequest as GeneratedCreateOfferRequest } from '#/shared/api/generated/model'
import { createSingleOffer } from '#/shared/api/generated/offers/offers'
import { generateIdempotencyKey } from '#/shared/api/idempotency'
import { getMessagesQueryKey } from '#/shared/queries/messages'
import { getConversationOffersQueryKey } from '#/shared/queries/offers'

import type { CreateOfferFormValues } from '../schemas/createOffer'

export type CreateOfferMutationVariables = CreateOfferFormValues & {
  conversation_id: string
}

export function useCreateOfferMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (variables: CreateOfferMutationVariables) =>
      // RAFITA:ANY: Orval still models the request with generated DTO aliases while the form schema owns the narrowed UI contract; the Zod schema validates the payload shape before submit and conversation_id is added here.
      createSingleOffer(variables as unknown as GeneratedCreateOfferRequest, {
        headers: {
          'Idempotency-Key': generateIdempotencyKey(),
        },
      }),
    onSuccess: async (_response, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getConversationOffersQueryKey(variables.conversation_id),
        }),
        queryClient.invalidateQueries({
          queryKey: getMessagesQueryKey(variables.conversation_id),
        }),
      ])
    },
  })
}
