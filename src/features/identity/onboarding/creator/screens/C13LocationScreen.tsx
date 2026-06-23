import { useCallback } from 'react'
import { t } from '@lingui/core/macro'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { useListCountries } from '#/shared/api/generated/lookups/lookups'
import { FieldRow } from '#/shared/ui/form'
import { useCreatorOnboardingStore } from '../store'

export function C13LocationScreen() {
  const store = useCreatorOnboardingStore()
  const countriesQuery = useListCountries({ active: true })
  const countries =
    countriesQuery.data?.status === 200 ? countriesQuery.data.data.items : []

  const handleCityChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      store.setField('city', e.target.value || null)
    },
    [store],
  )

  return (
    <div className="flex w-full flex-col items-center gap-9 max-sm:gap-6">
      <div className="flex w-full max-w-[560px] flex-col items-center gap-2.5">
        <h1 className="text-center text-[28px] font-semibold leading-tight tracking-[-0.02em] text-foreground max-sm:text-[22px]">
          {t`¿Desde dónde creás?`}
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          {t`Base geográfica. Importa para campañas con foco regional.`}
        </p>
      </div>
      <div className="flex w-full max-w-[440px] flex-col gap-5">
        <FieldRow label={t`País`} error={store.fieldErrors.country}>
          {(aria) => (
            <Select
              value={store.country ?? ''}
              onValueChange={(v) => store.setField('country', v)}
            >
              <SelectTrigger
                id={aria.id}
                aria-describedby={aria['aria-describedby']}
                aria-invalid={aria['aria-invalid']}
                className="w-full"
              >
                <SelectValue placeholder={t`Seleccionar país`} />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-[280px]">
                {countries.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.label_es}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FieldRow>
        <FieldRow label={t`Ciudad`}>
          {(aria) => (
            <Input
              {...aria}
              value={store.city ?? ''}
              onChange={handleCityChange}
              placeholder={t`Buenos Aires`}
              maxLength={200}
            />
          )}
        </FieldRow>
      </div>
    </div>
  )
}
