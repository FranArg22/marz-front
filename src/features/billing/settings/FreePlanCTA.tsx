import { ArrowUpRight } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'

interface FreePlanCTAProps {
  onUpgrade: () => void
}

export function FreePlanCTA({ onUpgrade }: FreePlanCTAProps) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          {t`Plan gratuito`}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="max-w-2xl text-sm text-muted-foreground">
          {t`Tu workspace está en el plan free: sin invitaciones, 1 campaña activa y creadores ilimitados.`}
        </p>
        <div>
          <Button
            type="button"
            data-testid="settings.subscription.upgrade_cta_button"
            onClick={onUpgrade}
          >
            {t`Mejorar plan`}
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
