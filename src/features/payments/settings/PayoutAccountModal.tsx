import { useMemo } from 'react'
import { useStore } from '@tanstack/react-form'
import { useQueryClient } from '@tanstack/react-query'
import { t } from '@lingui/core/macro'
import { CircleCheck, TriangleAlert } from 'lucide-react'
import { z } from 'zod'

import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import {
  getGetMyPayoutAccountQueryKey,
  useUpsertMyPayoutAccount,
} from '#/shared/api/generated/creator/creator'
import type {
  PayoutAccount,
  UpsertPayoutAccountRequest,
} from '#/shared/api/generated/model'
import { useAppForm } from '#/shared/ui/form'

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'checking', label: () => t`Checking` },
  { value: 'savings', label: () => t`Savings` },
  { value: 'business', label: () => t`Business` },
] as const

export const PayoutAccountSchema = z.object({
  name: z.string().min(1).max(200),
  account_holder_name: z.string().min(1).max(200),
  account_number: z.string().regex(/^\d{1,17}$/),
  account_type: z.enum(['checking', 'savings', 'business']),
  routing_number: z.string().regex(/^\d{9}$/),
  address: z.string().min(1).max(500),
})

type PayoutAccountValues = z.infer<typeof PayoutAccountSchema>

interface PayoutAccountModalProps {
  open: boolean
  account: PayoutAccount | null
  onOpenChange: (open: boolean) => void
}

export function PayoutAccountModal({
  open,
  account,
  onOpenChange,
}: PayoutAccountModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <PayoutAccountModalContent
          key={account?.id ?? 'new'}
          account={account}
          onOpenChange={onOpenChange}
        />
      ) : null}
    </Dialog>
  )
}

function PayoutAccountModalContent({
  account,
  onOpenChange,
}: Omit<PayoutAccountModalProps, 'open'>) {
  const queryClient = useQueryClient()
  const upsertPayoutAccount = useUpsertMyPayoutAccount()
  const defaultValues = useMemo(() => toFormValues(account), [account])

  const form = useAppForm({
    defaultValues,
    validators: {
      onSubmit: PayoutAccountSchema,
    },
    onSubmit: async ({ value }) => {
      await upsertPayoutAccount.mutateAsync({
        data: toPayload(value),
      })
      await queryClient.invalidateQueries({
        queryKey: getGetMyPayoutAccountQueryKey(),
      })
      onOpenChange(false)
    },
  })

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)

  return (
    <DialogContent className="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>
          {account ? t`Editar cuenta de cobro` : t`Agregar cuenta de cobro`}
        </DialogTitle>
        <DialogDescription>
          {t`Cargá una cuenta bancaria de Estados Unidos para recibir transferencias ACH en USD.`}
        </DialogDescription>
      </DialogHeader>

      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault()
          void form.handleSubmit()
        }}
      >
        <div className="grid gap-5">
          <form.AppField name="name">
            {(field) => (
              <field.TextField
                label={t`Nombre de la cuenta`}
                placeholder={t`Ej. Juan Banco Chase`}
                required
                maxLength={200}
              />
            )}
          </form.AppField>

          <form.AppField name="account_holder_name">
            {(field) => (
              <field.TextField
                label={t`Titular de la cuenta`}
                placeholder={t`Nombre legal o razón social`}
                required
                maxLength={200}
                autoComplete="name"
              />
            )}
          </form.AppField>

          <form.AppField name="account_number">
            {(field) => (
              <field.TextField
                label={t`Número de cuenta`}
                placeholder={t`Hasta 17 dígitos`}
                required
                inputMode="numeric"
                maxLength={17}
              />
            )}
          </form.AppField>

          <form.AppField name="account_type">
            {(field) => (
              <field.SelectField
                label={t`Tipo de cuenta`}
                required
                placeholder={t`Seleccioná un tipo`}
                options={ACCOUNT_TYPE_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label(),
                }))}
              />
            )}
          </form.AppField>

          <form.AppField name="routing_number">
            {(field) => (
              <field.TextField
                label={t`Routing number (ABA)`}
                placeholder={t`9 dígitos`}
                required
                inputMode="numeric"
                maxLength={9}
              />
            )}
          </form.AppField>

          <form.AppField name="address">
            {(field) => (
              <field.TextField
                label={t`Dirección del banco`}
                placeholder={t`Dirección de la sucursal del banco`}
                required
                maxLength={500}
                autoComplete="off"
                hint={
                  <span className="flex items-center gap-1.5 text-warning">
                    <TriangleAlert className="size-3.5 shrink-0" aria-hidden />
                    {t`Es la dirección del banco, no la tuya. Se suelen confundir.`}
                  </span>
                }
              />
            )}
          </form.AppField>
        </div>

        <div className="flex items-start gap-3 rounded-md border border-primary/30 bg-primary/10 px-3 py-3">
          <CircleCheck
            className="mt-0.5 size-5 shrink-0 text-primary"
            aria-hidden
          />
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">
              {t`Solo transferencias ACH en USD`}
            </p>
            <p className="text-sm text-muted-foreground">
              {t`Por ahora solo soportamos cuentas bancarias de Estados Unidos vía ACH.`}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t`Cancelar`}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t`Guardando...` : t`Guardar cuenta`}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

function toFormValues(account: PayoutAccount | null): PayoutAccountValues {
  return {
    name: account?.name ?? '',
    account_holder_name: account?.account_holder_name ?? '',
    account_number: account?.account_number ?? '',
    account_type: account?.account_type ?? 'checking',
    routing_number: account?.routing_number ?? '',
    address: account?.address ?? '',
  }
}

function toPayload(value: PayoutAccountValues): UpsertPayoutAccountRequest {
  return {
    type: 'ach',
    name: value.name.trim(),
    account_holder_name: value.account_holder_name.trim(),
    account_number: value.account_number.trim(),
    account_type: value.account_type,
    routing_number: value.routing_number.trim(),
    address: value.address.trim(),
  }
}
