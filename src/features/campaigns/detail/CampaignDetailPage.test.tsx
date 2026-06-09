import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps, ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CampaignDetailPage } from './CampaignDetailPage'
import {
  trackCampaignDetailTabChanged,
  trackCampaignDetailViewed,
} from './tracking'

const mockNavigate = vi.fn()

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => <a href="/">{children}</a>,
  useNavigate: () => mockNavigate,
}))

vi.mock('./tracking', () => ({
  trackCampaignDetailTabChanged: vi.fn(),
  trackCampaignDetailViewed: vi.fn(),
}))

vi.mock('./useCampaignTopicSubscription', () => ({
  useCampaignTopicSubscription: vi.fn(),
}))

vi.mock('./useCampaignDetailQuery', () => ({
  useCampaignDetailQuery: () => ({
    isPending: false,
    error: null,
    data: {
      plan_capabilities: {
        allows_in_platform_invites: true,
      },
    },
  }),
}))

vi.mock('./CampaignDetailHeader', () => ({
  CampaignDetailHeader: () => <header>Campaign header</header>,
  CampaignDetailHeaderError: () => <header>Campaign header error</header>,
  CampaignDetailHeaderSkeleton: () => <header>Campaign header skeleton</header>,
}))

vi.mock('./CampaignDetailTabs', () => ({
  CampaignDetailTabs: ({
    activeTab,
    onTabChange,
  }: {
    activeTab: string
    onTabChange: (
      tab: 'overview' | 'applications' | 'creators' | 'videos',
    ) => void
  }) => (
    <nav aria-label="tabs">
      <span>{activeTab}</span>
      <button type="button" onClick={() => onTabChange('applications')}>
        Applications
      </button>
      <button type="button" onClick={() => onTabChange('videos')}>
        Videos
      </button>
    </nav>
  ),
}))

vi.mock('./OverviewTab', () => ({
  OverviewTab: () => <div>Overview tab</div>,
}))

vi.mock('#/features/discovery/campaign-detail/ApplicationsTab', () => ({
  ApplicationsTab: () => <div>Applications tab</div>,
}))

vi.mock('./creators/CreatorsTab', () => ({
  CreatorsTab: () => <div>Creators tab</div>,
}))

vi.mock('./videos/VideosTab', () => ({
  VideosTab: () => <div>Videos tab</div>,
}))

describe('CampaignDetailPage tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('tracks the page view once per campaign mount', () => {
    const { rerender } = renderCampaignDetailPage()

    rerender(
      <CampaignDetailPage
        campaignId="campaign-1"
        search={{ tab: 'overview' }}
      />,
    )

    expect(trackCampaignDetailViewed).toHaveBeenCalledTimes(1)
    expect(trackCampaignDetailViewed).toHaveBeenCalledWith('campaign-1')
  })

  it('tracks tab changes from the click trigger', async () => {
    const user = userEvent.setup()
    renderCampaignDetailPage()

    await user.click(screen.getByRole('button', { name: /videos/i }))

    expect(trackCampaignDetailTabChanged).toHaveBeenCalledTimes(1)
    expect(trackCampaignDetailTabChanged).toHaveBeenCalledWith({
      campaignId: 'campaign-1',
      from: 'overview',
      to: 'videos',
    })
  })
})

function renderCampaignDetailPage(
  search: ComponentProps<typeof CampaignDetailPage>['search'] = {
    tab: 'overview',
  },
) {
  return render(<CampaignDetailPage campaignId="campaign-1" search={search} />)
}
