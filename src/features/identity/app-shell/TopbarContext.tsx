import { createContext, use, useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export type TopbarBreadcrumbSegment = { icon?: LucideIcon; label: string }

export type TopbarConfig = { breadcrumb: TopbarBreadcrumbSegment[] }

type TopbarContextValue = {
  config: TopbarConfig | null
  setTopbar: (config: TopbarConfig) => void
  resetTopbar: () => void
}

const TopbarContext = createContext<TopbarContextValue | null>(null)

export function TopbarProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<TopbarConfig | null>(null)

  const setTopbar = useCallback((nextConfig: TopbarConfig) => {
    setConfig(nextConfig)
  }, [])

  const resetTopbar = useCallback(() => {
    setConfig(null)
  }, [])

  const value = useMemo(
    () => ({
      config,
      resetTopbar,
      setTopbar,
    }),
    [config, resetTopbar, setTopbar],
  )

  return <TopbarContext value={value}>{children}</TopbarContext>
}

export function useTopbar() {
  const context = use(TopbarContext)

  if (!context) {
    throw new Error('useTopbar must be used within a TopbarProvider')
  }

  return context
}
