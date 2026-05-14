import { t } from '@lingui/core/macro'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'

interface LeaveConfirmDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function LeaveConfirmDialog({
  open,
  onConfirm,
  onCancel,
}: LeaveConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t`¿Salir del brief builder?`}</DialogTitle>
          <DialogDescription>
            {t`Vas a perder el progreso del brief. Esta acción no se puede deshacer.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {t`Seguir editando`}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {t`Salir`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
