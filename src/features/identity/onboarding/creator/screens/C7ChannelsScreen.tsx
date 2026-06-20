import { useCallback, useMemo } from 'react'
import { t } from '@lingui/core/macro'
import { Info } from 'lucide-react'
import { validateChannels } from '../schema'
import { useCreatorOnboardingStore } from '../store'
import { ChannelEditor } from '../components/ChannelEditor'
import type { CreatorChannel } from '../types'

export function C7ChannelsScreen() {
  const store = useCreatorOnboardingStore()
  const channels = store.channels ?? []

  const updateChannels = useCallback(
    (next: CreatorChannel[]) => {
      store.setField('channels', next)
    },
    [store],
  )

  const errors = useMemo(
    () => (channels.length > 0 ? validateChannels(channels) : []),
    [channels],
  )

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="flex w-full max-w-[720px] flex-col items-center gap-2.5">
        <h1 className="text-center text-[28px] font-semibold leading-tight tracking-[-0.02em] text-foreground">
          {t`Conectá tus cuentas y qué publicás`}
        </h1>
        <p className="text-center text-sm leading-[1.5] text-muted-foreground">
          {t`Verificamos followers y engagement. Cargá tu tarifa por formato.`}
        </p>
      </div>
      <div className="flex w-full max-w-[560px] items-start gap-1.5 rounded-xl border border-border bg-muted/40 p-3 text-[11px] leading-[1.5] text-muted-foreground">
        <Info className="mt-0.5 size-3 shrink-0" />
        <span>
          {t`Si tenés más de una cuenta por red social, creá una cuenta de creador secundaria en Marz con un mail distinto al que usaste acá.`}
        </span>
      </div>
      <ChannelEditor channels={channels} onChange={updateChannels} />
      {errors.length > 0 && (
        <p
          className="text-[length:var(--font-size-sm)] text-destructive"
          role="alert"
        >
          {}
          {errors.includes('exactly_one_primary_required')
            ? t`Seleccioná exactamente un canal como principal.`
            : errors.includes('duplicate_format_in_channel')
              ? t`No se puede repetir un formato dentro del mismo canal.`
              : errors.includes('format_not_valid_for_platform')
                ? t`Hay formatos inválidos para la plataforma seleccionada.`
                : null}
          {}
        </p>
      )}
    </div>
  )
}
