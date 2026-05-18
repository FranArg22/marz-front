import { useNavigate } from '@tanstack/react-router'
import { t } from '@lingui/core/macro'
import { Megaphone } from 'lucide-react'
import { toast } from 'sonner'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { useActiveCampaigns } from '#/shared/api/activeCampaigns'

import { trackConversationCampaignFilterChanged } from './analytics'

const ALL_CAMPAIGNS = '__all__'

interface CampaignFilterSelectProps {
  value?: string
}

export function CampaignFilterSelect({ value }: CampaignFilterSelectProps) {
  const navigate = useNavigate({ from: '/workspace' })
  const { data: campaigns = [], isLoading } = useActiveCampaigns()

  function handleChange(next: string) {
    const campaignId = next === ALL_CAMPAIGNS ? undefined : next
    trackConversationCampaignFilterChanged({
      has_campaign: campaignId !== undefined,
    })
    void navigate({
      to: '.',
      unsafeRelative: 'path',
      search: (prev) => ({ ...prev, campaign_id: campaignId }),
      replace: true,
    }).catch((error: unknown) => {
      if (
        error &&
        typeof error === 'object' &&
        'status' in error &&
        (error as { status?: number }).status === 409
      ) {
        toast.error(t`La campaña ya no está disponible`)
        void navigate({
          to: '.',
          search: (prev) => ({ ...prev, campaign_id: undefined }),
          replace: true,
        })
      }
    })
  }

  if (isLoading || campaigns.length === 0) return null

  return (
    <Select value={value ?? ALL_CAMPAIGNS} onValueChange={handleChange}>
      <SelectTrigger
        aria-label={t`Filtrar por campaña`}
        className="h-10 w-full cursor-pointer rounded-full border-none bg-muted px-4 text-sm"
      >
        <Megaphone className="size-4 shrink-0 text-muted-foreground" />
        <SelectValue placeholder={t`Todas las campañas`} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_CAMPAIGNS}>{t`Todas las campañas`}</SelectItem>
        {campaigns.map((campaign) => (
          <SelectItem key={campaign.id} value={campaign.id}>
            {campaign.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
