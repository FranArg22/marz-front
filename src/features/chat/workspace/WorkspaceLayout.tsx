import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { t } from '@lingui/core/macro'

import { trackWorkspaceOpened } from './analytics'
import { useWorkspaceRailSubscription } from './useWorkspaceRailSubscription'

interface WorkspaceLayoutProps {
  rail?: ReactNode
  children: ReactNode
  sessionKind?: 'brand' | 'creator'
}

export function WorkspaceLayout({
  rail,
  children,
  sessionKind,
}: WorkspaceLayoutProps) {
  // WS disabled until backend exposes workspace_rail topic — enable when marz-api#ws-rail lands
  useWorkspaceRailSubscription({ enabled: false })

  useEffect(() => {
    if (!sessionKind) return
    trackWorkspaceOpened({ session_kind: sessionKind })
  }, [sessionKind])

  return (
    <div className="flex h-full">
      <aside
        role="region"
        aria-label={t`Conversaciones`}
        className="w-80 shrink-0 border-r border-border bg-background"
      >
        {rail}
      </aside>
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  )
}
