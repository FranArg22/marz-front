import { useMemo } from 'react'
import { useStore } from '@tanstack/react-form'
import { useQueryClient } from '@tanstack/react-query'
import { t } from '@lingui/core/macro'
import { CircleCheck } from 'lucide-react'
import { z } from 'zod'

import { Button } from '#/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group'
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
import { COUNTRIES } from '#/features/identity/onboarding/creator/countries'
import { useAppForm } from '#/shared/ui/form'

export const PayoutAccountSchema = z.object({
  account_type: z.enum(['bank', 'external_app']),
  holder_name: z.string().min(1).max(200),
  provider_name: z.string().min(1).max(200),
  identifier: z.string().min(1).max(200),
  country: z.string().length(2),
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
          {t`Cargá una cuenta bancaria o externa que pueda recibir transferencias en USD.`}
        </DialogDescription>
      </DialogHeader>

      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault()
          void form.handleSubmit()
        }}
      >
        <form.AppField name="account_type">
          {(field) => (
            <ToggleGroup
              type="single"
              variant="outline"
              value={field.state.value}
              onValueChange={(value) => {
                if (value)
                  field.handleChange(
                    value as PayoutAccountValues['account_type'],
                  )
              }}
              className="w-full"
              aria-label={t`Tipo de cuenta`}
            >
              <ToggleGroupItem value="bank" className="flex-1">
                {t`Banco`}
              </ToggleGroupItem>
              <ToggleGroupItem value="external_app" className="flex-1">
                {t`App externa`}
              </ToggleGroupItem>
            </ToggleGroup>
          )}
        </form.AppField>

        <div className="grid gap-5">
          <form.AppField name="holder_name">
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

          <form.AppField name="provider_name">
            {(field) => (
              <field.TextField
                label={t`Banco o proveedor`}
                placeholder={t`Banco Galicia, Wise, Payoneer...`}
                required
                maxLength={200}
              />
            )}
          </form.AppField>

          <form.AppField name="identifier">
            {(field) => (
              <field.TextField
                label={t`Identificador`}
                placeholder={t`CBU, IBAN, email o alias de cuenta`}
                required
                maxLength={200}
              />
            )}
          </form.AppField>

          <form.AppField name="country">
            {(field) => (
              <field.SelectField
                label={t`País de la cuenta`}
                required
                placeholder={t`Seleccioná un país`}
                options={COUNTRIES.map((country) => ({
                  value: country.code,
                  label: country.name,
                }))}
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
              {t`La cuenta debe recibir USD`}
            </p>
            <p className="text-sm text-muted-foreground">
              {t`Por ahora solo hacemos transferencias en dólares estadounidenses.`}
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
    account_type: account?.account_type ?? 'bank',
    holder_name: account?.holder_name ?? '',
    provider_name: account?.provider_name ?? '',
    identifier: account?.identifier ?? '',
    country: account?.country ?? '',
  }
}

function toPayload(value: PayoutAccountValues): UpsertPayoutAccountRequest {
  return {
    account_type: value.account_type,
    holder_name: value.holder_name.trim(),
    provider_name: value.provider_name.trim(),
    identifier: value.identifier.trim(),
    country: value.country.toUpperCase(),
  }
}
