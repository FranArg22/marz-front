import {
  createFileRoute,
  redirect,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import { useEffect } from 'react'
import { t } from '@lingui/core/macro'
import { toast } from 'sonner'

import { AppShell } from '#/features/identity/app-shell/AppShell'
import { usePendingInviteClaim } from '#/features/discovery/invite/usePendingInviteClaim'
import { inboxQueryKey } from '#/features/inbox/api/inbox'
import { InboxPage } from '#/features/inbox/InboxPage'
import { inboxSearchSchema } from '#/features/inbox/inboxSearchSchema'
import { track } from '#/shared/analytics/track'
import { getMeQueryKey } from '#/shared/api/generated/accounts/accounts'
import type { meResponse } from '#/shared/api/generated/accounts/accounts'
import { getServerMe } from '#/shared/auth/getServerMe'
import type { ServerMeBody } from '#/shared/auth/getServerMe'

const STALE_TIME = 30_000
type RouteMe = meResponse['data'] | ServerMeBody

export const Route = createFileRoute('/inbox')({
  validateSearch: (search) => inboxSearchSchema.parse(search),
  beforeLoad: async ({ context, location }) => {
    const { queryClient } = context

    const cached = queryClient.getQueryData<meResponse>(getMeQueryKey())
    const cachedMe = cached && cached.status === 200 ? cached.data : undefined
    const cacheAge =
      queryClient.getQueryState(getMeQueryKey())?.dataUpdatedAt ?? 0
    const isFresh = cachedMe && Date.now() - cacheAge < STALE_TIME

    let me: RouteMe | null = null

    if (isFresh) {
      me = cachedMe
    } else {
      const result = await getServerMe()
      if (result.ok) {
        me = result.body
        queryClient.setQueryData(
          getMeQueryKey(),
          { data: me, status: 200 },
          { updatedAt: Date.now() },
        )
      }
    }

    if (!me) {
      track('onboarding_redirect_enforced', {
        from: location.pathname,
        to: '/auth',
        reason: 'no_session',
      })
      throw redirect({ to: '/auth' })
    }

    if (me.kind !== 'brand' && me.kind !== 'creator') {
      throw redirect({ to: '/auth' })
    }

    if (me.onboarding_status !== 'onboarded') {
      const destination = me.redirect_to ?? '/auth'
      track('onboarding_redirect_enforced', {
        from: location.pathname,
        to: destination,
        reason: 'onboarding_incomplete',
      })
      throw redirect({ to: destination })
    }

    const sessionKind: 'brand' | 'creator' = me.kind

    return {
      accountId: me.id,
      sessionKind,
    }
  },
  loader: ({ context }) => {
    void context.queryClient.invalidateQueries({ queryKey: inboxQueryKey })
  },
  component: InboxRoute,
})

function InboxRoute() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/inbox' })
  const { accountId, sessionKind } = Route.useRouteContext()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  usePendingInviteClaim({ enabled: sessionKind === 'creator' })

  useEffect(() => {
    if (!search.send_offer_result) return

    if (search.send_offer_result === 'success') {
      toast.success(t`Offer enviada`)
    } else if (search.send_offer_result === 'cancelled') {
      toast(t`Volviste sin enviar la offer`)
    } else {
      toast.error(
        t`No pudimos procesar tu tarjeta. Probá de nuevo o gestioná tu tarjeta.`,
      )
    }

    void navigate({
      search: (prev) => {
        const { send_offer_result: _, ...rest } = prev
        return rest
      },
      replace: true,
    })
  }, [search.send_offer_result, navigate])

  return (
    <AppShell
      accountKind={sessionKind}
      accountId={accountId}
      pathname={pathname}
    >
      <InboxPage campaignId={search.campaign_id} />
    </AppShell>
  )
}
