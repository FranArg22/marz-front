import { t } from '@lingui/core/macro'

import { firstErrorMessage  } from '#/shared/ui/form'
import type {useAppForm} from '#/shared/ui/form';

import { LogoUploader } from './LogoUploader'

type SettingsForm = ReturnType<
  typeof useAppForm<any, any, any, any, any, any, any, any, any, any, any, any>
>

interface BrandCardProps {
  form: SettingsForm
  currentLogoUrl: string | null
  brandName: string
}

export function BrandCard({ form, currentLogoUrl, brandName }: BrandCardProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-6 text-card-foreground">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">{t`Marca`}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t`Identidad pública de tu marca en Marz.`}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[160px_1fr]">
        <form.AppField name="logo_s3_key">
          {(field) => (
            <LogoUploader
              currentLogoUrl={currentLogoUrl}
              brandName={brandName}
              error={firstErrorMessage(field.state.meta.errors)}
              onKeyChange={(key) => field.handleChange(key)}
            />
          )}
        </form.AppField>

        <div className="grid gap-5">
          <form.AppField name="name">
            {(field) => (
              <field.TextField
                label={t`Nombre de marca`}
                required
                autoComplete="organization"
                className="bg-background"
              />
            )}
          </form.AppField>

          <form.AppField name="website_url">
            {(field) => (
              <field.TextField
                label={t`Sitio web`}
                required
                placeholder="https://"
                inputMode="url"
                autoComplete="url"
                className="bg-background"
              />
            )}
          </form.AppField>
        </div>
      </div>
    </section>
  )
}
