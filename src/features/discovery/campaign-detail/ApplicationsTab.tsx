import { t } from '@lingui/core/macro'
import { ChevronDown, Loader2 } from 'lucide-react'

import { Button } from '#/components/ui/button'

import { ApplicationCard } from './ApplicationCard'
import { useCampaignApplicationsQuery } from './queries'

interface ApplicationsTabProps {
  campaignId: string
}

export function ApplicationsTab({ campaignId }: ApplicationsTabProps) {
  const query = useCampaignApplicationsQuery(campaignId)
  const items = query.data?.pages.flatMap((page) => page.items) ?? []
  const count = items.length

  if (query.isPending) {
    return (
      <div
        role="status"
        aria-label={t`Cargando postulaciones`}
        className="flex items-center gap-2 p-4 text-sm text-muted-foreground"
      >
        <Loader2 className="size-4 animate-spin" aria-hidden />
        {t`Cargando postulaciones...`}
      </div>
    )
  }

  if (query.isError) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
        {t`No pudimos cargar las postulaciones. Reintentá en unos minutos.`}
      </div>
    )
  }

  if (count === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <p className="text-sm font-semibold text-foreground">
          {t`Todavía no hay postulaciones`}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t`Las postulaciones entrantes van a aparecer acá.`}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          {t`Postulaciones`}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t`${count} postulaciones recibidas`}
        </p>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {items.map((application) => (
          <ApplicationCard
            key={application.application_id}
            campaignId={campaignId}
            application={application}
          />
        ))}
      </div>
      {query.hasNextPage ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
          >
            {query.isFetchingNextPage ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <ChevronDown className="size-3.5" aria-hidden />
            )}
            {t`Cargar más`}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
