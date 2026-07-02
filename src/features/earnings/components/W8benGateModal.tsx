import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'

import { Button } from '#/components/ui/button'
import { trackW8benRedirectClicked } from '../analytics'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'

interface W8benGateModalProps {
  open: boolean
  redirectUrl: string | null
  onOpenChange: (open: boolean) => void
}

export function W8benGateModal({
  open,
  redirectUrl,
  onOpenChange,
}: W8benGateModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Trans>Formulario W-8BEN requerido</Trans>
          </DialogTitle>
          <DialogDescription>
            <Trans>
              Para recibir pagos en USD desde Estados Unidos, necesitás
              completar el formulario W-8BEN. Es un trámite rápido (5-10
              minutos).
            </Trans>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <Trans>Cancelar</Trans>
          </Button>
          <Button
            disabled={!redirectUrl}
            onClick={() => {
              trackW8benRedirectClicked()
              if (redirectUrl) {
                window.open(redirectUrl, '_blank')
              }
            }}
            aria-label={t`Completar formulario W-8BEN`}
          >
            <Trans>Completar formulario</Trans>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
