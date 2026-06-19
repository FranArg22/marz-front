import { Link } from '@tanstack/react-router'
import { ArrowRight, Check } from 'lucide-react'

import { cn } from '#/lib/utils'
import type { OnboardingChecklistResponse } from '#/shared/api/generated/model/onboardingChecklistResponse'

interface OnboardingChecklistProps {
  data: OnboardingChecklistResponse | undefined
  isLoading: boolean
  isError: boolean
}

const SKELETON_IDS = ['sk-0', 'sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5']

export function OnboardingChecklist({
  data,
  isLoading,
  isError,
}: OnboardingChecklistProps) {
  if (isError) {
    return <div data-testid="checklist-error" />
  }

  if (data?.completed === true) {
    return null
  }

  if (isLoading || !data) {
    return <OnboardingChecklistSkeleton />
  }

  const total = data.progress.total
  const progressPercent =
    total > 0 ? Math.min((data.progress.done / total) * 100, 100) : 0

  return (
    <section
      data-testid="checklist"
      className="flex min-h-[222px] flex-col gap-1 rounded-3xl border border-border bg-card px-4 py-3 text-card-foreground shadow-[0_12px_28px_-18px_rgba(0,0,0,0.35)]"
    >
      <header className="flex h-6 items-center justify-between gap-3">
        <h2 className="text-[13px] font-semibold leading-none text-foreground">
          Primeros pasos
        </h2>
        <p className="font-mono text-[11px] font-bold leading-none text-[#0DA678]">
          {data.progress.done}/{total}
        </p>
      </header>

      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={data.progress.done}
        aria-label="Progreso de primeros pasos"
      >
        <div
          data-testid="checklist-progress-bar"
          className="h-full rounded-full bg-[#0DA678]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <ul className="flex flex-col gap-1">
        {data.items?.map((item) => (
          <li
            key={item.key}
            className="flex h-[22px] items-center gap-2 text-[11px] font-medium leading-none"
          >
            <span
              data-testid={
                item.done ? 'checklist-check-done' : 'checklist-check-pending'
              }
              className={cn(
                'flex size-4 shrink-0 items-center justify-center rounded-full border',
                item.done
                  ? 'border-[#0DA678] bg-[#0DA678]'
                  : 'border-border bg-muted',
              )}
              aria-hidden="true"
            >
              {item.done ? (
                <Check className="size-3 text-card dark:text-background" />
              ) : null}
            </span>

            <span
              className={cn(
                'min-w-0 flex-1 truncate',
                item.done ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {item.label}
            </span>

            <Link
              to={item.cta_route}
              aria-label={item.cta_label}
              className="flex size-[22px] shrink-0 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span className="sr-only">{item.cta_label}</span>
              <ArrowRight className="size-3" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function OnboardingChecklistSkeleton() {
  return (
    <section
      data-testid="checklist-skeleton"
      className="flex min-h-[222px] animate-pulse flex-col gap-1 rounded-3xl border border-border bg-card px-4 py-3 shadow-[0_12px_28px_-18px_rgba(0,0,0,0.35)]"
    >
      <div className="flex h-6 items-center justify-between gap-3">
        <div className="h-3 w-24 rounded-full bg-muted" />
        <div className="h-3 w-7 rounded-full bg-muted" />
      </div>
      <div className="h-2 rounded-full bg-muted" />
      <div className="flex flex-col gap-1">
        {SKELETON_IDS.map((id) => (
          <div key={id} className="flex h-[22px] items-center gap-2">
            <div className="size-4 rounded-full bg-muted" />
            <div className="h-3 flex-1 rounded-full bg-muted" />
            <div className="size-[22px] rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </section>
  )
}
