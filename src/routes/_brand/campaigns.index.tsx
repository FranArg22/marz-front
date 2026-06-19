import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { Megaphone, Plus } from 'lucide-react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { CampaignMiniCard } from '#/features/campaigns/components/CampaignMiniCard'
import { useCampaignsList } from '#/features/campaigns/hooks/useCampaignsList'
import { useCampaignQuotaQuery } from '#/features/campaigns/wizard/queries'
import { useRouteTopbar } from '#/features/identity/app-shell/useRouteTopbar'
import { useBrandSession } from '#/features/identity/session/BrandSessionContext'

export const Route = createFileRoute('/_brand/campaigns/')({
  component: CampaignsPage,
})

const campaignDateFormatter = new Intl.DateTimeFormat('es-AR', {
  month: 'short',
  day: 'numeric',
})

export function CampaignsPage() {
  const campaignsTopbarConfig = {
    breadcrumb: [{ icon: Megaphone, label: t`Campañas` }],
  }
  useRouteTopbar(campaignsTopbarConfig)

  const { brandWorkspace } = useBrandSession()
  const campaignsQuery = useCampaignsList()
  const quotaQuery = useCampaignQuotaQuery(brandWorkspace.id)
  const campaigns = campaignsQuery.data ?? []
  const campaignQuota =
    quotaQuery.data?.status === 200 ? quotaQuery.data.data : undefined
  const isCampaignCreationBlocked =
    campaignQuota?.can_create_more === false &&
    !quotaQuery.isLoading &&
    !quotaQuery.isError

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          <Trans>Campañas</Trans>
        </h1>
        <CampaignCreateCta
          isBlocked={isCampaignCreationBlocked}
          plan={campaignQuota?.plan}
        />
      </div>

      {campaignsQuery.isLoading ? (
        <div className="mt-24 text-center text-sm text-muted-foreground">
          {t`Cargando campañas...`}
        </div>
      ) : campaignsQuery.isError ? (
        <div className="mt-24 flex flex-col items-center gap-4 text-center">
          <p className="max-w-md text-sm text-destructive">
            {t`No pudimos cargar tus campañas. Intentá de nuevo.`}
          </p>
          <Button
            variant="outline"
            onClick={() => void campaignsQuery.refetch()}
          >
            {t`Reintentar`}
          </Button>
        </div>
      ) : campaigns.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((campaign) => (
            <CampaignMiniCard
              key={campaign.id}
              campaignId={campaign.id}
              name={campaign.name}
              startDate={formatCampaignDate(campaign.startDate)}
              status={campaign.status}
              creators={campaign.creators}
              budget={campaign.budget}
              videos={campaign.videos}
              platforms={campaign.platforms}
            />
          ))}
        </div>
      ) : (
        <CampaignsEmptyState />
      )}
    </div>
  )
}

function CampaignCreateCta({
  isBlocked,
  plan,
}: {
  isBlocked: boolean
  plan: string | undefined
}) {
  if (!isBlocked) {
    return (
      <Button asChild>
        <Link to="/campaigns/new">
          <Plus className="size-4" />
          <Trans>Nueva campaña</Trans>
        </Link>
      </Button>
    )
  }

  const planName = plan ?? t`plan actual`

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex" tabIndex={0}>
            <Button disabled>
              <Plus className="size-4" />
              <Trans>Nueva campaña</Trans>
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs leading-relaxed">
          <Trans>
            Alcanzaste el límite de tu plan ({planName}). Para crear más
            campañas, revisá los planes en suscripción.
          </Trans>
        </TooltipContent>
      </Tooltip>
      <Button asChild variant="outline">
        <Link to="/ajustes/suscripcion">
          <Trans>Ver planes</Trans>
        </Link>
      </Button>
    </div>
  )
}

function formatCampaignDate(value: string | null) {
  if (!value) return t`Sin fecha`

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return campaignDateFormatter.format(date)
}

function CampaignsEmptyState() {
  return (
    <div className="mt-24 flex flex-col items-center gap-4 text-center">
      <h2 className="text-lg font-medium text-foreground">
        <Trans>Todavía no tenés campañas</Trans>
      </h2>
      <p className="max-w-md text-sm text-muted-foreground">
        <Trans>
          Creá tu primera campaña para empezar a conectar con creadores y lanzar
          tu estrategia de influencer marketing.
        </Trans>
      </p>
      <Button asChild variant="outline" className="mt-2">
        <Link to="/campaigns/new">
          <Plus className="size-4" />
          <Trans>Crear campaña</Trans>
        </Link>
      </Button>
    </div>
  )
}
