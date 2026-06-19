import { t } from '@lingui/core/macro'
import { ClipboardList, LayoutGrid, Users, Video } from 'lucide-react'

import { CampaignWorkspaceTabs } from '#/features/campaigns/components/CampaignWorkspaceTabs'

function getCampaignDetailTabs() {
  return [
    { id: 'overview', label: t`Resumen`, icon: LayoutGrid },
    { id: 'applications', label: t`Postulaciones`, icon: ClipboardList },
    { id: 'creators', label: t`Creadores`, icon: Users },
    { id: 'videos', label: t`Videos`, icon: Video },
  ] as const
}

export type CampaignDetailTabId =
  | 'overview'
  | 'applications'
  | 'creators'
  | 'videos'

interface CampaignDetailTabsProps {
  activeTab: CampaignDetailTabId
  onTabChange: (tab: CampaignDetailTabId) => void
}

export function CampaignDetailTabs({
  activeTab,
  onTabChange,
}: CampaignDetailTabsProps) {
  return (
    <nav
      aria-label={t`Secciones de campaña`}
      className="overflow-x-auto bg-background px-5 md:px-8"
    >
      <CampaignWorkspaceTabs
        tabs={[...getCampaignDetailTabs()]}
        activeId={activeTab}
        onSelect={(tab) => {
          if (!isCampaignDetailTab(tab)) return
          onTabChange(tab)
        }}
      />
    </nav>
  )
}

function isCampaignDetailTab(tab: string): tab is CampaignDetailTabId {
  return (
    tab === 'overview' ||
    tab === 'applications' ||
    tab === 'creators' ||
    tab === 'videos'
  )
}
