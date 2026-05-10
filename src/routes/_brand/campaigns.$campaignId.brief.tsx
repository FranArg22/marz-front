import { Megaphone } from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'
import { CampaignBriefPage } from '#/features/campaigns/components/CampaignBriefPage'
import { useRouteTopbar } from '#/features/identity/app-shell/useRouteTopbar'

export const Route = createFileRoute('/_brand/campaigns/$campaignId/brief')({
  component: CampaignBriefRoute,
})

const campaignBriefTopbarConfig = {
  breadcrumb: [
    { icon: Megaphone, label: 'Campañas' },
    { label: 'Resumen del brief' },
  ],
}

function CampaignBriefRoute() {
  useRouteTopbar(campaignBriefTopbarConfig)

  const { campaignId } = Route.useParams()
  return <CampaignBriefPage campaignId={campaignId} />
}
