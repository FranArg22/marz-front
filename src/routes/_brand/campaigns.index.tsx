import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { ArrowUpRight, Megaphone, Plus } from 'lucide-react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import type { CampaignListItem } from '#/features/campaigns/hooks/useCampaignsList'
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
  year: 'numeric',
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
    <div className="h-full overflow-y-auto bg-background p-6 pb-mobile-nav">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            <Trans>Campañas</Trans>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <Trans>
              Seguimiento operativo de campañas creadas en este espacio.
            </Trans>
          </p>
        </div>
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
        <CampaignsList campaigns={campaigns} />
      ) : (
        <CampaignsEmptyState />
      )}
    </div>
  )
}

function CampaignsList({ campaigns }: { campaigns: CampaignListItem[] }) {
  return (
    <section className="mt-6 overflow-hidden rounded-lg border border-border bg-card">
      <div className="hidden grid-cols-[minmax(280px,1fr)_150px_160px_160px_96px] border-b border-border bg-background px-5 py-3 text-xs font-medium text-muted-foreground uppercase lg:grid">
        <span>{t`Campaña`}</span>
        <span>{t`Estado`}</span>
        <span>{t`Creada`}</span>
        <span>{t`Actualizada`}</span>
        <span className="text-right">{t`Acción`}</span>
      </div>
      <div className="divide-y divide-border">
        {campaigns.map((campaign) => (
          <CampaignRow key={campaign.id} campaign={campaign} />
        ))}
      </div>
    </section>
  )
}

function CampaignRow({ campaign }: { campaign: CampaignListItem }) {
  const status = getStatusMeta(campaign.status)

  return (
    <Link
      to="/campaigns/$campaignId"
      params={{ campaignId: campaign.id }}
      search={{ tab: 'overview' }}
      className="group grid gap-3 px-5 py-4 outline-none transition-colors hover:bg-muted/30 focus-visible:bg-muted/30 focus-visible:ring-[3px] focus-visible:ring-ring/40 lg:grid-cols-[minmax(280px,1fr)_150px_160px_160px_96px] lg:items-center lg:gap-0"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={`mt-1 h-10 w-1 shrink-0 rounded-full ${status.indicatorClass}`}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-foreground">
            {campaign.name}
          </div>
          <div className="mt-1 font-mono text-[10px] text-muted-foreground">
            {campaign.id}
          </div>
        </div>
      </div>

      <div>
        <Badge variant={status.variant} className="rounded-full">
          {status.label}
        </Badge>
      </div>

      <RowDate label={t`Creada`} value={campaign.createdAt} />
      <RowDate label={t`Actualizada`} value={campaign.updatedAt} />

      <div className="flex justify-start lg:justify-end">
        <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground transition-colors group-hover:text-primary">
          {t`Abrir`}
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </span>
      </div>
    </Link>
  )
}

function RowDate({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-sm">
      <div className="text-[10px] font-medium text-muted-foreground uppercase lg:hidden">
        {label}
      </div>
      <div className="text-muted-foreground">{formatCampaignDate(value)}</div>
    </div>
  )
}

function getStatusMeta(status: CampaignListItem['status']): {
  label: string
  variant: 'default' | 'secondary' | 'outline'
  indicatorClass: string
} {
  const statusMeta: Record<
    CampaignListItem['status'],
    {
      label: string
      variant: 'default' | 'secondary' | 'outline'
      indicatorClass: string
    }
  > = {
    draft: {
      label: t`Borrador`,
      variant: 'outline',
      // eslint-disable-next-line lingui/no-unlocalized-strings -- clase Tailwind, no es UI
      indicatorClass: 'bg-muted-foreground/35',
    },
    active: {
      label: t`Activa`,
      variant: 'default',
      indicatorClass: 'bg-primary',
    },
    paused: {
      label: t`Pausada`,
      variant: 'secondary',
      // eslint-disable-next-line lingui/no-unlocalized-strings -- clase Tailwind, no es UI
      indicatorClass: 'bg-muted-foreground/60',
    },
    completed: {
      label: t`Completada`,
      variant: 'secondary',
      indicatorClass: 'bg-foreground',
    },
  }

  return statusMeta[status]
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
