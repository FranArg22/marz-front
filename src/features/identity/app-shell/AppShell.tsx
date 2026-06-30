import type { ReactNode } from 'react'

import { CreatorProfileSheetProvider } from '#/features/discovery/network/components/CreatorProfileSheetProvider'
import { useInboxActionBadge } from '#/features/inbox/hooks/useInboxActionBadge'

import { AppBottomNav } from './AppBottomNav'
import { AppSidebar } from './AppSidebar'
import { IntercomMobileTab } from './IntercomMobileTab'
import { AppShellContextProvider } from './AppShellContext'
import type { AppShellAccountKind } from './AppShellContext'
import { TopbarProvider } from './TopbarContext'

interface AppShellProps {
  accountKind: AppShellAccountKind
  accountId: string
  pathname: string
  /** En mobile oculta la bottom-nav para que el contenido ocupe toda la
   * pantalla (p. ej. una conversación abierta en workspace). */
  hideBottomNav?: boolean
  children: ReactNode
}

export function AppShell({
  accountKind,
  accountId,
  pathname,
  hideBottomNav = false,
  children,
}: AppShellProps) {
  const inboxHasBadge = useInboxActionBadge()

  return (
    <AppShellContextProvider accountKind={accountKind} accountId={accountId}>
      <TopbarProvider>
        <div
          data-testid="app-shell"
          className="fixed inset-0 flex h-dvh min-h-0 overflow-hidden bg-sidebar text-foreground"
        >
          <AppSidebar
            accountKind={accountKind}
            pathname={pathname}
            className="hidden md:flex"
            inboxHasBadge={inboxHasBadge}
          />
          <div className="flex min-w-0 flex-1 flex-col md:py-2 md:pr-2 md:pl-0">
            <main className="min-w-0 flex-1 overflow-hidden bg-background md:rounded-2xl md:border md:border-border">
              <CreatorProfileSheetProvider>
                {children}
              </CreatorProfileSheetProvider>
            </main>
          </div>
          {hideBottomNav ? null : (
            <>
              <AppBottomNav
                accountKind={accountKind}
                pathname={pathname}
                inboxHasBadge={inboxHasBadge}
              />
              <IntercomMobileTab />
            </>
          )}
        </div>
      </TopbarProvider>
    </AppShellContextProvider>
  )
}
