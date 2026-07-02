import { useState } from 'react'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'

import { Button } from '#/components/ui/button'
import type { Wallet } from '#/shared/api/generated/model'
import { PayoutAccountModal } from '#/features/payments/settings/PayoutAccountModal'
import { W8benGateModal } from './W8benGateModal'

interface WithdrawButtonProps {
  wallet: Wallet | undefined
  onWithdraw: () => void
}

export function WithdrawButton({ wallet, onWithdraw }: WithdrawButtonProps) {
  const [w8benOpen, setW8benOpen] = useState(false)
  const [payoutOpen, setPayoutOpen] = useState(false)

  if (!wallet) {
    return <div className="h-9 w-32 animate-pulse rounded-md bg-muted" />
  }

  const { eligibility, can_withdraw } = wallet

  if (eligibility.requires_w8ben) {
    return (
      <>
        <Button onClick={() => setW8benOpen(true)}>
          <Trans>Completar formulario W-8BEN</Trans>
        </Button>
        <W8benGateModal
          open={w8benOpen}
          redirectUrl={eligibility.w8ben_redirect_url}
          onOpenChange={setW8benOpen}
        />
      </>
    )
  }

  if (!eligibility.has_payout_account) {
    return (
      <>
        <Button onClick={() => setPayoutOpen(true)}>
          <Trans>Agregar cuenta de cobro</Trans>
        </Button>
        <PayoutAccountModal
          open={payoutOpen}
          account={null}
          onOpenChange={setPayoutOpen}
        />
      </>
    )
  }

  if (eligibility.has_inflight_withdrawal) {
    return (
      <Button disabled title={t`Tenés un retiro en proceso`}>
        <Trans>Retiro en proceso</Trans>
      </Button>
    )
  }

  return (
    <Button onClick={onWithdraw} disabled={!can_withdraw}>
      <Trans>Retirar</Trans>
    </Button>
  )
}
