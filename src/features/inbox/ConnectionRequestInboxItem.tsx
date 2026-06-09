import { t } from '@lingui/core/macro'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Check, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { Button } from '#/components/ui/button'
import {
  useAcceptDiscoveryConnectionRequest,
  useRejectDiscoveryConnectionRequest,
} from '#/shared/api/generated/creator/creator'
import { useGetDiscoveryConnectionRequest } from '#/shared/api/generated/discovery/discovery'
import { ApiError } from '#/shared/api/mutator'

import type { InboxItem, InboxResponse } from './api/inbox'
import { inboxQueryKey } from './api/inbox'

interface ConnectionRequestInboxItemProps {
  accountKind: InboxResponse['account_kind']
  item: InboxItem
}

export function ConnectionRequestInboxItem({
  item,
}: ConnectionRequestInboxItemProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const connectionRequestId = (
    item.metadata as { connection_request_id?: string } | undefined
  )?.connection_request_id

  const detailQuery = useGetDiscoveryConnectionRequest(
    connectionRequestId ?? '',
    {
      query: { enabled: Boolean(connectionRequestId) },
    },
  )

  const accept = useAcceptDiscoveryConnectionRequest({
    mutation: {
      onSuccess: async (data) => {
        await queryClient.invalidateQueries({ queryKey: inboxQueryKey })
        if (data.status === 200 && data.data.conversation_id) {
          void navigate({
            to: '/workspace/conversations/$conversationId',
            params: { conversationId: data.data.conversation_id },
          })
        }
      },
      onError: (error) => {
        if (error instanceof ApiError && error.status === 410) {
          toast.error(t`Esta invitación ya venció.`)
          void queryClient.invalidateQueries({ queryKey: inboxQueryKey })
        } else {
          toast.error(t`Algo salió mal. Intentá de nuevo.`)
        }
      },
    },
  })

  const reject = useRejectDiscoveryConnectionRequest({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: inboxQueryKey })
      },
      onError: () => {
        toast.error(t`Algo salió mal. Intentá de nuevo.`)
      },
    },
  })

  const isPending = accept.isPending || reject.isPending

  if (!connectionRequestId) return null

  const brandName =
    detailQuery.data?.status === 200
      ? detailQuery.data.data.brand_workspace.name
      : item.meta.primary
  const note =
    detailQuery.data?.status === 200 ? detailQuery.data.data.note : null

  return (
    <li>
      <article className="flex items-start gap-4 rounded-2xl border border-border bg-card p-4">
        <Avatar className="size-10 shrink-0">
          {detailQuery.data?.status === 200 ? (
            <AvatarImage
              src={detailQuery.data.data.brand_workspace.logo_url ?? undefined}
              alt={brandName}
            />
          ) : null}
          <AvatarFallback>{brandName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            {t`${brandName} quiere conectar con vos`}
          </p>
          {note ? (
            <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
              {note}
            </p>
          ) : null}

          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => accept.mutate({ id: connectionRequestId })}
              disabled={isPending}
            >
              {accept.isPending ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <Check className="size-3.5" aria-hidden />
              )}
              {t`Aceptar`}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => reject.mutate({ id: connectionRequestId })}
              disabled={isPending}
            >
              {reject.isPending ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <X className="size-3.5" aria-hidden />
              )}
              {t`Rechazar`}
            </Button>
          </div>
        </div>
      </article>
    </li>
  )
}
