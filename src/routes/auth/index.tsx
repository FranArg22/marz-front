import { createFileRoute, redirect } from '@tanstack/react-router'
import { Trans } from '@lingui/react/macro'

import { MagicLinkRequestForm } from '#/features/identity/auth/components/MagicLinkRequestForm'
import { useAuthGuard } from '#/features/identity/auth/hooks/useAuthGuard'
import { getMeQueryKey } from '#/shared/api/generated/accounts/accounts'
import type { meResponse } from '#/shared/api/generated/accounts/accounts'
import { getServerBrandWorkspaceLandingTarget } from '#/shared/auth/getServerBrandWorkspaceLandingTarget'
import { getServerMe } from '#/shared/auth/getServerMe'
import type { ServerMeBody } from '#/shared/auth/getServerMe'

const STALE_TIME = 30_000
type RouteMe = meResponse['data'] | ServerMeBody

export const Route = createFileRoute('/auth/')({
  // Resolve the session in beforeLoad so an authenticated user is redirected
  // before the login form renders (no auth flash). Also intercepts the
  // transient /auth bounce on the post-checkout return — a redirect thrown
  // here never renders this route. Mirrors the / and /onboarding guards.
  beforeLoad: async ({ context }) => {
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

    if (!me) return

    if (me.onboarding_status === 'onboarded') {
      if (me.kind === 'brand') {
        let landingTarget: 'dashboard' | 'create_campaign' = 'dashboard'
        try {
          landingTarget = await getServerBrandWorkspaceLandingTarget()
        } catch {
          // Default to dashboard if the landing-target server function fails.
        }
        throw redirect({
          to:
            landingTarget === 'create_campaign' ? '/campaigns/new' : '/inicio',
        })
      }
      throw redirect({ to: '/inbox' })
    }
    if (me.redirect_to) {
      throw redirect({ to: me.redirect_to })
    }
  },
  component: AuthPage,
})

function AuthPage() {
  const { showLoading } = useAuthGuard()

  if (showLoading) return null

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 flex items-start justify-center">
        <div
          className="h-[500px] w-[600px] -translate-y-3/4 rounded-full opacity-60"
          style={{
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--primary) 20%, transparent), transparent)',
          }}
        />
      </div>

      <div className="relative flex min-h-screen items-center justify-center p-6">
        <div className="flex w-full max-w-[440px] flex-col items-center gap-7 rounded-2xl border border-border bg-card p-10">
          <div className="flex items-center gap-2.5">
            <MarzLogo />
            {/* eslint-disable-next-line lingui/no-unlocalized-strings -- Product brand name is not translated. */}
            <span className="text-2xl font-bold tracking-tight text-foreground">
              Marz
            </span>
          </div>

          <div className="flex w-full flex-col items-center gap-2">
            <h1 className="text-center text-3xl font-semibold tracking-tight text-foreground">
              <Trans>Entrá a Marz</Trans>
            </h1>
            <p className="text-center text-sm leading-relaxed text-muted-foreground">
              <Trans>Campañas con creadores, sin agencias ni vueltas.</Trans>
            </p>
          </div>

          <MagicLinkRequestForm />

          <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
            <Trans>
              Al continuar aceptás los Términos y la Política de privacidad.
            </Trans>
          </p>
        </div>
      </div>
    </main>
  )
}

function MarzLogo() {
  return (
    <div className="flex size-10 items-center justify-center rounded-[10px] bg-foreground">
      <svg width={24} height={24} viewBox="0 0 40 40" fill="none">
        <circle cx={8} cy={10} r={2.5} fill="var(--background)" />
        <circle cx={17.5} cy={10} r={2.5} fill="var(--background)" />
        <circle cx={27} cy={10} r={2.5} fill="var(--background)" />
        <rect x={9.5} y={15} width={2} height={10} fill="var(--background)" />
        <rect x={19} y={15} width={2} height={10} fill="var(--background)" />
        <rect x={28.5} y={15} width={2} height={10} fill="var(--background)" />
        <circle cx={8} cy={25} r={2.5} fill="var(--background)" />
        <circle cx={17.5} cy={25} r={2.5} fill="var(--background)" />
        <circle cx={27} cy={25} r={2.5} fill="var(--background)" />
      </svg>
    </div>
  )
}
