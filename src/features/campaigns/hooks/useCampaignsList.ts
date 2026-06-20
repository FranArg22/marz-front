import { useListCampaigns } from '#/shared/api/generated/campaigns/campaigns'
import type { CampaignListItem as GeneratedCampaignListItem } from '#/shared/api/generated/model'

export type CampaignListItem = {
  id: string
  name: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  createdAt: string
  updatedAt: string
}

export function useCampaignsList() {
  return useListCampaigns(undefined, {
    query: {
      select: (response): CampaignListItem[] => {
        if (response.status !== 200) return []
        return response.data.data.map(mapCampaignListItem)
      },
    },
  })
}

function mapCampaignListItem(raw: GeneratedCampaignListItem): CampaignListItem {
  return {
    id: raw.campaign_id,
    name: raw.name,
    status: raw.status,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}
