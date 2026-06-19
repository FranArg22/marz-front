import { t } from '@lingui/core/macro'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Compass, Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'

import { CreatorCard } from '#/features/discovery/network/components/CreatorCard'
import { DiscoveryFilterChips } from '#/features/discovery/network/components/DiscoveryFilterChips'
import { DiscoveryFilterPanel } from '#/features/discovery/network/components/DiscoveryFilterPanel'
import { DiscoveryGrid } from '#/features/discovery/network/components/DiscoveryGrid'
import { DiscoveryUpsell } from '#/features/discovery/network/components/DiscoveryUpsell'
import { InviteBulkModal } from '#/features/discovery/network/components/InviteBulkModal'
import { InviteSingleModal } from '#/features/discovery/network/components/InviteSingleModal'
import { useDiscoveryFiltersStore } from '#/features/discovery/network/store/discoveryFiltersStore'
import { useRouteTopbar } from '#/features/identity/app-shell/useRouteTopbar'
import { useMe } from '#/shared/api/generated/accounts/accounts'
import type { DiscoveryCreatorCard } from '#/shared/api/generated/model'
import {
  GetDiscoveryCreatorsAgeBucketsItem,
  GetDiscoveryCreatorsCreatorType,
  GetDiscoveryCreatorsGender,
  GetDiscoveryCreatorsSort,
  SocialPlatform,
} from '#/shared/api/generated/model'

// TanStack parsea un único valor en la URL como escalar (`?countries=AR` →
// `'AR'`, no `['AR']`) y los números como `number`. Normalizamos a array y a
// string para que compartir/recargar una URL filtrada re-hidrate todos los
// filtros en vez de descartarlos en el `.catch(undefined)`.
const arrayParam = <T extends z.ZodTypeAny>(inner: T) =>
  z
    .preprocess(
      (v) => (v == null ? undefined : Array.isArray(v) ? v : [v]),
      z.array(inner).optional(),
    )
    .catch(undefined)

const stringParam = z
  .preprocess((v) => (v == null ? undefined : String(v)), z.string().optional())
  .catch(undefined)

const discoverySearchSchema = z.object({
  platforms: arrayParam(z.enum(SocialPlatform)),
  creator_type: z
    .enum(GetDiscoveryCreatorsCreatorType)
    .optional()
    .catch(undefined),
  countries: arrayParam(z.string()),
  gender: z.enum(GetDiscoveryCreatorsGender).optional().catch(undefined),
  age_buckets: arrayParam(z.enum(GetDiscoveryCreatorsAgeBucketsItem)),
  interests: arrayParam(z.string()),
  content_types: arrayParam(z.string()),
  followers_min: z.coerce.number().int().optional().catch(undefined),
  followers_max: z.coerce.number().int().optional().catch(undefined),
  engagement_rate_min: z.coerce.number().optional().catch(undefined),
  avg_views_min: z.coerce.number().int().optional().catch(undefined),
  avg_views_max: z.coerce.number().int().optional().catch(undefined),
  cpm_min: stringParam,
  cpm_max: stringParam,
  price_min: stringParam,
  price_max: stringParam,
  sort: z.enum(GetDiscoveryCreatorsSort).optional().catch(undefined),
})

export type DiscoverySearch = z.infer<typeof discoverySearchSchema>

export const Route = createFileRoute('/_brand/discovery')({
  validateSearch: (search) => discoverySearchSchema.parse(search),
  component: DiscoveryRoute,
})

function DiscoveryRoute() {
  const meQuery = useMe()
  useRouteTopbar({ breadcrumb: [{ icon: Compass, label: t`Explorar` }] })
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/discovery' })
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const [selectedCard, setSelectedCard] = useState<DiscoveryCreatorCard | null>(
    null,
  )
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const {
    appliedFilters,
    activeSort,
    selectedAccountIds,
    selectionMode,
    toggleSelect,
  } = useDiscoveryFiltersStore()
  const appliedParams = { ...appliedFilters, sort: activeSort }
  const selectedAccountIdList = Array.from(selectedAccountIds)

  const hydrated = useRef(false)

  // URL -> store: source of truth on mount and on browser back/forward
  // (search params change). Reacting to `search` keeps the store in sync
  // with navigation that bypasses the store (e.g. shared filtered links).
  useEffect(() => {
    const { sort, ...filters } = search
    useDiscoveryFiltersStore.setState({
      appliedFilters: filters,
      pendingFilters: filters,
      activeSort: sort && sort !== 'recommended' ? sort : 'er_desc',
    })
    hydrated.current = true
  }, [search])

  // store -> URL: mirror applied filters back into the URL, but never before
  // the initial hydration ran, or we would clobber a shared filtered URL with
  // the empty closure defaults.
  useEffect(() => {
    if (!hydrated.current) return
    void navigate({
      search: () => ({ ...appliedFilters, sort: activeSort }),
      replace: true,
    })
  }, [appliedFilters, activeSort, navigate])

  // El layout/SSR siembra un me liviano (getServerMe) que NO trae
  // plan_capabilities; al venir de brand_workspace?. queda posiblemente
  // undefined. Solo gateamos a upsell cuando plan_capabilities está PRESENTE y
  // allows_discovery es false; si está ausente (me liviano, todavía no se sabe)
  // asumimos permitido para no flashear el upsell en la carga inicial ni al
  // navegar/filtrar (cuando la URL se actualiza y re-siembra el me liviano).
  const planCapabilities =
    meQuery.data?.status === 200
      ? meQuery.data.data.brand_workspace?.plan_capabilities
      : undefined
  const allowsDiscovery = planCapabilities
    ? planCapabilities.allows_discovery
    : true

  if (meQuery.isPending) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-6 animate-spin" aria-hidden />
      </div>
    )
  }

  if (!allowsDiscovery) {
    return <DiscoveryUpsell />
  }

  return (
    <div className="flex h-full flex-col gap-6 overflow-hidden p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t`Explorar`}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t`Descubrí creadores UGC e influencers para invitar a tus campañas.`}
        </p>
      </div>
      <DiscoveryFilterChips
        onOpenFilterPanel={() => setFilterPanelOpen(true)}
      />
      <DiscoveryGrid
        params={appliedParams}
        onBulkInvite={() => setBulkModalOpen(true)}
        renderCard={(card) => (
          <CreatorCard
            card={card}
            onInvite={(c) => {
              setSelectedCard(c)
              setInviteModalOpen(true)
            }}
            selected={selectedAccountIds.has(card.account_id)}
            selectionMode={selectionMode}
            onToggleSelect={toggleSelect}
          />
        )}
      />
      <InviteBulkModal
        open={bulkModalOpen}
        onOpenChange={setBulkModalOpen}
        accountIds={selectedAccountIdList}
      />
      <InviteSingleModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        card={selectedCard}
        appliedParams={appliedParams}
      />
      <DiscoveryFilterPanel
        open={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
      />
    </div>
  )
}
