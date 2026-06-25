import { useCallback } from 'react'
import { t } from '@lingui/core/macro'
import { Input } from '#/components/ui/input'
import { FieldRow } from '#/shared/ui/form'
import { useCreatorOnboardingStore } from '../store'

export function C1NameHandleScreen() {
  const store = useCreatorOnboardingStore()

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      store.setField('display_name', e.target.value)
    },
    [store],
  )

  return (
    <div className="flex w-full flex-col items-center gap-9 max-sm:gap-6">
      <div className="flex w-full max-w-[560px] flex-col items-center gap-2.5">
        <h1 className="text-center text-[28px] font-semibold leading-tight tracking-[-0.02em] text-foreground max-sm:text-[22px]">
          {t`¿Cómo te conocen?`}
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          {t`Tu nombre público.`}
        </p>
      </div>

      <div className="flex w-full max-w-[460px] flex-col gap-5">
        <FieldRow
          label={t`Nombre público`}
          error={store.fieldErrors.display_name}
        >
          {(aria) => (
            <Input
              {...aria}
              value={store.display_name ?? ''}
              onChange={handleNameChange}
              placeholder={t`Lucas Romero`}
              maxLength={200}
            />
          )}
        </FieldRow>
      </div>
    </div>
  )
}
