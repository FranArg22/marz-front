import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { getMeQueryKey } from '#/shared/api/generated/accounts/accounts'
import type { meResponse } from '#/shared/api/generated/accounts/accounts'
import type { ServerMeBody } from '#/shared/auth/getServerMe'
import { setBrandWorkspaceIdProvider } from '#/shared/api/mutator'

import { useBrandWorkspaceStore } from '../stores/brandWorkspaceStore'

// Wires the active brand workspace id into the API mutator. Source of truth is
// `me.brand_workspace.id` from `/v1/me`; we mirror it into a persisted Zustand
// store so SPA navigations don't need to re-resolve it. Backend ignores the
// header for creator accounts but requires it for brand (422
// brand_workspace_required when missing).
export function useBrandWorkspaceProvider() {
  const queryClient = useQueryClient()

  useEffect(() => {
    setBrandWorkspaceIdProvider(
      () => useBrandWorkspaceStore.getState().activeBrandWorkspaceId,
    )

    function syncFromCache() {
      const cached = queryClient.getQueryData<meResponse>(getMeQueryKey())
      if (!cached || cached.status !== 200) return
      const me = cached.data as unknown as ServerMeBody
      const id = me.brand_workspace?.id ?? null
      const current = useBrandWorkspaceStore.getState().activeBrandWorkspaceId
      if (id !== current) {
        useBrandWorkspaceStore.getState().setActiveBrandWorkspaceId(id)
      }
    }

    syncFromCache()
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.query.queryKey[0] === getMeQueryKey()[0]) {
        syncFromCache()
      }
    })

    return unsubscribe
  }, [queryClient])
}
