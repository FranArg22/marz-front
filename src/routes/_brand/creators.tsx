import { t } from '@lingui/core/macro'
import { Users } from 'lucide-react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback, useMemo, useState } from 'react'
import { z } from 'zod'

import { CampaignCreatorsTable } from '#/features/campaigns/detail/CampaignCreatorsTable'
import {
  CreatorsFilters,
  hasActiveFilters,
} from '#/features/campaigns/detail/creators/CreatorsFilters'
import type { CreatorsFilterParams } from '#/features/campaigns/detail/creators/CreatorsFilters'
import type { CampaignParticipantsParams } from '#/features/campaigns/detail/creators/useCampaignParticipantsQuery'
import { useRouteTopbar } from '#/features/identity/app-shell/useRouteTopbar'
import {
  ListCreatorsStatus,
  SocialPlatform,
} from '#/shared/api/generated/model'

const PAGE_LIMIT = 24

export const creatorsSearchSchema = z.object({
  q: z.string().optional().catch(undefined),
  status: z.enum(ListCreatorsStatus).optional().catch(undefined),
  platform: z.enum(SocialPlatform).optional().catch(undefined),
})

export const Route = createFileRoute('/_brand/creators')({
  validateSearch: (search) => creatorsSearchSchema.parse(search),
  component: BrandCreatorsRoute,
})

function BrandCreatorsRoute() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/creators' })
  const [cursor, setCursor] = useState<string | undefined>(undefined)

  useRouteTopbar({ breadcrumb: [{ icon: Users, label: t`Creators` }] })

  const filters = useMemo<CreatorsFilterParams>(
    () => ({
      search: search.q,
      status: search.status,
      platform: search.platform,
    }),
    [search.q, search.status, search.platform],
  )

  const tableParams = useMemo(
    () => ({
      ...filters,
      cursor,
      limit: PAGE_LIMIT,
    }),
    [cursor, filters],
  )

  const updateFilters = useCallback(
    (next: CreatorsFilterParams) => {
      setCursor(undefined)
      void navigate({
        search: () => ({
          q: next.search,
          status: next.status,
          platform: next.platform,
        }),
      })
    },
    [navigate],
  )

  const updateTableParams = useCallback(
    (next: CampaignParticipantsParams) => {
      setCursor(next.cursor)
      const filtersChanged =
        next.search !== filters.search ||
        next.status !== filters.status ||
        next.platform !== filters.platform
      if (!filtersChanged) return
      updateFilters({
        search: next.search,
        status: next.status,
        platform: next.platform,
      })
    },
    [filters.platform, filters.search, filters.status, updateFilters],
  )

  const clearFilters = useCallback(() => updateFilters({}), [updateFilters])
  const goToCampaigns = useCallback(() => {
    void navigate({ to: '/campaigns' })
  }, [navigate])

  const activeFilters = hasActiveFilters(filters)

  return (
    <section className="h-full overflow-y-auto bg-background p-6 [&>*+*]:mt-5">
      <div>
        <p className="font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
          {t`Creators`}
        </p>
        <h2 className="mt-1 text-lg font-semibold text-foreground">
          {t`All creators across your campaigns`}
        </h2>
      </div>

      <CreatorsFilters params={filters} onParamsChange={updateFilters} />

      <CampaignCreatorsTable
        scope={{ type: 'global', brandWorkspaceId: '' }}
        params={tableParams}
        onParamsChange={updateTableParams}
        hasActiveFilters={activeFilters}
        onClearFilters={clearFilters}
        onFindCreators={goToCampaigns}
      />
    </section>
  )
}
