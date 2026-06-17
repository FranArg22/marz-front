import { t } from '@lingui/core/macro'

import { Input } from '#/components/ui/input'
import { FieldRow, firstErrorMessage } from '#/shared/ui/form'
import type { useAppForm } from '#/shared/ui/form'

type SettingsForm = ReturnType<
  typeof useAppForm<any, any, any, any, any, any, any, any, any, any, any, any>
>

interface ProfileCardProps {
  form: SettingsForm
  email: string
}

export function ProfileCard({ form, email }: ProfileCardProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-6 text-card-foreground">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">{t`Perfil`}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t`Datos visibles para operar el workspace.`}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <form.AppField name="full_name">
          {(field) => (
            <field.TextField
              label={t`Nombre`}
              required
              autoComplete="name"
              className="bg-background"
            />
          )}
        </form.AppField>

        <FieldRow label={t`Email`}>
          {(aria) => (
            <Input
              {...aria}
              value={email}
              disabled
              readOnly
              className="bg-background"
            />
          )}
        </FieldRow>

        <form.AppField name="phone_e164">
          {(field) => (
            <FieldRow
              label={t`Teléfono`}
              error={firstErrorMessage(field.state.meta.errors)}
            >
              {(aria) => (
                <Input
                  {...aria}
                  name={field.name}
                  value={
                    typeof field.state.value === 'string'
                      ? field.state.value
                      : ''
                  }
                  placeholder="+54911..."
                  autoComplete="tel"
                  className="bg-background"
                  onBlur={field.handleBlur}
                  onChange={(event) =>
                    field.handleChange(
                      event.target.value === '' ? null : event.target.value,
                    )
                  }
                />
              )}
            </FieldRow>
          )}
        </form.AppField>
      </div>
    </section>
  )
}
