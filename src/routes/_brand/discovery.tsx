import { t } from '@lingui/core/macro'
import { Compass } from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { useRouteTopbar } from '#/features/identity/app-shell/useRouteTopbar'
import {
  GetDiscoveryCreatorsAgeBucketsItem,
  GetDiscoveryCreatorsGender,
  GetDiscoveryCreatorsSort,
  SocialPlatform,
} from '#/shared/api/generated/model'

const discoverySearchSchema = z.object({
  platforms: z.array(z.enum(SocialPlatform)).optional().catch(undefined),
  countries: z.array(z.string()).optional().catch(undefined),
  gender: z.enum(GetDiscoveryCreatorsGender).optional().catch(undefined),
  age_buckets: z
    .array(z.enum(GetDiscoveryCreatorsAgeBucketsItem))
    .optional()
    .catch(undefined),
  interests: z.array(z.string()).optional().catch(undefined),
  content_types: z.array(z.string()).optional().catch(undefined),
  followers_min: z.number().int().optional().catch(undefined),
  followers_max: z.number().int().optional().catch(undefined),
  engagement_rate_min: z.number().optional().catch(undefined),
  avg_views_min: z.number().int().optional().catch(undefined),
  avg_views_max: z.number().int().optional().catch(undefined),
  cpm_min: z.string().optional().catch(undefined),
  cpm_max: z.string().optional().catch(undefined),
  price_min: z.string().optional().catch(undefined),
  price_max: z.string().optional().catch(undefined),
  sort: z.enum(GetDiscoveryCreatorsSort).optional().catch(undefined),
})

export type DiscoverySearch = z.infer<typeof discoverySearchSchema>

export const Route = createFileRoute('/_brand/discovery')({
  validateSearch: (search) => discoverySearchSchema.parse(search),
  component: DiscoveryRoute,
})

function DiscoveryRoute() {
  useRouteTopbar({ breadcrumb: [{ icon: Compass, label: t`Discovery` }] })

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden p-6">
      <div>
        <p className="font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
          {t`Discovery`}
        </p>
        <h2 className="mt-1 text-lg font-semibold text-foreground">
          {t`Explorá la red de creators`}
        </h2>
      </div>
      {/* Chips placeholder - implementado en task .5 */}
      {/* Grid placeholder - implementado en task .3 */}
      <div className="flex-1 rounded-2xl border border-dashed border-border bg-card" />
    </div>
  )
}
