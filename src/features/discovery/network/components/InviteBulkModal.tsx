import { t } from '@lingui/core/macro'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Textarea } from '#/components/ui/textarea'
import {
  createDiscoveryConnectionRequestsBulk,
  useCreateDiscoveryConnectionRequestsBulk,
} from '#/shared/api/generated/brand/brand'
import type { CreateConnectionRequestsBulkRequest } from '#/shared/api/generated/model'
import { useIdempotencyKey, withIdempotencyKey } from '#/shared/api/idempotency'
import { ApiError } from '#/shared/api/mutator'

import { useDiscoveryFiltersStore } from '../store/discoveryFiltersStore'

interface InviteBulkModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accountIds: string[]
}

export function InviteBulkModal({
  open,
  onOpenChange,
  accountIds,
}: InviteBulkModalProps) {
  const [note, setNote] = useState('')
  const wasOpenRef = useRef(false)
  const submitLockedRef = useRef(false)
  const queryClient = useQueryClient()
  const clearSelection = useDiscoveryFiltersStore(
    (state) => state.clearSelection,
  )
  const toggleSelectionMode = useDiscoveryFiltersStore(
    (state) => state.toggleSelectionMode,
  )
  const idempotency = useIdempotencyKey<CreateConnectionRequestsBulkRequest>(
    (data) => data.creator_account_ids.join(','),
  )
  const count = accountIds.length

  const mutation = useCreateDiscoveryConnectionRequestsBulk<ApiError>({
    mutation: {
      mutationFn: async ({ data }) => {
        const response = await createDiscoveryConnectionRequestsBulk(
          data,
          withIdempotencyKey(idempotency.get(data)),
        )

        if (response.status !== 201) {
          throw new ApiError(
            response.status,
            'create_connection_requests_bulk_error',
            'Create bulk connection requests failed', // eslint-disable-line lingui/no-unlocalized-strings -- developer-facing error
          )
        }

        return response
      },
      onSuccess: async (response) => {
        if (response.status !== 201) return

        const { created_count, skipped_count } = response.data.summary

        if (skipped_count === 0) {
          toast.success(t`Se enviaron ${created_count} invitaciones.`)
        } else {
          toast.success(
            t`Se enviaron ${created_count} invitaciones. ${skipped_count} creators fueron omitidos porque ya tienen una invitación pendiente, conversación activa u oferta activa.`,
          )
        }

        idempotency.reset()
        await queryClient.invalidateQueries({
          queryKey: ['discovery', 'creators'],
        })
        clearSelection()
        toggleSelectionMode()
        onOpenChange(false)
      },
      onError: () => {
        toast.error(t`Algo salió mal. Intentá de nuevo.`)
      },
      onSettled: () => {
        submitLockedRef.current = false
      },
    },
  })

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setNote('')
      submitLockedRef.current = false
      mutation.reset()
      idempotency.reset()
    }
    wasOpenRef.current = open
  }, [idempotency, mutation, open])

  function handleSubmit() {
    if (
      accountIds.length === 0 ||
      mutation.isPending ||
      submitLockedRef.current
    )
      return

    submitLockedRef.current = true
    mutation.mutate({
      data: {
        creator_account_ids: accountIds,
        note: note.trim() || null,
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t`Invitar a ${count} creators`}</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          {t`Se enviará la misma nota a todos los creators seleccionados.`}
        </p>

        <div className="space-y-2">
          <label htmlFor="bulk-invite-note" className="text-sm font-medium">
            {t`Nota (opcional)`}
          </label>
          <Textarea
            id="bulk-invite-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={1000}
            placeholder={t`Contale por qué querés trabajar con estos creators...`}
            rows={4}
          />
          <p className="text-right text-xs text-muted-foreground">
            {note.length}/1000
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t`Cancelar`}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={accountIds.length === 0 || mutation.isPending}
          >
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            {t`Enviar invitaciones`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
