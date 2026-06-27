import { t } from '@lingui/core/macro'
import { Link } from '@tanstack/react-router'
import { CheckCircle2, Film, Globe2, MessageSquare, Pencil } from 'lucide-react'

import { Button } from '#/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { cn } from '#/lib/utils'
import type { CampaignDetailResponse } from '#/shared/api/generated/model'
import { formatPlatform } from '#/shared/utils/format'
import type { ReactNode } from 'react'

interface CampaignDetailHeaderProps {
  detail: CampaignDetailResponse
}

interface CampaignDetailHeaderComponentProps extends CampaignDetailHeaderProps {
  onEditCampaign: () => void
}

function getStatusLabel(status: string) {
  const labels: Record<string, () => string> = {
    draft: () => t`Borrador`,
    active: () => t`Activa`,
    paused: () => t`Pausada`,
    completed: () => t`Completada`,
  }
  return labels[status]?.() ?? status
}

export function CampaignDetailHeader({
  detail,
  onEditCampaign,
}: CampaignDetailHeaderComponentProps) {
  const editButtonDisabled = !detail.action_flags.can_edit
  const editDisabledReason = t`No tenés permisos para editar esta campaña`
  const editButton = (
    <Button
      variant="outline"
      size="sm"
      disabled={editButtonDisabled}
      onClick={onEditCampaign}
      aria-label={editButtonDisabled ? editDisabledReason : undefined}
    >
      <Pencil className="size-3.5" aria-hidden="true" />
      {t`Editar`}
    </Button>
  )

  return (
    <header className="shrink-0 border-b border-border bg-background px-5 py-5 md:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0">
          <div className="min-w-0 space-y-3">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
              <h1 className="min-w-0 truncate text-[22px] font-semibold text-foreground">
                {detail.name}
              </h1>
              <StatusPill status={detail.status} />
            </div>
            <CampaignHeaderSummary detail={detail} />
          </div>
        </div>

        <TooltipProvider>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 whitespace-nowrap lg:ml-auto">
            <Button asChild variant="outline" size="sm">
              <Link
                to="/workspace"
                search={{
                  filter: 'all',
                  campaign_id: detail.campaign_id,
                }}
              >
                <MessageSquare className="size-3.5" aria-hidden="true" />
                {t`Ir a conversaciones`}
              </Link>
            </Button>
            {editButtonDisabled ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">{editButton}</span>
                </TooltipTrigger>
                <TooltipContent>{editDisabledReason}</TooltipContent>
              </Tooltip>
            ) : (
              editButton
            )}
          </div>
        </TooltipProvider>
      </div>
    </header>
  )
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
      <CheckCircle2 className="size-3.5" aria-hidden="true" />
      {getStatusLabel(status)}
    </span>
  )
}

function CampaignHeaderSummary({ detail }: CampaignDetailHeaderProps) {
  const items = [
    {
      label: t`Tipo de contenido`,
      value: formatContentModel(detail.commercial.content_model),
      icon: <Film className="size-3.5" aria-hidden="true" />,
    },
    {
      label: t`Canales`,
      value: formatList(detail.platforms, t`Sin plataformas`),
      icon: <Globe2 className="size-3.5" aria-hidden="true" />,
    },
    ...formatAudienceItems(detail.audience.description).map((item) => ({
      ...item,
      icon: <Globe2 className="size-3.5" aria-hidden="true" />,
    })),
  ]

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
      {items.map((item) => (
        <HeaderSummaryItem
          key={item.label}
          icon={item.icon}
          label={item.label}
          value={item.value}
        />
      ))}
    </div>
  )
}

function HeaderSummaryItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span className="text-muted-foreground">{icon}</span>
      <span className="font-mono text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
        {label}
      </span>
      <span className="max-w-48 truncate font-medium text-foreground">
        {value}
      </span>
    </div>
  )
}

function formatList(items: string[] | null, fallback: string) {
  if (!items || items.length === 0) return fallback
  return items.map(formatPlatform).join(', ')
}

function formatContentModel(value: string | null) {
  if (value === 'ugc_videos') return t`Videos UGC`
  if (value === 'influencer_posts') return t`Publicaciones de influencers`
  return value ?? t`Sin modelo definido`
}

function formatAudienceItems(
  description: string | null,
): Array<{ label: string; value: string }> {
  if (!description) {
    return [{ label: t`Audiencia`, value: t`Sin audiencia definida` }]
  }

  const parts = description
    .split(/\s+-\s+/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length >= 3) {
    const country = parts[0] ?? description
    const audience = parts.slice(1, -1).join(' - ') || t`Sin audiencia definida`
    const tier = parts.at(-1) ?? t`Sin tier`

    return [
      { label: t`País`, value: country },
      { label: t`Audiencia`, value: audience },
      { label: t`Tier`, value: tier },
    ]
  }

  if (parts.length === 2) {
    const country = parts[0] ?? description
    const audience = parts[1] ?? t`Sin audiencia definida`

    return [
      { label: t`País`, value: country },
      { label: t`Audiencia`, value: audience },
    ]
  }

  return [{ label: t`Audiencia`, value: description }]
}

export function CampaignDetailHeaderSkeleton() {
  return (
    <header className="shrink-0 border-b border-border bg-background px-5 py-5 md:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3.5">
          <div className="size-12 rounded-xl bg-muted" />
          <div className="space-y-2">
            <div className="h-6 w-64 rounded-full bg-muted" />
            <div className="h-4 w-80 max-w-full rounded-full bg-muted" />
            <div className="h-4 w-52 rounded-full bg-muted" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-24 rounded-md bg-muted" />
          <div className="h-8 w-32 rounded-md bg-muted" />
          <div className="h-8 w-20 rounded-md bg-muted" />
        </div>
      </div>
    </header>
  )
}

export function CampaignDetailHeaderError({
  className,
}: {
  className?: string
}) {
  return (
    <header
      className={cn(
        'shrink-0 border-b border-border bg-background px-5 py-5 md:px-8',
        className,
      )}
    >
      <div className="rounded-2xl border border-border bg-card p-5">
        <h1 className="text-lg font-semibold text-foreground">
          {t`No encontramos esta campaña`}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t`Puede que no exista o que no pertenezca a este espacio de trabajo.`}
        </p>
      </div>
    </header>
  )
}
