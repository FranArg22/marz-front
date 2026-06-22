import { t } from '@lingui/core/macro'
import { Video } from 'lucide-react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback, useMemo, useState } from 'react'
import { z } from 'zod'

import { CampaignVideosGrid } from '#/features/campaigns/detail/CampaignVideosGrid'
import {
  VideosFilters,
  hasActiveVideoFilters,
} from '#/features/campaigns/detail/videos/VideosFilters'
import type { VideosFilterParams } from '#/features/campaigns/detail/videos/VideosFilters'
import type { CampaignVideosParams } from '#/features/campaigns/detail/videos/useCampaignVideosQuery'
import { useRouteTopbar } from '#/features/identity/app-shell/useRouteTopbar'
import { DeliverableStatus, SocialPlatform } from '#/shared/api/generated/model'

const PAGE_LIMIT = 24

export const videosSearchSchema = z.object({
  q: z.string().optional().catch(undefined),
  status: z.enum(DeliverableStatus).optional().catch(undefined),
  platform: z.enum(SocialPlatform).optional().catch(undefined),
  creator_account_id: z.string().optional().catch(undefined),
})

export const Route = createFileRoute('/_brand/videos')({
  validateSearch: (search) => videosSearchSchema.parse(search),
  component: BrandVideosRoute,
})

function BrandVideosRoute() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/videos' })
  const [cursor, setCursor] = useState<string | undefined>(undefined)

  useRouteTopbar({ breadcrumb: [{ icon: Video, label: t`Videos` }] })

  const filters = useMemo<VideosFilterParams>(
    () => ({
      search: search.q,
      status: search.status,
      platform: search.platform,
      creator_account_id: search.creator_account_id,
    }),
    [search.creator_account_id, search.platform, search.q, search.status],
  )

  const gridParams = useMemo(
    () => ({
      ...filters,
      cursor,
      limit: PAGE_LIMIT,
    }),
    [cursor, filters],
  )

  const updateFilters = useCallback(
    (next: VideosFilterParams) => {
      setCursor(undefined)
      void navigate({
        search: () => ({
          q: next.search,
          status: next.status,
          platform: next.platform,
          creator_account_id: next.creator_account_id,
        }),
      })
    },
    [navigate],
  )

  const updateGridParams = useCallback(
    (next: CampaignVideosParams) => {
      setCursor(next.cursor)
      const filtersChanged =
        next.search !== filters.search ||
        next.status !== filters.status ||
        next.platform !== filters.platform ||
        next.creator_account_id !== filters.creator_account_id
      if (!filtersChanged) return
      updateFilters({
        search: next.search,
        status: next.status,
        platform: next.platform,
        creator_account_id: next.creator_account_id,
      })
    },
    [
      filters.creator_account_id,
      filters.platform,
      filters.search,
      filters.status,
      updateFilters,
    ],
  )

  const clearFilters = useCallback(() => updateFilters({}), [updateFilters])
  const goToCampaigns = useCallback(() => {
    void navigate({ to: '/campaigns' })
  }, [navigate])

  const activeFilters = hasActiveVideoFilters(filters)

  return (
    <section className="h-full overflow-y-auto bg-background p-6 pb-mobile-nav [&>*+*]:mt-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t`Videos`}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t`Todos los videos entregados en tus campañas`}
        </p>
      </div>

      {/* Creator selector deshabilitado en scope global: no hay endpoint de creators del workspace todavía. */}
      <VideosFilters
        params={filters}
        creators={[]}
        onParamsChange={updateFilters}
      />

      <CampaignVideosGrid
        scope={{ type: 'global' }}
        params={gridParams}
        hasActiveFilters={activeFilters}
        hasActiveParticipants={false}
        onParamsChange={updateGridParams}
        onClearFilters={clearFilters}
        onInviteCreators={goToCampaigns}
      />
    </section>
  )
}
