import { t } from '@lingui/core/macro'
import { Users } from 'lucide-react'

/* eslint-disable lingui/no-unlocalized-strings */
const TESTIMONIALS = () => [
  {
    quote: t`”Rapidez y eficiencia. Cero vueltas.”`,
    handle: '@bahiablancafood',
    meta: t`Food · Establecido`,
    initials: t`BB`,
    color: '#F59E0B',
    highlighted: false,
  },
  {
    quote: t`”Claridad sobre el pago y los tiempos, con libertad total para armar el guion.”`,
    handle: '@mica.creando',
    meta: t`Lifestyle · En crecimiento`,
    initials: t`MC`,
    color: '#EC4899',
    highlighted: true,
  },
  {
    quote: t`”Toda la info en la plataforma. Podía ver el paso a paso del proceso.”`,
    handle: '@vianeconigliougc',
    meta: t`UGC · En crecimiento`,
    initials: t`VC`,
    color: '#3B82F6',
    highlighted: false,
  },
]
/* eslint-enable lingui/no-unlocalized-strings */

export function C8PrimingTestimonials() {
  return (
    <div className="relative flex w-full flex-col items-center gap-9 max-sm:gap-6">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-120px] h-[500px] w-[680px] -translate-x-1/2 opacity-50 wizard-glow-pulse"
        style={{
          background:
            'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(13, 166, 120, 0.24) 0%, rgba(13, 166, 120, 0) 100%)',
        }}
      />

      <div className="relative flex w-full max-w-[720px] flex-col items-center gap-3">
        <h1 className="text-center text-[28px] font-semibold leading-tight tracking-[-0.02em] text-foreground max-sm:text-[22px]">
          {t`Creadores reales hablando de Marz`}
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          {t`Los encuestamos luego de sus colaboraciones y esto salió.`}
        </p>
      </div>

      <div className="relative flex flex-wrap justify-center gap-4">
        {TESTIMONIALS().map((tt) => (
          <div
            key={tt.handle}
            className="flex w-[300px] flex-col gap-4 rounded-[20px] border bg-card p-6"
            style={{
              borderColor: tt.highlighted ? 'var(--primary)' : 'var(--border)',
            }}
          >
            <p className="text-xs leading-[1.5] text-foreground">{tt.quote}</p>
            <div className="flex items-center gap-2.5">
              <div
                className="flex size-9 items-center justify-center rounded-full"
                style={{ backgroundColor: tt.color }}
              >
                <span className="text-[11px] font-bold text-white">
                  {tt.initials}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-foreground">
                  {tt.handle}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {tt.meta}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="relative flex items-center gap-5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="size-3.5 text-primary" />
          <span>{t`+5000 creadores activos que reciben sus pagos en 24 horas`}</span>
        </div>
      </div>
    </div>
  )
}
