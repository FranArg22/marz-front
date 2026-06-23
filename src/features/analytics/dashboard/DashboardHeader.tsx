import { t } from '@lingui/core/macro'
import { useEffect, useState } from 'react'

interface DashboardHeaderProps {
  /** Epoch ms of the freshest dashboard query, or undefined while loading. */
  updatedAt?: number
}

export function DashboardHeader({ updatedAt }: DashboardHeaderProps) {
  return (
    <header className="flex items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t`Dashboard`}</h1>
        <p className="mt-1 hidden text-sm text-muted-foreground md:block">
          {t`Monitoreá campañas, inversión y performance de creadores en un solo lugar.`}
        </p>
      </div>
      <UpdatedTimestamp updatedAt={updatedAt} />
    </header>
  )
}

function UpdatedTimestamp({ updatedAt }: { updatedAt?: number }) {
  const [label, setLabel] = useState<string | null>(null)

  useEffect(() => {
    if (!updatedAt) {
      setLabel(null)
      return
    }
    const compute = () => setLabel(formatRelative(Date.now() - updatedAt))
    compute()
    const timer = window.setInterval(compute, 30_000)
    return () => window.clearInterval(timer)
  }, [updatedAt])

  if (!label) return null

  return (
    <span className="shrink-0 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
      Actualizado {label}
    </span>
  )
}

function formatRelative(elapsedMs: number): string {
  const minutes = Math.floor(elapsedMs / 60_000)
  if (minutes < 1) return 'recién'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  return `hace ${hours} h`
}
