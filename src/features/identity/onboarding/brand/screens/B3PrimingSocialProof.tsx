import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { useBrandOnboardingStore } from '../store'
import { verticalLabelLower } from '../verticalLabels'

export function B3PrimingSocialProof() {
  const vertical = useBrandOnboardingStore((s) => s.vertical)
  const verticalLabel = verticalLabelLower(vertical)
  const badgeText = verticalLabel
    ? t`Marcas de ${verticalLabel} ya trabajan con Marz`
    : t`Marcas líderes ya trabajan con Marz`

  return (
    <div className="relative flex w-full flex-col items-center gap-12 max-sm:gap-6">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-140px] h-[640px] w-[780px] -translate-x-1/2 opacity-80 wizard-glow-pulse"
        style={{
          background:
            'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(13, 166, 120, 0.2) 0%, rgba(13, 166, 120, 0) 100%)',
        }}
      />

      <div className="relative flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5">
        <span className="size-1.5 rounded-full bg-primary" />
        <span className="text-[11px] font-medium text-primary">
          {badgeText}
        </span>
      </div>

      <div className="relative flex w-full max-w-[720px] flex-col items-center gap-3">
        <h1 className="text-center text-[52px] font-semibold leading-[1.2] tracking-[-0.02em] text-foreground max-sm:text-[32px]">
          {t`Acá no entrás solo.`}
        </h1>
        <p className="text-center text-[15px] leading-[1.5] text-muted-foreground">
          {t`Cinco años potenciando marcas con creadores de contenido.`}
        </p>
      </div>

      <div className="relative flex items-stretch gap-[60px] max-sm:flex-col max-sm:items-center max-sm:gap-4">
        <div className="flex flex-col items-center gap-2">
          <span className="text-[64px] font-bold leading-none tracking-[-0.02em] text-primary max-sm:text-[40px]">
            <Trans>+$1M</Trans>
          </span>
          <span className="text-xs text-muted-foreground">
            {t`USD manejados en campañas`}
          </span>
        </div>

        <div
          className="w-px self-center bg-foreground/10 max-sm:hidden"
          style={{ height: 100 }}
        />

        <div className="flex flex-col items-center gap-2">
          <span className="text-[64px] font-bold leading-none tracking-[-0.02em] text-foreground max-sm:text-[40px]">
            <Trans>+500M</Trans>
          </span>
          <span className="text-xs text-muted-foreground">
            {t`views generados`}
          </span>
        </div>

        <div
          className="w-px self-center bg-foreground/10 max-sm:hidden"
          style={{ height: 100 }}
        />

        <div className="flex flex-col items-center gap-2">
          <span className="text-[64px] font-bold leading-none tracking-[-0.02em] text-foreground max-sm:text-[40px]">
            {t`5 años`}
          </span>
          <span className="text-xs text-muted-foreground">
            {t`liderando campañas`}
          </span>
        </div>
      </div>
    </div>
  )
}
