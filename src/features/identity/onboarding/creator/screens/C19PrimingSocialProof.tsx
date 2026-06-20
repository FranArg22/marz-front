import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { Quote } from 'lucide-react'

export function C19PrimingSocialProof() {
  return (
    <div className="relative flex w-full flex-col items-center gap-10">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-150px] h-[500px] w-[680px] -translate-x-1/2 opacity-50 wizard-glow-pulse"
        style={{
          background:
            'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(13, 166, 120, 0.24) 0%, rgba(13, 166, 120, 0) 100%)',
        }}
      />

      <div className="relative flex size-14 items-center justify-center rounded-2xl bg-primary/10">
        <Quote className="size-6 text-primary" />
      </div>

      <div className="relative flex w-full max-w-[640px] flex-col gap-5 rounded-3xl border border-border bg-card p-8">
        <p className="text-base leading-[1.6] text-foreground">
          {t`“Toda la información estaba en la plataforma, podía ver el paso a paso del proceso, y el pago llegó a las 24 horas. Da seguridad tener todo por escrito.”`}
        </p>
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-9 items-center justify-center rounded-full"
            style={{ backgroundColor: '#A855F7' }}
          >
            <span className="text-[11px] font-bold text-white">
              <Trans>DB</Trans>
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground">
              <Trans>@duende.ba</Trans>
            </span>
            <span className="text-[10px] text-muted-foreground">
              {t`Verificado`}
            </span>
          </div>
        </div>
      </div>

      <div className="relative flex items-center gap-12">
        <Stat value={t`9.8 / 10`} label={t`Puntaje de satisfacción`} />
        <Stat value={t`24h`} label={t`Pagos garantizados`} />
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-2xl font-bold tracking-[-0.02em] text-foreground">
        {value}
      </span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  )
}
