import { useEffect, useRef, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/tanstack-react-start'

import { readPendingInviteToken } from '#/features/discovery/invite/pendingInvite'
import { KindSelector } from '#/features/identity/auth/components/KindSelector'
import {
  getMeQueryKey,
  useMe,
  useSelectKind,
} from '#/shared/api/generated/accounts/accounts'
import { ApiError } from '#/shared/api/mutator'
import { track } from '#/shared/analytics/track'

export const Route = createFileRoute('/auth/kind')({
  component: KindPage,
})

function KindPage() {
  const { isSignedIn, isLoaded } = useAuth()
  const navigate = useNavigate()
  const meQuery = useMe({
    query: { enabled: isLoaded && !!isSignedIn },
  })

  const me = meQuery.data
  const onboardingStatus =
    me?.status === 200 ? me.data.onboarding_status : undefined
  const redirectTo = me?.status === 200 ? me.data.redirect_to : undefined
  const kind = me?.status === 200 ? me.data.kind : undefined

  const queryClient = useQueryClient()
  const selectKind = useSelectKind()
  const autoStartedRef = useRef(false)
  const [autoSelectFailed, setAutoSelectFailed] = useState(false)
  const cameFromInvite =
    typeof window !== 'undefined' && !!readPendingInviteToken()

  // A creator arriving through a brand invite link already declared their role
  // implicitly, so skip the manual brand/creator step and pick "creator".
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    if (!me || me.status !== 200) return
    if (onboardingStatus !== 'kind_pending') return
    if (!cameFromInvite || autoStartedRef.current || autoSelectFailed) return

    autoStartedRef.current = true
    selectKind.mutate(
      { data: { kind: 'creator' } },
      {
        onSuccess: async (response) => {
          track('kind_selected', { kind: 'creator', source: 'invite_link' })
          await queryClient.refetchQueries({ queryKey: getMeQueryKey() })
          const destination =
            response.status === 200
              ? (response.data.redirect_to ?? '/onboarding/creator')
              : '/onboarding/creator'
          void navigate({ to: destination })
        },
        onError: async (err) => {
          if (err instanceof ApiError && err.status === 409) {
            await queryClient.refetchQueries({ queryKey: getMeQueryKey() })
            void navigate({ to: '/onboarding/creator' })
            return
          }
          // Fall back to the manual selector if the auto-pick fails.
          setAutoSelectFailed(true)
        },
      },
    )
  }, [
    isLoaded,
    isSignedIn,
    me,
    onboardingStatus,
    cameFromInvite,
    autoSelectFailed,
    queryClient,
    selectKind,
    navigate,
  ])

  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn) {
      void navigate({ to: '/auth' })
      return
    }

    if (!me || me.status !== 200) return

    if (onboardingStatus !== 'kind_pending') {
      const safeRedirect =
        redirectTo && redirectTo !== '/auth/kind' ? redirectTo : null

      const destination =
        onboardingStatus === 'onboarded'
          ? (safeRedirect ?? (kind === 'brand' ? '/campaigns' : '/inbox'))
          : (safeRedirect ?? '/auth')

      track('onboarding_redirect_enforced', {
        from: '/auth/kind',
        to: destination,
      })
      void navigate({ to: destination })
    }
  }, [isLoaded, isSignedIn, me, onboardingStatus, redirectTo, kind, navigate])

  if (!isLoaded || !isSignedIn || meQuery.isLoading) return null
  if (!me || me.status !== 200) return null
  if (onboardingStatus !== 'kind_pending') return null
  // Came from an invite link: auto-selecting "creator", skip the manual step.
  if (cameFromInvite && !autoSelectFailed) return null

  return (
    <main className="relative flex min-h-screen flex-col bg-background">
      <div className="flex h-16 items-center justify-between px-8">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-[7px] bg-foreground">
            <svg width={16} height={16} viewBox="0 0 40 40" fill="none">
              <circle cx={8} cy={10} r={2.5} fill="var(--background)" />
              <circle cx={17.5} cy={10} r={2.5} fill="var(--background)" />
              <circle cx={27} cy={10} r={2.5} fill="var(--background)" />
              <rect
                x={9.5}
                y={15}
                width={2}
                height={10}
                fill="var(--background)"
              />
              <rect
                x={19}
                y={15}
                width={2}
                height={10}
                fill="var(--background)"
              />
              <rect
                x={28.5}
                y={15}
                width={2}
                height={10}
                fill="var(--background)"
              />
              <circle cx={8} cy={25} r={2.5} fill="var(--background)" />
              <circle cx={17.5} cy={25} r={2.5} fill="var(--background)" />
              <circle cx={27} cy={25} r={2.5} fill="var(--background)" />
            </svg>
          </div>
          {/* eslint-disable-next-line lingui/no-unlocalized-strings -- Product brand name is not translated. */}
          <span className="text-base font-bold tracking-tight text-foreground">
            Marz
          </span>
        </div>
      </div>

      <div className="h-0.5 w-full bg-border">
        <div className="h-full w-[6%] bg-primary" />
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-20">
        <KindSelector />
      </div>
    </main>
  )
}
