import { Instagram, Music, Youtube } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { cn } from '#/lib/utils'
import type { DashboardTopVideoPlatform } from '#/shared/api/generated/model/dashboardTopVideoPlatform'
import type { DashboardTopVideosResponse } from '#/shared/api/generated/model/dashboardTopVideosResponse'

import { EmptyBlockState } from './EmptyBlockState'
import { ErrorBlockState } from './ErrorBlockState'

interface TopVideosTableProps {
  data: DashboardTopVideosResponse | undefined
  isLoading: boolean
  isError: boolean
  currentSort: 'views' | 'cpm' | 'engagement'
  onSortChange: (sort: 'views' | 'cpm' | 'engagement') => void
  onRetry: () => void
  onClear: () => void
}

const NUMBER_FMT = new Intl.NumberFormat('es-AR')
const PERCENT_FMT = new Intl.NumberFormat('es-AR', {
  style: 'percent',
  maximumFractionDigits: 1,
})
const DATE_FMT = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const SORT_OPTIONS: Array<{
  value: TopVideosTableProps['currentSort']
  label: string
}> = [
  { value: 'views', label: 'Vistas' },
  { value: 'cpm', label: 'CPM' },
  { value: 'engagement', label: 'Engagement' },
]

const SKELETON_IDS = ['s0', 's1', 's2', 's3', 's4'] as const

const PLATFORM_ICON: Record<DashboardTopVideoPlatform, LucideIcon> = {
  instagram: Instagram,
  tiktok: Music,
  youtube: Youtube,
}

export function TopVideosTable({
  data,
  isLoading,
  isError,
  currentSort,
  onSortChange,
  onRetry,
  onClear,
}: TopVideosTableProps) {
  if (isError) {
    return (
      <TableShell currentSort={currentSort} onSortChange={onSortChange}>
        <ErrorBlockState onRetry={onRetry} />
      </TableShell>
    )
  }

  if (isLoading || !data) {
    return (
      <TableShell currentSort={currentSort} onSortChange={onSortChange}>
        <VideosTableBody currentSort={currentSort} isLoading />
      </TableShell>
    )
  }

  if (data.videos.length === 0) {
    return (
      <TableShell currentSort={currentSort} onSortChange={onSortChange}>
        <EmptyBlockState onClear={onClear} />
      </TableShell>
    )
  }

  return (
    <TableShell currentSort={currentSort} onSortChange={onSortChange}>
      <VideosTableBody currentSort={currentSort} videos={data.videos} />
    </TableShell>
  )
}

function TableShell({
  currentSort,
  onSortChange,
  children,
}: Pick<TopVideosTableProps, 'currentSort' | 'onSortChange'> & {
  children: ReactNode
}) {
  return (
    <section
      data-testid="top-videos"
      className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-[0_12px_28px_-18px_rgba(0,0,0,0.35)]"
    >
      <div className="flex h-[62px] items-center justify-between gap-4 border-b border-border px-5">
        <div>
          <h2 className="text-[15px] font-semibold leading-none text-foreground">
            Top videos
          </h2>
          <p className="mt-1 text-[11px] text-muted-foreground">Top 5</p>
        </div>
        <Select
          value={currentSort}
          onValueChange={(value) =>
            onSortChange(value as TopVideosTableProps['currentSort'])
          }
        >
          <SelectTrigger
            aria-label="Ordenar top videos"
            className="h-8 rounded-full bg-background px-3 text-xs font-semibold"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {children}
      <div className="flex h-[52px] items-center justify-end border-t border-border px-5">
        <span
          aria-disabled="true"
          className="text-sm font-semibold text-muted-foreground opacity-55"
        >
          Ver todos
        </span>
      </div>
    </section>
  )
}

