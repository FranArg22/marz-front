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
import { ApiError } from '#/shared/api/mutator'
import { useCancelWithdrawalMutation } from '../hooks/useCancelWithdrawalMutation'
import { useWithdrawalDetailQuery } from '../hooks/useWithdrawalDetailQuery'
import { formatDate, formatMoney, getStatusBadge } from './withdrawalFormatters'

interface WithdrawalDetailProps {
  id: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WithdrawalDetail({
  id,
  open,
  onOpenChange,
}: WithdrawalDetailProps) {
  const detailQuery = useWithdrawalDetailQuery(id, { enabled: open })
  const cancelMutation = useCancelWithdrawalMutation()

  async function handleCancel() {
    try {
      await cancelMutation.mutateAsync({ id })
      onOpenChange(false)
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.code === 'withdrawal_not_cancelable'
      ) {
        toast.error('El retiro ya no puede cancelarse')
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Trans>Comprobante de retiro</Trans>
          </DialogTitle>
          <DialogDescription>
            <Trans>Detalle del retiro solicitado</Trans>
          </DialogDescription>
        </DialogHeader>

        {detailQuery.isLoading && (
          <div className="flex flex-col gap-3">
            <div className="h-6 w-24 animate-pulse rounded bg-muted" />
            <div className="h-5 w-40 animate-pulse rounded bg-muted" />
            <div className="h-5 w-40 animate-pulse rounded bg-muted" />
            <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          </div>
        )}

        {detailQuery.data && (
          <>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  <Trans>Estado</Trans>
                </span>
                {getStatusBadge(detailQuery.data.status)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  <Trans>Retiraste</Trans>
                </span>
                <span>{formatMoney(detailQuery.data.gross.amount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  <Trans>Comisión</Trans>
                </span>
                <span>− {formatMoney(detailQuery.data.fee.amount)}</span>
              </div>
              <div className="flex items-center justify-between font-semibold">
                <span className="text-muted-foreground">
                  <Trans>Recibiste</Trans>
                </span>
                <span>{formatMoney(detailQuery.data.net.amount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  <Trans>Solicitado el</Trans>
                </span>
                <span>{formatDate(detailQuery.data.requested_at)}</span>
              </div>
              {detailQuery.data.sent_at && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    <Trans>Enviado el</Trans>
                  </span>
                  <span>{formatDate(detailQuery.data.sent_at)}</span>
                </div>
              )}
              {detailQuery.data.failed_at && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    <Trans>Falló el</Trans>
                  </span>
                  <span>{formatDate(detailQuery.data.failed_at)}</span>
                </div>
              )}
              {detailQuery.data.status === 'sent' &&
                detailQuery.data.mercury_transaction_id && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      <Trans>Referencia Mercury</Trans>
                    </span>
                    <span className="font-mono text-xs">
                      {detailQuery.data.mercury_transaction_id}
                    </span>
                  </div>
                )}
            </div>
            {detailQuery.data.status === 'requested' && (
              <DialogFooter>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={cancelMutation.isPending}
                  onClick={handleCancel}
                >
                  {cancelMutation.isPending ? (
                    <Trans>Cancelando...</Trans>
                  ) : (
                    <Trans>Cancelar retiro</Trans>
                  )}
                </Button>
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
