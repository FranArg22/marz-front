import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import { CampaignConfigurationStepSchema } from '#/features/campaigns/configuration/hooks'
import type { CampaignConfigurationStep } from '#/features/campaigns/configuration/hooks'
import customFetch from '#/shared/api/mutator'

const CampaignStatusSchema = z.enum(['draft', 'active', 'paused', 'completed'])

const RawCampaignListItemSchema = z
  .object({
    id: z.string().optional(),
    campaign_id: z.string().optional(),
    name: z.string(),
    status: CampaignStatusSchema,
    deadline: z.string().nullable().optional(),
    start_date: z.string().nullable().optional(),
    platforms: z.array(z.string()).optional(),
    creators_count: z.number().int().min(0).optional(),
    budget_currency: z.string().optional(),
    budget_total_usd: z.union([z.string(), z.number()]).nullable().optional(),
    budget_remaining: z.union([z.string(), z.number()]).nullable().optional(),
    videos_done: z.number().int().min(0).optional(),
    videos_total: z.number().int().min(0).optional(),
    configuration_complete: z.boolean().nullable().optional(),
    configuration_current_step:
      CampaignConfigurationStepSchema.nullable().optional(),
  })
  .passthrough()
  .transform((campaign, context) => {
    const id = campaign.id ?? campaign.campaign_id

    if (!id) {
      context.addIssue({
        code: 'custom',
        message: 'Campaign list item requires id or campaign_id',
        path: ['id'],
      })
      return z.NEVER
    }

    return {
      id,
      name: campaign.name,
      status: campaign.status,
      startDate: campaign.deadline ?? campaign.start_date ?? null,
      platforms: campaign.platforms ?? [],
      creators: campaign.creators_count ?? 0,
      budget: formatBudget(
        campaign.budget_total_usd ?? campaign.budget_remaining ?? null,
        campaign.budget_currency,
      ),
      videos: {
        done: campaign.videos_done ?? 0,
        total: campaign.videos_total ?? 0,
      },
      configurationComplete: campaign.configuration_complete ?? null,
      configurationCurrentStep: campaign.configuration_current_step ?? null,
    }
  })

const CampaignsListResponseSchema = z.object({
  data: z.array(RawCampaignListItemSchema),
})

export type CampaignListItem = {
  id: string
  name: string
  status: z.infer<typeof CampaignStatusSchema>
  startDate: string | null
  platforms: string[]
  creators: number
  budget: string
  videos: {
    done: number
    total: number
  }
  configurationComplete: boolean | null
  configurationCurrentStep: CampaignConfigurationStep | null
}

const DEFAULT_BRAND_WORKSPACE_ID = 'default'

export function getCampaignsListQueryKey(
  brandWorkspaceId = DEFAULT_BRAND_WORKSPACE_ID,
) {
  return ['/v1/campaigns', { brand_workspace_id: brandWorkspaceId }] as const
}

// RAFITA:BLOCKER: Orval hook `useListCampaigns` not yet generated for GET /v1/campaigns.
// Keep this feature-scoped query aligned with the backend contract, then replace it after `pnpm api:sync`.
export function useCampaignsList() {
  const brandWorkspaceId = DEFAULT_BRAND_WORKSPACE_ID

  return useQuery<CampaignListItem[]>({
    queryKey: getCampaignsListQueryKey(brandWorkspaceId),
    queryFn: async ({ signal }) => {
      const response = await customFetch<unknown>(
        `/v1/campaigns?brand_workspace_id=${encodeURIComponent(brandWorkspaceId)}`,
        { signal },
      )
      return CampaignsListResponseSchema.parse(response).data
    },
  })
}

function formatBudget(
  amount: string | number | null,
  currency = 'USD',
): string {
  if (amount === null) return '-'
  if (typeof amount === 'string' && amount.trim().startsWith('$')) {
    return amount
  }

  const numericAmount =
    typeof amount === 'number' ? amount : Number.parseFloat(amount)

  if (!Number.isFinite(numericAmount)) return String(amount)

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(numericAmount)
}
