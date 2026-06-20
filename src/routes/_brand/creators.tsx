import { t } from '@lingui/core/macro'
import { Compass, Link2, Mail, Users } from 'lucide-react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '#/components/ui/button'
import { CampaignCreatorsTable } from '#/features/campaigns/detail/CampaignCreatorsTable'
import {
  CreatorsFilters,
  hasActiveFilters,
} from '#/features/campaigns/detail/creators/CreatorsFilters'
import type { CreatorsFilterParams } from '#/features/campaigns/detail/creators/CreatorsFilters'
import type { CampaignParticipantsParams } from '#/features/campaigns/detail/creators/useCampaignParticipantsQuery'
import { EmailInviteModal } from '#/features/discovery/network/components/EmailInviteModal'
import { useRouteTopbar } from '#/features/identity/app-shell/useRouteTopbar'
import { useMe } from '#/shared/api/generated/accounts/accounts'
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
  const meQuery = useMe()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/creators' })
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [emailInviteOpen, setEmailInviteOpen] = useState(false)

  useRouteTopbar({ breadcrumb: [{ icon: Users, label: t`Creadores` }] })

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
  const goToDiscovery = useCallback(() => {
    void navigate({ to: '/discovery' })
  }, [navigate])

  const activeFilters = hasActiveFilters(filters)
  // El backend omite plan_capabilities para brands sin plan pago (y el me
  // liviano del SSR tampoco lo trae), así que el acceso defensivo no es redundante.
  const brandWorkspace =
    meQuery.data?.status === 200 ? meQuery.data.data.brand_workspace : undefined
  const allowsEmailInvites = Boolean(
    // El contrato tipa plan_capabilities como requerido, pero el backend lo
    // omite para brands sin plan pago (y el me liviano del SSR tampoco lo trae),
    // así que el optional chain es necesario en runtime aunque el tipo no lo exija.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    brandWorkspace?.plan_capabilities?.allows_email_invites,
  )

  const copyInviteLink = useCallback(() => {
    if (!brandWorkspace) return
    const link = `${window.location.origin}/invite/ws_${brandWorkspace.id}`
    void navigator.clipboard
      .writeText(link)
      .then(() => toast(t`Link de invitación copiado`))
      .catch(() => toast(t`No pudimos copiar el link`))
  }, [brandWorkspace])

  return (
    <section className="h-full overflow-y-auto bg-background p-6 [&>*+*]:mt-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
            {t`Creadores`}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">
            {t`Todos los creadores en tus campañas`}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" asChild>
            <Link to="/discovery">
              <Compass className="size-4" aria-hidden />
              {t`Descubrir creadores`}
            </Link>
          </Button>
          {brandWorkspace ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyInviteLink}
            >
              <Link2 className="size-4" aria-hidden />
              {t`Invitar por link`}
            </Button>
          ) : null}
          {allowsEmailInvites ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEmailInviteOpen(true)}
              >
                <Mail className="size-4" aria-hidden />
                {t`Invitar por email`}
              </Button>
              <EmailInviteModal
                open={emailInviteOpen}
                onOpenChange={setEmailInviteOpen}
              />
            </>
          ) : null}
        </div>
      </div>

      <CreatorsFilters params={filters} onParamsChange={updateFilters} />

      <CampaignCreatorsTable
        scope={{ type: 'global' }}
        params={tableParams}
        onParamsChange={updateTableParams}
        hasActiveFilters={activeFilters}
        onClearFilters={clearFilters}
        onFindCreators={goToDiscovery}
      />
    </section>
  )
}