function VideosTableBody({
  currentSort,
  videos,
  isLoading = false,
}: {
  currentSort: TopVideosTableProps['currentSort']
  videos?: DashboardTopVideosResponse['videos']
  isLoading?: boolean
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] table-fixed border-collapse">
        <caption className="sr-only">Top videos</caption>
        <thead>
          <tr className="border-b border-border text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <th scope="col" className="w-[72px] px-5 py-3">
              <span className="sr-only">Thumbnail</span>
            </th>
            <th scope="col" className="w-[172px] px-3 py-3">
              Creator
            </th>
            <th scope="col" className="w-[96px] px-3 py-3">
              Plataforma
            </th>
            <MetricHeader
              active={currentSort === 'views'}
              className="w-[100px]"
            >
              Vistas
            </MetricHeader>
            <MetricHeader active={currentSort === 'cpm'} className="w-[88px]">
              CPM
            </MetricHeader>
            <MetricHeader
              active={currentSort === 'engagement'}
              className="w-[118px]"
            >
              Engagement
            </MetricHeader>
            <th scope="col" className="w-[132px] px-3 py-3">
              Publicación
            </th>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? SKELETON_IDS.map((id) => <VideoSkeletonRow key={id} />)
            : videos?.map((video) => (
                <tr
                  key={video.video_link_id}
                  data-testid="top-video-row"
                  className="border-b border-border last:border-b-0"
                >
                  <td className="px-5 py-3">
                    <Thumbnail
                      src={video.thumbnail_url}
                      platform={video.platform}
                    />
                  </td>
                  <td className="min-w-0 px-3 py-3">
                    <CreatorCell
                      handle={video.creator.handle}
                      avatarUrl={video.creator.avatar_url}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <PlatformCell platform={video.platform} />
                  </td>
                  <MetricCell active={currentSort === 'views'}>
                    {NUMBER_FMT.format(video.metrics.views)}
                  </MetricCell>
                  <MetricCell active={currentSort === 'cpm'}>
                    {formatNumber(video.metrics.cpm)}
                  </MetricCell>
                  <MetricCell active={currentSort === 'engagement'}>
                    {PERCENT_FMT.format(video.metrics.engagement_rate)}
                  </MetricCell>
                  <td className="px-3 py-3 font-mono text-xs text-muted-foreground">
                    {formatPublishedAt(video.published_at)}
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  )
}

function MetricHeader({
  active,
  className,
  children,
}: {
  active: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <th
      scope="col"
      aria-sort={active ? 'descending' : undefined}
      className={cn(
        'px-3 py-3 text-right',
        active && 'text-foreground',
        className,
      )}
    >
      {children}
    </th>
  )
}

function MetricCell({
  active,
  children,
}: {
  active: boolean
  children: ReactNode
}) {
  return (
    <td
      className={cn(
        'px-3 py-3 text-right font-mono text-xs text-muted-foreground',
        active &&
          'rounded-sm bg-[#3ECF8E]/10 font-semibold text-foreground dark:bg-[#3ECF8E]/15',
      )}
    >
      {children}
    </td>
  )
}

function Thumbnail({
  src,
  platform,
}: {
  src: string | null
  platform: DashboardTopVideoPlatform
}) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="size-11 rounded-xl object-cover"
        loading="lazy"
      />
    )
  }

  const Icon = PLATFORM_ICON[platform]
  return (
    <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
      <Icon className="size-4" aria-hidden="true" />
    </div>
  )
}

function CreatorCell({
  handle,
  avatarUrl,
}: {
  handle: string
  avatarUrl: string | null
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar size="sm">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
        <AvatarFallback>{getInitials(handle)}</AvatarFallback>
      </Avatar>
      <span className="truncate text-sm font-medium text-foreground">
        {handle}
      </span>
    </div>
  )
}

function PlatformCell({ platform }: { platform: DashboardTopVideoPlatform }) {
  const Icon = PLATFORM_ICON[platform]
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
      <Icon className="size-3.5" aria-hidden="true" />
      <span>{getPlatformLabel(platform)}</span>
    </div>
  )
}

function VideoSkeletonRow() {
  return (
    <tr
      data-testid="top-video-skeleton"
      className="border-b border-border last:border-b-0"
    >
      <td className="px-5 py-3">
        <div className="size-11 animate-pulse rounded-xl bg-muted" />
      </td>
      <td className="px-3 py-3">
        <div className="h-5 w-28 animate-pulse rounded-full bg-muted" />
      </td>
      <td className="px-3 py-3">
        <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
      </td>
      <td className="px-3 py-3">
        <div className="ml-auto h-4 w-14 animate-pulse rounded-full bg-muted" />
      </td>
      <td className="px-3 py-3">
        <div className="ml-auto h-4 w-12 animate-pulse rounded-full bg-muted" />
      </td>
      <td className="px-3 py-3">
        <div className="ml-auto h-4 w-16 animate-pulse rounded-full bg-muted" />
      </td>
      <td className="px-3 py-3">
        <div className="h-4 w-24 animate-pulse rounded-full bg-muted" />
      </td>
    </tr>
  )
}

function getPlatformLabel(platform: DashboardTopVideoPlatform): string {
  if (platform === 'instagram') return 'Instagram'
  if (platform === 'tiktok') return 'TikTok'
  return 'YouTube'
}

function formatNumber(value: number | null): string {
  return value === null ? '-' : NUMBER_FMT.format(value)
}

function formatPublishedAt(value: string): string {
  // API ISO date parsing is deterministic here; this does not read current time
  // and does not affect hydration.
  return DATE_FMT.format(new Date(value)).replace('.', '')
}

function getInitials(value: string): string {
  return value.replace(/^@/, '').slice(0, 2).toUpperCase() || 'CR'
}
