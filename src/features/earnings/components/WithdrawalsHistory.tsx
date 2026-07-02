import { useState } from 'react'
import { Trans } from '@lingui/react/macro'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import type { WithdrawalListItem } from '#/shared/api/generated/model'
import { ApiError } from '#/shared/api/mutator'
import { useCancelWithdrawalMutation } from '../hooks/useCancelWithdrawalMutation'
import { useWithdrawalsQuery } from '../hooks/useWithdrawalsQuery'
import { WithdrawalDetail } from './WithdrawalDetail'
import { formatDate, formatMoney, getStatusBadge } from './withdrawalFormatters'

const PER_PAGE = 10

export function WithdrawalsHistory() {
  const [page, setPage] = useState(1)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null)
  const withdrawalsQuery = useWithdrawalsQuery({ page, per_page: PER_PAGE })
  const cancelMutation = useCancelWithdrawalMutation()

  async function handleCancelConfirmed() {
    if (!confirmCancelId) return
    try {
      await cancelMutation.mutateAsync({ id: confirmCancelId })
      setConfirmCancelId(null)
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.code === 'withdrawal_not_cancelable'
      ) {
        toast.error('El retiro ya no puede cancelarse')
      }
      setConfirmCancelId(null)
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">
        <Trans>Historial de retiros</Trans>
      </h2>

      {withdrawalsQuery.isLoading && (
        <div className="flex flex-col gap-2">
          <div className="h-12 animate-pulse rounded-lg bg-muted" />
          <div className="h-12 animate-pulse rounded-lg bg-muted" />
          <div className="h-12 animate-pulse rounded-lg bg-muted" />
        </div>
      )}

      {withdrawalsQuery.data && withdrawalsQuery.data.items.length === 0 && (
        <p className="text-sm text-muted-foreground">
          <Trans>Todavía no realizaste ningún retiro.</Trans>
        </p>
      )}

      {withdrawalsQuery.data && withdrawalsQuery.data.items.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">
                    <Trans>Fecha</Trans>
                  </th>
                  <th className="px-4 py-3 font-medium">
                    <Trans>Monto neto</Trans>
                  </th>
                  <th className="px-4 py-3 font-medium">
                    <Trans>Estado</Trans>
                  </th>
                  <th className="px-4 py-3 font-medium">
                    <Trans>Acciones</Trans>
                  </th>
                </tr>
              </thead>
              <tbody>
                {withdrawalsQuery.data.items.map((item: WithdrawalListItem) => (
                  <tr
                    key={item.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3">
                      {formatDate(item.requested_at)}
                    </td>
                    <td className="px-4 py-3">
                      {formatMoney(item.net.amount)}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {item.status === 'requested' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmCancelId(item.id)}
                          >
                            <Trans>Cancelar</Trans>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDetailId(item.id)}
                        >
                          <Trans>Ver detalle</Trans>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {withdrawalsQuery.data.total > PER_PAGE && (
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <Trans>Anterior</Trans>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page * PER_PAGE >= withdrawalsQuery.data.total}
                onClick={() => setPage((p) => p + 1)}
              >
                <Trans>Siguiente</Trans>
              </Button>
            </div>
          )}
        </>
      )}

      {detailId && (
        <WithdrawalDetail
          id={detailId}
          open
          onOpenChange={(open) => {
            if (!open) setDetailId(null)
          }}
        />
      )}

      <Dialog
        open={confirmCancelId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmCancelId(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Trans>¿Cancelar este retiro?</Trans>
            </DialogTitle>
            <DialogDescription>
              <Trans>El monto se devolverá a tu balance.</Trans>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmCancelId(null)}>
              <Trans>Volver</Trans>
            </Button>
            <Button
              variant="destructive"
              disabled={cancelMutation.isPending}
              onClick={handleCancelConfirmed}
            >
              {cancelMutation.isPending ? (
                <Trans>Cancelando...</Trans>
              ) : (
                <Trans>Confirmar cancelación</Trans>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
