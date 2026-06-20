import { useAuth } from '@clerk/tanstack-react-start'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'

import { track } from '#/shared/analytics/track'
import { useBrandOnboardingStore } from '#/features/identity/onboarding/brand/store'
import { useCreatorOnboardingStore } from '#/features/identity/onboarding/creator/store'

export function useSignOut() {
  const { signOut } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useCallback(async () => {
    track('sign_out')
    queryClient.clear()
    useBrandOnboardingStore.getState().reset()
    useCreatorOnboardingStore.getState().reset()
    await signOut()
    navigate({ to: '/auth' })
  }, [signOut, queryClient, navigate])
}
