import { LogOut } from 'lucide-react'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'

import { cn } from '#/lib/utils'
import { useSignOut } from '#/features/identity/hooks/useSignOut'

export function SignOutButton({ collapsed = false }: { collapsed?: boolean }) {
  const handleSignOut = useSignOut()

  return (
    <button
      type="button"
      onClick={handleSignOut}
      aria-label={collapsed ? t`Sign out` : undefined}
      className={cn(
        'rounded-md text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
        collapsed
          ? 'flex size-11 items-center justify-center'
          : 'w-full px-3 py-2 text-left',
      )}
    >
      {collapsed ? (
        <LogOut className="size-5" aria-hidden="true" />
      ) : (
        <Trans>Sign out</Trans>
      )}
    </button>
  )
}
