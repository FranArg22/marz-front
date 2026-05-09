import { t } from '@lingui/core/macro'

import { Badge } from '#/components/ui/badge'

export function ConfigurationPendingBadge() {
  return (
    <Badge className="rounded-full bg-warning text-warning-foreground">
      {t`Configuración pendiente`}
    </Badge>
  )
}
