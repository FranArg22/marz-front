import { useQueryClient } from '@tanstack/react-query'

import { getMeQueryKey } from '#/shared/api/generated/accounts/accounts'
import type { meResponse } from '#/shared/api/generated/accounts/accounts'
import type { ServerMeBody } from '#/shared/auth/getServerMe'

import type { AppShellAccountKind } from './AppShellContext'

function getInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  if (initials.length > 0) return initials
  const first = name.trim()[0]
  return first ? first.toUpperCase() : '?'
}

// Derives the label shown in the shell sidebar logo slot:
// - brand → brand_workspace.name (acronym)
// - creator → full_name (initials)
// Reads from the `me` query cache populated by route loaders.
export function useShellIdentityLabel(
  accountKind: AppShellAccountKind,
): string {
  const queryClient = useQueryClient()
  const cached = queryClient.getQueryData<meResponse>(getMeQueryKey())
  if (!cached || cached.status !== 200) return '?'
  const me = cached.data as unknown as ServerMeBody

  const source =
    accountKind === 'brand' ? me.brand_workspace?.name : me.full_name

  return source ? getInitials(source) : '?'
}
