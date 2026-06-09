import { t } from '@lingui/core/macro'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Compass, SlidersHorizontal } from 'lucide-react'
import { useEffect, useState } from 'react'
import { z } from 'zod'

import { Button } from '#/components/ui/button'
import { CreatorCard } from '#/features/discovery/network/components/CreatorCard'
import { DiscoveryFilterChips } from '#/features/discovery/network/components/DiscoveryFilterChips'
import { DiscoveryFilterPanel } from '#/features/discovery/network/components/DiscoveryFilterPanel'
import { DiscoveryGrid } from '#/features/discovery/network/components/DiscoveryGrid'
import { useDiscoveryFiltersStore } from '#/features/discovery/network/store/discoveryFiltersStore'
import { useRouteTopbar } from '#/features/identity/app-shell/useRouteTopbar'
import type { DiscoveryCreatorCard } from '#/shared/api/generated/model'
import {
  GetDiscoveryCreatorsAgeBucketsItem,
  GetDiscoveryCreatorsCreatorType,
  GetDiscoveryCreatorsGender,
  GetDiscoveryCreatorsSort,
  SocialPlatform,
} from '#/shared/api/generated/model'

const discoverySearchSchema = z.object({
  platforms: z.array(z.enum(SocialPlatform)).optional().catch(undefined),
  creator_type: z
    .enum(GetDiscoveryCreatorsCreatorType)
    .optional()
    .catch(undefined),
  countries: z.array(z.string()).optional().catch(undefined),
  gender: z.enum(GetDiscoveryCreatorsGender).optional().catch(undefined),
  age_buckets: z
    .array(z.enum(GetDiscoveryCreatorsAgeBucketsItem))
    .optional()
    .catch(undefined),
  interests: z.array(z.string()).optional().catch(undefined),
  content_types: z.array(z.string()).optional().catch(undefined),
  followers_min: z.number().int().optional().catch(undefined),
  followers_max: z.number().int().optional().catch(undefined),
  engagement_rate_min: z.number().optional().catch(undefined),
  avg_views_min: z.number().int().optional().catch(undefined),
  avg_views_max: z.number().int().optional().catch(undefined),
  cpm_min: z.string().optional().catch(undefined),
  cpm_max: z.string().optional().catch(undefined),
  price_min: z.string().optional().catch(undefined),
  price_max: z.string().optional().catch(undefined),
  sort: z.enum(GetDiscoveryCreatorsSort).optional().catch(undefined),
})

export type DiscoverySearch = z.infer<typeof discoverySearchSchema>

export const Route = createFileRoute('/_brand/discovery')({
  validateSearch: (search) => discoverySearchSchema.parse(search),
  component: DiscoveryRoute,
})

function DiscoveryRoute() {
  useRouteTopbar({ breadcrumb: [{ icon: Compass, label: t`Discovery` }] })
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/discovery' })
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const [selectedCard, setSelectedCard] = useState<DiscoveryCreatorCard | null>(
    null,
  )
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const { appliedFilters, activeSort } = useDiscoveryFiltersStore()

  void selectedCard
  void inviteModalOpen

  useEffect(() => {
    const { sort, ...filters } = search
    useDiscoveryFiltersStore.setState({
      appliedFilters: filters,
      pendingFilters: filters,
      activeSort: sort ?? 'recommended',
    })
  }, [])

  useEffect(() => {
    void navigate({
      search: () => ({ ...appliedFilters, sort: activeSort }),
      replace: true,
    })
  }, [appliedFilters, activeSort, navigate])

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden p-6">
      <div>
        <p className="font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
          {t`Discovery`}
        </p>
        <h2 className="mt-1 text-lg font-semibold text-foreground">
          {t`Explorá la red de creators`}
        </h2>
      </div>
      <div>
        <Button type="button" onClick={() => setFilterPanelOpen(true)}>
          <SlidersHorizontal className="size-4" aria-hidden />
          {t`Filtros`}
        </Button>
      </div>
      <DiscoveryFilterChips
        onOpenFilterPanel={() => setFilterPanelOpen(true)}
      />
      <DiscoveryGrid
        params={{ ...appliedFilters, sort: activeSort }}
        renderCard={(card) => (
          <CreatorCard
            card={card}
            onInvite={(card) => {
              setSelectedCard(card)
              setInviteModalOpen(true)
            }}
          />
        )}
      />
      <DiscoveryFilterPanel
        open={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
      />
    </div>
  )
}
