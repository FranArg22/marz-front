import { useEffect, useMemo } from 'react'
import { Trans } from '@lingui/react/macro'
import { Users } from 'lucide-react'

import { track } from '#/shared/analytics/track'
import { useCreatorCountQuery } from './queries'
import type { SocialPlatform } from './store'
import { useDebouncedValue } from './hooks/useDebouncedValue'

const creatorCountFormatter = new Intl.NumberFormat('es-AR')

export interface MatchLiveBlockProps {
  platforms: SocialPlatform[]
  interests: string[]
  creator_country: string | null
  min_creator_tier_slug: string | null
}

export function MatchLiveBlock({
  platforms,
  interests,
  creator_country,
  min_creator_tier_slug,
}: MatchLiveBlockProps) {
  const filters = useMemo(
    () => ({
      platforms,
      interests,
      creator_country,
      min_creator_tier_slug,
    }),
    [creator_country, interests, min_creator_tier_slug, platforms],
  )
  const debouncedFilters = useDebouncedValue(filters, 300)
  const creatorCountQuery = useCreatorCountQuery(debouncedFilters)
  const countData =
    creatorCountQuery.data?.status === 200 ? creatorCountQuery.data.data : null
  const unavailable =
    creatorCountQuery.isPending ||
    !countData?.available ||
    countData.count === null
  const countLabel =
    !unavailable && typeof countData.count === 'number'
      ? creatorCountFormatter.format(countData.count)
      : '—'
  const availableCount =
    !unavailable && typeof countData.count === 'number' ? countData.count : null

  useEffect(() => {
    if (availableCount === null) return

    track('campaign_wizard_match_count_seen', {
      count: availableCount,
      filters: debouncedFilters,
    })
  }, [availableCount, debouncedFilters])

  return (
    <aside
      aria-label="Match en vivo"
      className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-md bg-muted text-foreground">
          <Users aria-hidden="true" />
        </span>
        <div className="flex flex-col">
          <h2 className="text-base font-semibold text-foreground">
            <Trans>Match en vivo</Trans>
          </h2>
          <p className="text-sm text-muted-foreground">
            <Trans>Creadores estimados para esta audiencia.</Trans>
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-4xl font-semibold tabular-nums text-foreground">
          {countLabel}
        </span>
        {unavailable ? (
          <span className="text-sm text-muted-foreground">
            <Trans>No disponible en este momento</Trans>
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">
            <Trans>Creadores disponibles</Trans>
          </span>
        )}
      </div>
    </aside>
  )
}
