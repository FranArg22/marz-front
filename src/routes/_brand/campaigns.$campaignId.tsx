import { Outlet, createFileRoute, useMatches } from '@tanstack/react-router'
import { z } from 'zod'

import { CampaignDetailPage } from '#/features/campaigns/detail/CampaignDetailPage'
import { campaignDetailQueryOptions } from '#/features/campaigns/detail/useCampaignDetailQuery'
import {
  DeliverableStatus,
  ListCreatorsStatus,
  SocialPlatform,
} from '#/shared/api/generated/model'

const campaignDetailTabSchema = z
  .enum(['overview', 'applications', 'creators', 'videos', 'analytics'])
  .default('overview')
  .catch('overview')

const campaignDetailStatusSchema = z
  .union([z.enum(ListCreatorsStatus), z.enum(DeliverableStatus)])
  .optional()
  .catch(undefined)

const campaignParticipantsPlatformSchema = z
  .enum(SocialPlatform)
  .optional()
  .catch(undefined)

export const campaignDetailSearchSchema = z.object({
  tab: campaignDetailTabSchema,
  q: z.string().optional().catch(undefined),
  status: campaignDetailStatusSchema,
  platform: campaignParticipantsPlatformSchema,
  creator_account_id: z.string().optional().catch(undefined),
  sort: z.string().optional().catch(undefined),
})

/* eslint-disable lingui/no-unlocalized-strings -- Router child route IDs are not translatable UI copy. */
const CHILD_ROUTE_IDS = new Set([
  '/_brand/campaigns/$campaignId/brief',
  '/_brand/campaigns/$campaignId/configuration',
  '/_brand/campaigns/$campaignId/configuration/$step',
])
/* eslint-enable lingui/no-unlocalized-strings */

export const Route = createFileRoute('/_brand/campaigns/$campaignId')({
  validateSearch: (search) => campaignDetailSearchSchema.parse(search),
  loader: ({ context, params }) => {
    return context.queryClient
      .prefetchQuery(campaignDetailQueryOptions(params.campaignId))
      .catch(() => undefined)
  },
  component: CampaignDetailRoute,
})

function CampaignDetailRoute() {
  const matches = useMatches()
  const lastMatch = matches.at(-1)
  const { campaignId } = Route.useParams()
  const search = Route.useSearch()

  if (lastMatch && CHILD_ROUTE_IDS.has(lastMatch.routeId)) {
    return <Outlet />
  }

  return <CampaignDetailPage campaignId={campaignId} search={search} />
}
