import { t } from '@lingui/core/macro'
import { Link } from '@tanstack/react-router'
import { Lock, Sparkles } from 'lucide-react'

import { Button } from '#/components/ui/button'

export function DiscoveryUpsell() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-12 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted">
        <Lock className="size-8 text-muted-foreground" aria-hidden />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          {t`Descubrí creators de tu nicho`}
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {t`Con Discovery podés explorar nuestra red de creators, filtrar por plataforma, engagement, precio y más. Actualizá tu plan para acceder.`}
        </p>
      </div>
      <Button asChild>
        <Link to="/billing">
          <Sparkles className="size-4" aria-hidden />
          {t`Actualizar plan`}
        </Link>
      </Button>
    </div>
  )
}
