import { t } from '@lingui/core/macro'
import { Zap } from 'lucide-react'

const BRANDS = () => [t`Fintech`, t`SaaS`, t`Gaming`, t`E-commerce`, t`Beauty`]
const TOTAL = 142

export function C3PrimingBrandsWaiting() {
  const brands = BRANDS()
  const remaining = TOTAL - brands.length

  return (
    <div className="relative flex w-full flex-col items-center gap-10 max-sm:gap-6">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-190px] h-[640px] w-[860px] -translate-x-1/2 opacity-80 wizard-glow-pulse"
        style={{
          background:
            'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(13, 166, 120, 0.24) 0%, rgba(13, 166, 120, 0) 100%)',
        }}
      />

      <div className="relative flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5">
        <Zap className="size-3 text-primary" />
        <span className="text-[11px] font-medium text-primary">
          {t`Feed activo ahora mismo`}
        </span>
      </div>

      <div className="relative flex w-full max-w-[720px] flex-col items-center gap-3">
        <h1 className="text-center text-[44px] font-semibold leading-[1.2] tracking-[-0.02em] text-foreground max-sm:text-[30px]">
          {t`En Marz las marcas buscan creadores de todos los nichos`}
        </h1>
      </div>

      <div className="relative flex flex-wrap justify-center gap-4 max-sm:gap-3">
        {brands.map((b) => (
          <div
            key={b}
            className="flex size-[120px] items-center justify-center rounded-[20px] border border-border bg-card max-sm:size-[88px] max-sm:rounded-2xl"
          >
            <span className="text-xs font-semibold text-muted-foreground">
              {b}
            </span>
          </div>
        ))}
        <div className="flex size-[120px] items-center justify-center rounded-[20px] border border-primary bg-primary/10 max-sm:size-[88px] max-sm:rounded-2xl">
          <span className="text-xs font-semibold text-primary">
            {t`+${remaining} más`}
          </span>
        </div>
      </div>
    </div>
  )
}
