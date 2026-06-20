import { t } from '@lingui/core/macro'
import { useNavigate } from '@tanstack/react-router'
import { useCallback, useMemo, useState } from 'react'

import { CampaignCreatorsTable } from '../CampaignCreatorsTable'
import { CreatorsFilters, hasActiveFilters } from './CreatorsFilters'
import type { CreatorsFilterParams } from './CreatorsFilters'
import type { CampaignParticipantsParams } from './useCampaignParticipantsQuery'

interface CreatorsTabProps {
  campaignId: string
  search: CreatorsFilterParams
}

const PAGE_LIMIT = 24

export function CreatorsTab({ campaignId, search }: CreatorsTabProps) {
  const navigate = useNavigate({ from: '/campaigns/$campaignId' })
  const [cursor, setCursor] = useState<string | undefined>(undefined)

  const filters = useMemo(
    () => ({
      search: search.search,
      status: search.status,
      platform: search.platform,
    }),
    [search.platform, search.search, search.status],
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
    (nextFilters: CreatorsFilterParams) => {
      setCursor(undefined)
      void navigate({
        search: (previous) => ({
          ...previous,
          tab: 'creators',
          q: nextFilters.search,
          status: nextFilters.status,
          platform: nextFilters.platform,
        }),
      })
    },
    [navigate],
  )

  const updateTableParams = useCallback(
    (nextParams: CampaignParticipantsParams) => {
      setCursor(nextParams.cursor)
      const filtersChanged =
        nextParams.search !== filters.search ||
        nextParams.status !== filters.status ||
        nextParams.platform !== filters.platform

      if (!filtersChanged) return

      updateFilters({
        search: nextParams.search,
        status: nextParams.status,
        platform: nextParams.platform,
      })
    },
    [filters.platform, filters.search, filters.status, updateFilters],
  )

  const clearFilters = useCallback(() => updateFilters({}), [updateFilters])
  const findCreators = useCallback(() => {
    void navigate({
      search: (previous) => ({
        ...previous,
        tab: 'applications',
        q: undefined,
        status: undefined,
        platform: undefined,
      }),
    })
  }, [navigate])

  const activeFilters = hasActiveFilters(filters)

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
            {t`Creadores`}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">
            {t`Creadores activos en esta campaña`}
          </h2>
        </div>
      </div>

      <CreatorsFilters params={filters} onParamsChange={updateFilters} />

      <CampaignCreatorsTable
        scope={{
          type: 'campaign',
          campaignId,
        }}
        params={tableParams}
        onParamsChange={updateTableParams}
        hasActiveFilters={activeFilters}
        onClearFilters={clearFilters}
        onFindCreators={findCreators}
      />
    </section>
  )
}
