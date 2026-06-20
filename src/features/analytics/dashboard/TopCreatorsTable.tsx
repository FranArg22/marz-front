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
import type { DashboardTopCreatorsResponse } from '#/shared/api/generated/model/dashboardTopCreatorsResponse'

import { EmptyBlockState } from './EmptyBlockState'
import { ErrorBlockState } from './ErrorBlockState'

interface TopCreatorsTableProps {
  data: DashboardTopCreatorsResponse | undefined
  isLoading: boolean
  isError: boolean
  currentSort: 'views' | 'videos' | 'cpm' | 'engagement'
  onSortChange: (sort: 'views' | 'videos' | 'cpm' | 'engagement') => void
  onRetry: () => void
  onClear: () => void
}

const NUMBER_FMT = new Intl.NumberFormat('es-AR')

const SORT_OPTIONS: Array<{
  value: TopCreatorsTableProps['currentSort']
  label: string
}> = [
  { value: 'views', label: 'Vistas' },
  { value: 'videos', label: 'Videos' },
  { value: 'cpm', label: 'CPM' },
  { value: 'engagement', label: 'Engagement' },
]

const SKELETON_IDS = ['s0', 's1', 's2', 's3', 's4'] as const

export function TopCreatorsTable({
  data,
  isLoading,
  isError,
  currentSort,
  onSortChange,
  onRetry,
  onClear,
}: TopCreatorsTableProps) {
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
        <CreatorsTableBody currentSort={currentSort} isLoading />
      </TableShell>
    )
  }

  if (data.creators.length === 0) {
    return (
      <TableShell currentSort={currentSort} onSortChange={onSortChange}>
        <EmptyBlockState onClear={onClear} />
      </TableShell>
    )
  }

  return (
    <TableShell currentSort={currentSort} onSortChange={onSortChange}>
      <CreatorsTableBody currentSort={currentSort} creators={data.creators} />
    </TableShell>
  )
}

function TableShell({
  currentSort,
  onSortChange,
  children,
}: Pick<TopCreatorsTableProps, 'currentSort' | 'onSortChange'> & {
  children: ReactNode
}) {
  return (
    <section
      data-testid="top-creators"
      className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-[0_12px_28px_-18px_rgba(0,0,0,0.35)]"
    >
      <div className="flex h-[62px] items-center justify-between gap-4 border-b border-border px-5 pt-2">
        <div>
          <h2 className="text-[15px] font-semibold leading-none text-foreground">
            Top Creadores
          </h2>
        </div>
        <Select
          value={currentSort}
          onValueChange={(value) =>
            onSortChange(value as TopCreatorsTableProps['currentSort'])
          }
        >
          <SelectTrigger
            aria-label="Ordenar top creators"
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

function CreatorsTableBody({
  currentSort,
  creators,
  isLoading = false,
}: {
  currentSort: TopCreatorsTableProps['currentSort']
  creators?: DashboardTopCreatorsResponse['creators']
  isLoading?: boolean
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] table-fixed border-collapse">
        <caption className="sr-only">Top Creadores</caption>
        <thead>
          <tr className="bg-muted/50 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <th scope="col" className="px-5 py-2">
              Creador
            </th>
            <MetricHeader
              active={currentSort === 'views'}
              className="w-[120px]"
            >
              Vistas totales
            </MetricHeader>
            <MetricHeader
              active={currentSort === 'videos'}
              className="w-[88px]"
            >
              Videos
            </MetricHeader>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? SKELETON_IDS.map((id) => <CreatorSkeletonRow key={id} />)
            : creators?.map((creator) => (
                <tr
                  key={creator.account_id}
                  data-testid="top-creator-row"
                  className="border-b border-border last:border-b-0"
                >
                  <td className="min-w-0 px-5 py-2">
                    <CreatorCell
                      handle={creator.handle}
                      avatarUrl={creator.avatar_url}
                    />
                  </td>
                  <MetricCell active={currentSort === 'views'}>
                    {NUMBER_FMT.format(creator.metrics.views)}
                  </MetricCell>
                  <MetricCell active={currentSort === 'videos'}>
                    {NUMBER_FMT.format(creator.metrics.videos)}
                  </MetricCell>
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
        'px-3 py-2 text-right',
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
        'px-3 py-2 text-right font-mono text-xs text-muted-foreground',
        active && 'font-semibold text-foreground',
      )}
    >
      {children}
    </td>
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

function CreatorSkeletonRow() {
  return (
    <tr
      data-testid="top-creator-skeleton"
      className="border-b border-border last:border-b-0"
    >
      <td className="px-5 py-2">
        <div className="h-5 w-28 animate-pulse rounded-full bg-muted" />
      </td>
      <td className="px-3 py-2">
        <div className="ml-auto h-4 w-14 animate-pulse rounded-full bg-muted" />
      </td>
      <td className="px-3 py-2">
        <div className="ml-auto h-4 w-10 animate-pulse rounded-full bg-muted" />
      </td>
    </tr>
  )
}

function getInitials(value: string): string {
  return value.replace(/^@/, '').slice(0, 2).toUpperCase() || 'CR'
}
