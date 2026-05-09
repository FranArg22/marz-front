import {
  Outlet,
  createFileRoute,
  redirect,
  useRouterState,
} from '@tanstack/react-router'

import { AppShell } from '#/features/identity/app-shell/AppShell'
import { getMeQueryKey } from '#/shared/api/generated/accounts/accounts'
import type { meResponse } from '#/shared/api/generated/accounts/accounts'
import { getServerMe } from '#/shared/auth/getServerMe'
import type { ServerMeBody } from '#/shared/auth/getServerMe'
import { BrandSessionProvider } from '../features/identity/session/BrandSessionContext'

const STALE_TIME = 30_000

export const Route = createFileRoute('/_brand')({
  beforeLoad: async ({ context }) => {
    const { queryClient } = context

    const cached = queryClient.getQueryData<meResponse>(getMeQueryKey())
    const cachedMe = cached && cached.status === 200 ? cached.data : undefined
    const cacheAge =
      queryClient.getQueryState(getMeQueryKey())?.dataUpdatedAt ?? 0
    const isFresh = cachedMe && Date.now() - cacheAge < STALE_TIME

    let me: ServerMeBody | null = null

    if (isFresh) {
      me = cachedMe as unknown as ServerMeBody
    } else {
      const result = await getServerMe()
      if (result.ok) {
        me = result.body
        queryClient.setQueryData(
          getMeQueryKey(),
          { data: me, status: 200 } as unknown as meResponse,
          { updatedAt: Date.now() },
        )
      }
    }

    if (!me) {
      throw redirect({ to: '/auth' })
    }

    if (me.onboarding_status !== 'onboarded') {
      const destination = me.redirect_to ?? '/onboarding/brand'
      throw redirect({ to: destination })
    }

    if (me.kind !== 'brand') {
      const home = me.kind === 'creator' ? '/offers' : '/auth'
      throw redirect({ to: home })
    }

    return {
      accountId: me.id,
    }
  },
  component: BrandLayout,
})

function BrandLayout() {
  const { accountId } = Route.useRouteContext()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <AppShell accountKind="brand" accountId={accountId} pathname={pathname}>
      <BrandSessionProvider>
        <Outlet />
      </BrandSessionProvider>
    </AppShell>
  )
}
