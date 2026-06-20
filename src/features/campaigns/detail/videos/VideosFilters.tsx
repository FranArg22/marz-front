import { t } from '@lingui/core/macro'
import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { cn } from '#/lib/utils'
import type {
  CampaignParticipantListItem,
  DeliverableStatus,
  SocialPlatform,
} from '#/shared/api/generated/model'

export interface VideosFilterParams {
  search?: string
  status?: DeliverableStatus
  platform?: SocialPlatform
  creator_account_id?: string
}

interface VideosFiltersProps {
  params: VideosFilterParams
  creators: CampaignParticipantListItem[]
  onParamsChange: (params: VideosFilterParams) => void
}

const ALL_PLATFORMS = 'all'
const ALL_CREATORS = 'all'
const ALL_STATUSES = 'all'

// Selects con los mismos colores que la barra de Explorar. Ancho uniforme
// (`sm:w-48`) para que entre la etiqueta más larga ("Todas las plataformas")
// sin truncar y queden del mismo tamaño.
const SELECT_TRIGGER_BASE =
  'h-9 shrink-0 rounded-full border px-3 text-xs font-medium transition-colors sm:w-48'
const SELECT_TRIGGER_INACTIVE =
  'border-border bg-transparent text-muted-foreground hover:bg-surface-hover hover:text-foreground'
// Filtrado: chip relleno como en Explorar. El `!` fuerza el color del chevron
// del Select por sobre su default interno `text-muted-foreground`.
const SELECT_TRIGGER_ACTIVE =
  'border-transparent bg-secondary text-secondary-foreground [&_svg]:text-secondary-foreground!'

function selectTriggerClass(active: boolean) {
  return cn(
    SELECT_TRIGGER_BASE,
    active ? SELECT_TRIGGER_ACTIVE : SELECT_TRIGGER_INACTIVE,
  )
}

function getStatusOptions(): ReadonlyArray<{
  value: DeliverableStatus
  label: string
}> {
  return [
    { value: 'pending', label: t`Pendiente` },
    { value: 'draft_submitted', label: t`En revisión` },
    { value: 'changes_requested', label: t`Cambios solicitados` },
    { value: 'draft_approved', label: t`Borrador aprobado` },
    { value: 'link_submitted', label: t`Enlace enviado` },
    { value: 'link_approved', label: t`Enlace aprobado` },
    { value: 'completed', label: t`Completado` },
    { value: 'paid', label: t`Paid` },
  ]
}

const platformOptions: ReadonlyArray<{
  value: SocialPlatform
  label: string
}> = [
  /* eslint-disable lingui/no-unlocalized-strings -- Platform brand names are not translatable UI copy. */
  { value: 'youtube', label: 'YouTube' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  /* eslint-enable lingui/no-unlocalized-strings */
]

export function VideosFilters({
  params,
  creators,
  onParamsChange,
}: VideosFiltersProps) {
  const [searchValue, setSearchValue] = useState(params.search ?? '')

  useEffect(() => {
    setSearchValue(params.search ?? '')
  }, [params.search])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextSearch = searchValue.trim()
      if ((params.search ?? '') === nextSearch) return
      onParamsChange({
        ...params,
        search: nextSearch.length > 0 ? nextSearch : undefined,
      })
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [onParamsChange, params, searchValue])

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card px-3 py-2.5 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.12)] sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative min-w-0 sm:w-60">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder={t`Buscar video`}
          aria-label={t`Buscar videos`}
          className="rounded-full bg-transparent pl-9"
        />
      </div>

      <Select
        value={params.status ?? ALL_STATUSES}
        onValueChange={(value) =>
          onParamsChange({
            ...params,
            status: isCampaignVideoStatus(value) ? value : undefined,
          })
        }
      >
        <SelectTrigger
          className={selectTriggerClass(params.status !== undefined)}
          aria-label={t`Filtrar por estado`}
        >
          <SelectValue placeholder={t`Estado`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_STATUSES}>{t`Todos los estados`}</SelectItem>
          {getStatusOptions().map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={params.platform ?? ALL_PLATFORMS}
        onValueChange={(value) =>
          onParamsChange({
            ...params,
            platform: isPlatform(value) ? value : undefined,
          })
        }
      >
        <SelectTrigger
          className={selectTriggerClass(params.platform !== undefined)}
          aria-label={t`Filtrar por plataforma`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            value={ALL_PLATFORMS}
          >{t`Todas las plataformas`}</SelectItem>
          {platformOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={params.creator_account_id ?? ALL_CREATORS}
        onValueChange={(value) =>
          onParamsChange({
            ...params,
            creator_account_id:
              value === ALL_CREATORS || value.length === 0 ? undefined : value,
          })
        }
      >
        <SelectTrigger
          className={selectTriggerClass(
            params.creator_account_id !== undefined,
          )}
          aria-label={t`Filtrar por creador`}
        >
          <SelectValue placeholder={t`Creador`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_CREATORS}>{t`Todos los creadores`}</SelectItem>
          {creators.map((participant) => (
            <SelectItem
              key={participant.creator.account_id}
              value={participant.creator.account_id}
            >
              {participant.creator.display_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <button
        type="button"
        className="shrink-0 px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40 sm:ml-auto"
        disabled={!hasActiveVideoFilters(params)}
        onClick={() => {
          setSearchValue('')
          onParamsChange({})
        }}
      >
        {t`Limpiar`}
      </button>
    </div>
  )
}

export function hasActiveVideoFilters(params: VideosFilterParams) {
  return (
    (params.search?.trim().length ?? 0) > 0 ||
    params.status !== undefined ||
    params.platform !== undefined ||
    params.creator_account_id !== undefined
  )
}

export function isCampaignVideoPlatform(
  value: string,
): value is SocialPlatform {
  return platformOptions.some((option) => option.value === value)
}

export function isCampaignVideoStatus(
  value: string,
): value is DeliverableStatus {
  return getStatusOptions().some((option) => option.value === value)
}

function isPlatform(value: string): value is SocialPlatform {
  return isCampaignVideoPlatform(value)
}
