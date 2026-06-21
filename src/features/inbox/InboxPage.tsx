import { t } from '@lingui/core/macro'
import { useEffect } from 'react'

import { Button } from '#/components/ui/button'

import type { InboxResponse } from './api/inbox'
import { trackInboxEmptyViewed, trackInboxViewed } from './analytics'
import {
  getCounterpartKey,
  groupInboxItemsByCounterpart,
} from './groupInboxItemsByCounterpart'
import { useInboxQuery } from './hooks/useInboxQuery'
import { InboxEmptyState } from './InboxEmptyState'
import { InboxSection } from './InboxSection'
import { InboxToolbar } from './InboxToolbar'

const skeletonSections = [0, 1] as const
const skeletonRows = [0, 1, 2] as const

interface InboxPageProps {
  campaignId?: string
}

export function InboxPage({ campaignId }: InboxPageProps) {
  const inboxQuery = useInboxQuery({ campaignId })

  if (inboxQuery.isLoading) {
    return <InboxPageSkeleton />
  }

  if (inboxQuery.isError) {
    return <InboxErrorState onRetry={() => void inboxQuery.refetch()} />
  }

  const data = inboxQuery.data

  if (!data) {
    return <InboxErrorState onRetry={() => void inboxQuery.refetch()} />
  }

  return <InboxPageContent data={data} campaignId={campaignId} />
}

function InboxPageContent({
  data,
  campaignId,
}: {
  data: InboxResponse
  campaignId?: string
}) {
  const actionBoxes = groupInboxItemsByCounterpart(data.action_items)
  const waitingBoxes = groupInboxItemsByCounterpart(data.waiting_items)
  const waitingCounterpartIds = new Set(
    data.waiting_items.map(getCounterpartKey),
  )
  const crossContextCounterpartIds = new Set(
    data.action_items
      .map(getCounterpartKey)
      .filter((key) => waitingCounterpartIds.has(key)),
  )
  const isEmpty =
    data.counts.action_items === 0 && data.counts.waiting_items === 0
  const copy = getInboxCopy(data.account_kind)

  useEffect(() => {
    const payload = {
      account_kind: data.account_kind,
      campaign_id: data.campaign_id,
    }

    trackInboxViewed({
      ...payload,
      action_count: data.counts.action_items,
      waiting_count: data.counts.waiting_items,
    })

    if (isEmpty) {
      trackInboxEmptyViewed(payload)
    }
  }, [
    data.account_kind,
    data.campaign_id,
    data.counts.action_items,
    data.counts.waiting_items,
    data.generated_at,
    isEmpty,
  ])

  return (
    <main className="flex h-full overflow-y-auto px-5 py-8 sm:px-8">
      <div className="mx-auto flex w-full max-w-[880px] flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-foreground">{t`Inbox`}</h1>
          <p className="text-sm text-muted-foreground">{copy.description}</p>
        </header>
        <InboxToolbar
          campaignId={campaignId}
          campaignFilterOptions={data.campaign_filter_options}
          counts={data.counts}
          accountKind={data.account_kind}
        />

        {isEmpty ? (
          <InboxEmptyState emptyState={data.empty_state} />
        ) : (
          <div className="flex flex-col gap-6">
            {data.counts.action_items > 0 ? (
              <InboxSection
                title={t`Pendientes`}
                description={t`Más recientes`}
                count={data.counts.action_items}
                boxes={actionBoxes}
                crossContextCounterpartIds={crossContextCounterpartIds}
                tone="action"
                accountKind={data.account_kind}
              />
            ) : null}
            {data.counts.waiting_items > 0 ? (
              <InboxSection
                title={copy.waitingTitle}
                description={copy.waitingDescription}
                count={data.counts.waiting_items}
                boxes={waitingBoxes}
                tone="waiting"
                accountKind={data.account_kind}
              />
            ) : null}
          </div>
        )}
      </div>
    </main>
  )
}

function InboxPageSkeleton() {
  return (
    <main className="flex h-full overflow-y-auto px-5 py-8 sm:px-8">
      <div
        className="mx-auto flex w-full max-w-[880px] flex-col gap-6"
        role="status"
        aria-label={t`Cargando inbox`}
      >
        <div className="flex flex-col gap-2">
          <div className="h-8 w-24 animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-full max-w-md animate-pulse rounded-full bg-muted" />
        </div>
        {skeletonSections.map((sectionIndex) => (
          <section key={sectionIndex} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="h-5 w-28 animate-pulse rounded-full bg-muted" />
              <div className="h-5 w-8 animate-pulse rounded-full bg-muted" />
            </div>
            {skeletonRows.map((rowIndex) => (
              <div
                key={rowIndex}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
              >
                <div className="h-11 w-1 animate-pulse rounded-full bg-muted" />
                <div className="size-10 animate-pulse rounded-full bg-muted" />
                <div className="flex flex-1 flex-col gap-2">
                  <div className="h-3 w-48 animate-pulse rounded-full bg-muted" />
                  <div className="h-4 w-72 animate-pulse rounded-full bg-muted" />
                  <div className="h-3 w-64 animate-pulse rounded-full bg-muted" />
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>
    </main>
  )
}

function InboxErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="flex h-full items-center justify-center px-5 py-8">
      <div className="flex max-w-sm flex-col items-center gap-3 rounded-3xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-semibold text-foreground">
          {t`No se pudo cargar el inbox`}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t`Reintentá para traer tus items pendientes.`}
        </p>
        <Button type="button" onClick={onRetry} className="rounded-full">
          {t`Reintentar`}
        </Button>
      </div>
    </main>
  )
}

function getInboxCopy(accountKind: InboxResponse['account_kind']) {
  if (accountKind === 'creator') {
    return {
      description: t`Lo que necesita tu atención y lo que está esperando del lado de las marcas.`,
      waitingTitle: t`Waiting on brands`,
      waitingDescription: t`You sent these · awaiting reply`,
    }
  }

  return {
    description: t`Lo que necesita tu atención y lo que está esperando del otro lado.`,
    waitingTitle: t`Waiting on others`,
    waitingDescription: t`You sent these · they're with the other side`,
  }
}
