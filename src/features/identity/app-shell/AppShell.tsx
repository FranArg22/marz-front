import type { ReactNode } from 'react'

import { AppBottomNav } from './AppBottomNav'
import { AppSidebar } from './AppSidebar'
import { AppShellContextProvider } from './AppShellContext'
import type { AppShellAccountKind } from './AppShellContext'
import { TopbarProvider } from './TopbarContext'

interface AppShellProps {
  accountKind: AppShellAccountKind
  accountId: string
  pathname: string
  children: ReactNode
}

export function AppShell({
  accountKind,
  accountId,
  pathname,
  children,
}: AppShellProps) {
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
          />
          <div className="flex min-w-0 flex-1 flex-col py-2 pr-2 pl-2 md:pl-0">
            <main className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-border bg-background pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0">
              {children}
            </main>
          </div>
          <AppBottomNav accountKind={accountKind} pathname={pathname} />
        </div>
      </TopbarProvider>
    </AppShellContextProvider>
  )
}
