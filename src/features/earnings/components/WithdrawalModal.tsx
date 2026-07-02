import { useState } from 'react'
import { Trans } from '@lingui/react/macro'
import { CheckCircle2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import type { Wallet } from '#/shared/api/generated/model'
import { generateIdempotencyKey } from '#/shared/api/idempotency'
import { ApiError } from '#/shared/api/mutator'
import { useCreateWithdrawalMutation } from '../hooks/useCreateWithdrawalMutation'
import { getWalletQueryKey } from '../hooks/useWalletQuery'
import { trackWithdrawalRequested } from '../analytics'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function calcFee(gross: number, feePct: string): number {
  return Math.round(gross * Number(feePct)) / 100
}

function calcNet(gross: number, fee: number): number {
  return Math.round((gross - fee) * 100) / 100
}

interface WithdrawalModalProps {
  open: boolean
  wallet: Wallet
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function WithdrawalModal({
  open,
  wallet,
  onOpenChange,
  onSuccess,
}: WithdrawalModalProps) {
  const [idempotencyKey] = useState(() => generateIdempotencyKey())
  const [grossInput, setGrossInput] = useState('')
  const [inlineError, setInlineError] = useState<string | null>(null)
  const [step, setStep] = useState<'input' | 'success'>('input')
  const queryClient = useQueryClient()
  const mutation = useCreateWithdrawalMutation(idempotencyKey)

  const grossNum = Number(grossInput)
  const isValidNumber =
    grossInput !== '' && !Number.isNaN(grossNum) && grossNum > 0
  const minAmount = Number(wallet.min_withdrawal.amount)
  const maxAmount = Number(wallet.balance.amount)

  const belowMinimum = isValidNumber && grossNum < minAmount
  const aboveBalance = isValidNumber && grossNum > maxAmount

  const fee = isValidNumber ? calcFee(grossNum, wallet.withdrawal_fee_pct) : 0
  const net = isValidNumber ? calcNet(grossNum, fee) : 0

  const validationError = belowMinimum
    ? `Mínimo ${currencyFormatter.format(minAmount)}`
    : aboveBalance
      ? 'Saldo insuficiente'
      : null

  const canSubmit = isValidNumber && !validationError && !mutation.isPending

  async function handleSubmit() {
    setInlineError(null)
    try {
      await mutation.mutateAsync({
        data: {
          gross_amount: { amount: grossNum.toFixed(2), currency: 'USD' },
        },
      })
      trackWithdrawalRequested({
        gross_amount: grossNum.toFixed(2),
        fee_amount: fee.toFixed(2),
        net_amount: net.toFixed(2),
        currency: 'USD',
      })
      setStep('success')
    } catch (error) {
      if (error instanceof ApiError) {
        switch (error.code) {
          case 'w8ben_required':
            void queryClient.invalidateQueries({
              queryKey: getWalletQueryKey(),
            })
            onOpenChange(false)
            break
          case 'withdrawal_in_flight':
            setInlineError('Ya tenés un retiro en proceso')
            break
          case 'payout_account_missing':
            setInlineError('Primero cargá una cuenta de cobro')
            break
          case 'below_minimum':
            setInlineError('Mínimo no alcanzado')
            break
          case 'insufficient_balance':
            setInlineError('Saldo insuficiente')
            break
          default:
            setInlineError('Ocurrió un error. Intentá de nuevo.')
        }
      }
    }
  }

  function handleClose() {
    onOpenChange(false)
    onSuccess()
  }

  if (step === 'success') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent showCloseButton={false}>
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <CheckCircle2 className="size-12 text-green-500" />
            <p className="text-sm text-muted-foreground">
              <Trans>
                ¡Solicitud enviada! Tu retiro está en cola. Recibirás un aviso
                cuando se envíe.
              </Trans>
            </p>
          </div>
          <DialogFooter>
            <Button onClick={handleClose}>
              <Trans>Cerrar</Trans>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Trans>Retirar fondos</Trans>
          </DialogTitle>
          <DialogDescription>
            <Trans>Ingresá el monto bruto que querés retirar.</Trans>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={grossInput}
            onChange={(e) => {
              setGrossInput(e.target.value)
              setInlineError(null)
            }}
            aria-label="Monto bruto"
          />

          {validationError && (
            <p className="text-sm text-destructive">{validationError}</p>
          )}

          {inlineError && (
            <p className="text-sm text-destructive">{inlineError}</p>
          )}

          {isValidNumber && grossNum > 0 && (
            <div className="space-y-1 rounded-lg border border-border bg-muted/50 p-3 text-sm">
              <div className="flex justify-between">
                <span>
                  <Trans>Retirás</Trans>
                </span>
                <span>{currencyFormatter.format(grossNum)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>
                  <Trans>
                    Comisión de procesadora de pagos (
                    {wallet.withdrawal_fee_pct}%)
                  </Trans>
                </span>
                <span>− {currencyFormatter.format(fee)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>
                  <Trans>Vas a recibir</Trans>
                </span>
                <span>{currencyFormatter.format(net)}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <Trans>Cancelar</Trans>
          </Button>
          <Button disabled={!canSubmit} onClick={handleSubmit}>
            {mutation.isPending ? (
              <Trans>Procesando...</Trans>
            ) : (
              <Trans>Confirmar retiro</Trans>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
