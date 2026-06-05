import { t } from '@lingui/core/macro'

import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'

import { useCampaignWizardStore } from './store'

interface CancelWizardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExit: () => void
}

export function CancelWizardModal({
  open,
  onOpenChange,
  onExit,
}: CancelWizardModalProps) {
  function handleKeepEditing() {
    onOpenChange(false)
  }

  function handleExit() {
    useCampaignWizardStore.getState().reset()
    onExit()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t`¿Salir del wizard?`}</DialogTitle>
          <DialogDescription>
            {t`Si salís ahora, se perderán los datos ingresados.`}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleKeepEditing}>
            {t`Seguir editando`}
          </Button>
          <Button type="button" variant="destructive" onClick={handleExit}>
            {t`Salir`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
