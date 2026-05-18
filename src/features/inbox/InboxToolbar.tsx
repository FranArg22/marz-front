import { t } from '@lingui/core/macro'
import { useIsFetching, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Loader2, MailMinus, RefreshCw } from 'lucide-react'

import { Button } from '#/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip'

import { inboxQueryKey } from './api/inbox'
import type { InboxResponse } from './api/inbox'
import {
  trackInboxFilterChanged,
  trackInboxMarkedReadBulk,
  trackInboxRefreshed,
} from './analytics'
import { useMarkInboxVisibleReadMutation } from './hooks/useMarkInboxVisibleReadMutation'

const ALL_CAMPAIGNS = '__all__'

interface InboxToolbarProps {
  accountKind: InboxResponse['account_kind']
  campaignId?: string
  campaignFilterOptions: InboxResponse['campaign_filter_options']
  counts: InboxResponse['counts']
}

export function InboxToolbar({
  accountKind,
  campaignId,
  campaignFilterOptions,
  counts,
}: InboxToolbarProps) {
  const navigate = useNavigate({ from: '/inbox' })
  const queryClient = useQueryClient()
  const markVisibleRead = useMarkInboxVisibleReadMutation()
  const hasPendingItems = counts.action_items + counts.waiting_items > 0
  const isRefreshing = useIsFetching({ queryKey: inboxQueryKey }) > 0

  function handleCampaignChange(nextValue: string) {
    const nextCampaignId = nextValue === ALL_CAMPAIGNS ? undefined : nextValue
    trackInboxFilterChanged({
      account_kind: accountKind,
      campaign_id: nextCampaignId ?? null,
      has_campaign_filter: nextCampaignId !== undefined,
    })

    void navigate({
      to: '/inbox',
      search: {
        campaign_id: nextCampaignId,
      },
      replace: true,
    })
  }

  function handleRefresh() {
    trackInboxRefreshed({
      account_kind: accountKind,
      campaign_id: campaignId ?? null,
    })
    void queryClient.invalidateQueries({ queryKey: inboxQueryKey })
  }

  function handleMarkAllRead() {
    markVisibleRead.mutate(
      {
        campaign_id: campaignId,
        sections: undefined,
      },
      {
        onSuccess: () => {
          trackInboxMarkedReadBulk({
            account_kind: accountKind,
            campaign_id: campaignId ?? null,
          })
        },
      },
    )
  }

  const showCampaignFilter = campaignFilterOptions.length > 0

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {showCampaignFilter ? (
        <Select
          value={campaignId ?? ALL_CAMPAIGNS}
          onValueChange={handleCampaignChange}
        >
          <SelectTrigger
            aria-label={t`Filtrar por campaña`}
            className="h-8 w-full sm:w-[220px]"
            size="sm"
          >
            <SelectValue placeholder={t`All campaigns`} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CAMPAIGNS}>{t`All campaigns`}</SelectItem>
            {campaignFilterOptions.map((campaign) => (
              <SelectItem
                key={campaign.campaign_id}
                value={campaign.campaign_id}
              >
                {campaign.campaign_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div />
      )}

      <TooltipProvider delayDuration={200}>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
                aria-label={t`Refresh inbox`}
              >
                {isRefreshing ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <RefreshCw className="size-4" aria-hidden />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t`Refresh inbox`}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleMarkAllRead}
                disabled={!hasPendingItems || markVisibleRead.isPending}
                aria-label={t`Mark all as read`}
              >
                {markVisibleRead.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <MailMinus className="size-4" aria-hidden />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t`Mark all as read`}</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  )
}
