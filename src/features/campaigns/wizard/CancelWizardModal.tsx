import { t } from '@lingui/core/macro'

import { Button } from '#/components/ui/button'
import { track } from '#/shared/analytics/track'
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
  step: number
}

export function CancelWizardModal({
  open,
  onOpenChange,
  onExit,
  step,
}: CancelWizardModalProps) {
  function handleKeepEditing() {
    onOpenChange(false)
  }

  function handleExit() {
    const state = useCampaignWizardStore.getState()
    track('campaign_wizard_cancelled', {
      step_number_at_cancel: step,
      had_inputs: state.isDirty,
    })
    state.reset()
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
