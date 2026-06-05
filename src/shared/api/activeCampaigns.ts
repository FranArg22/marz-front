import {
  getListCampaignsQueryKey,
  useListCampaigns,
} from '#/shared/api/generated/campaigns/campaigns'
import { CampaignStatus } from '#/shared/api/generated/model'

export interface ActiveCampaign {
  id: string
  name: string
  status: 'active'
  budget_currency: string
  budget_remaining: string
}

export function getActiveCampaignsQueryKey() {
  return getListCampaignsQueryKey({
    status: CampaignStatus.active,
  })
}

export function useActiveCampaigns(options?: { enabled?: boolean }) {
  return useListCampaigns(
    { status: CampaignStatus.active },
    {
      query: {
        enabled: options?.enabled ?? true,
        select: (response): ActiveCampaign[] => {
          if (response.status !== 200) return []
          return response.data.data.map((item) => ({
            id: item.campaign_id,
            name: item.name,
            status: 'active' as const,
            budget_currency: 'USD',
            budget_remaining: '',
          }))
        },
      },
    },
  )
}
