import { t } from '@lingui/core/macro'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  createDiscoveryConnectionRequest,
  useCreateDiscoveryConnectionRequest,
} from '#/shared/api/generated/brand/brand'
import type {
  CreateConnectionRequestRequest,
  GetDiscoveryCreatorsParams,
} from '#/shared/api/generated/model'
import { useIdempotencyKey, withIdempotencyKey } from '#/shared/api/idempotency'
import { ApiError } from '#/shared/api/mutator'

import { getDiscoveryCreatorsQueryKey } from './useDiscoveryCreatorsInfiniteQuery'

export function useCreateConnectionRequestMutation(
  appliedParams: Omit<GetDiscoveryCreatorsParams, 'cursor' | 'limit'>,
) {
  const queryClient = useQueryClient()
  const idempotency = useIdempotencyKey<CreateConnectionRequestRequest>(
    (data) => data.creator_account_id ?? data.creator_id ?? '',
  )

  const mutation = useCreateDiscoveryConnectionRequest<ApiError>({
    mutation: {
      mutationFn: async ({ data }) => {
        const response = await createDiscoveryConnectionRequest(
          data,
          withIdempotencyKey(idempotency.get(data)),
        )

        if (response.status !== 201) {
          throw new ApiError(
            response.status,
            'create_connection_request_error',
            'Create connection request failed', // eslint-disable-line lingui/no-unlocalized-strings -- developer-facing error
          )
        }

        return response
      },
      onSuccess: async () => {
        idempotency.reset()
        toast.success(t`Invitación enviada`)
        await queryClient.invalidateQueries({
          queryKey: getDiscoveryCreatorsQueryKey(appliedParams),
        })
      },
      onError: (error) => {
        if (error instanceof ApiError && error.status === 409) {
          if (error.code === 'already_pending') {
            toast.info(t`Ya enviaste una invitación a este creator.`)
            return
          }

          if (error.code === 'has_conversation') {
            toast.info(t`Ya tenés una conversación con este creator.`)
            return
          }

          if (error.code === 'has_active_offer') {
            toast.info(t`Ya tenés una oferta activa con este creator.`)
            return
          }
        }

        toast.error(t`Algo salió mal. Intentá de nuevo.`)
      },
    },
  })

  return {
    ...mutation,
    mutate: (
      data: CreateConnectionRequestRequest,
      options?: Parameters<typeof mutation.mutate>[1],
    ) => mutation.mutate({ data }, options),
    mutateAsync: (
      data: CreateConnectionRequestRequest,
      options?: Parameters<typeof mutation.mutateAsync>[1],
    ) => mutation.mutateAsync({ data }, options),
  }
}
