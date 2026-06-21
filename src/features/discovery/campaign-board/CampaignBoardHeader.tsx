import { t } from '@lingui/core/macro'
import { RefreshCw } from 'lucide-react'

import { Button } from '#/components/ui/button'

interface CampaignBoardHeaderProps {
  isRefreshing: boolean
  onRefresh: () => void
}

export function CampaignBoardHeader({
  isRefreshing,
  onRefresh,
}: CampaignBoardHeaderProps) {
  return (
    <header className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="space-y-2 sm:max-w-3xl">
          <h1 className="text-2xl font-semibold text-foreground">
            {t`Campañas abiertas`}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t`Postulate a las que matchean con tu perfil. Cuanto más completo tu perfil, mejor el match.`}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start rounded-xl"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={isRefreshing ? 'animate-spin' : undefined}
            aria-hidden="true"
          />
          {t`Actualizar`}
        </Button>
      </div>
    </header>
  )
}
