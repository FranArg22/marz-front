import { t } from '@lingui/core/macro'
import { useRouter } from '@tanstack/react-router'
import { ArrowUpRight, Loader2, MailOpen } from 'lucide-react'
import type { MouseEvent } from 'react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { Button } from '#/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { cn } from '#/lib/utils'
import { InboxItemKind } from '#/shared/api/generated/model'
import { ApiError } from '#/shared/api/mutator'

import type { InboxItem, InboxResponse } from './api/inbox'
import {
  createInboxItemAnalyticsPayload,
  trackInboxItemMarkedRead,
  trackInboxItemOpened,
} from './analytics'
import type { InboxItemAnalyticsPayload } from './analytics'
import { ConnectionRequestInboxActions } from './ConnectionRequestInboxItem'
import { InboxCreatorHistoryPopover } from './InboxCreatorHistoryPopover'
import type { InboxCreatorBoxModel } from './groupInboxItemsByCounterpart'
import { useMarkInboxItemReadMutation } from './hooks/useMarkInboxItemReadMutation'
import { InboxDraftReviewPopover } from './InboxDraftReviewPopover'
import { InboxInlineActionPopover } from './InboxInlineActionPopover'
import { isKnownRouterHref } from './routerHref'

interface InboxCreatorBoxProps {
  accountKind: InboxResponse['account_kind']
  box: InboxCreatorBoxModel
  hasWaitingContext?: boolean
  tone: 'action' | 'waiting'
}

export function InboxCreatorBox({
  accountKind,
  box,
  hasWaitingContext = false,
  tone,
}: InboxCreatorBoxProps) {
  const item = box.headlineItem
  const router = useRouter()
  const markRead = useMarkInboxItemReadMutation()
  const isWaiting = tone === 'waiting'
  const analyticsPayload = createInboxItemAnalyticsPayload({
    accountKind,
    item,
  })
  const conversationId = getInboxConversationId(item)
  const conversationHref = conversationId
    ? `/workspace/conversations/${conversationId}`
    : null
  const boxHref = conversationHref ?? item.navigation_action?.href

  function navigateTo(
    href: string,
    navigationType: NonNullable<InboxItem['navigation_action']>['type'],
  ) {
    trackInboxItemOpened({
      ...analyticsPayload,
      navigation_type: navigationType,
    })

    if (!isKnownRouterHref(router, href)) {
      toast.info(t`Esta sección todavía no está disponible.`)
      return
    }

    void router.navigate({ to: href })
  }

  function handleNavigationClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.altKey || event.ctrlKey) {
      return
    }

    event.preventDefault()

    if (!boxHref) return

    const navigationType =
      conversationHref !== null
        ? 'open_conversation'
        : (item.navigation_action?.type ?? 'open_conversation')
    navigateTo(boxHref, navigationType)
  }

  function handleOpenConversation(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    if (!conversationHref) return
    navigateTo(conversationHref, 'open_conversation')
  }

  function handleMarkRead(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()

    for (const dismissableItem of box.items) {
      markRead.mutate(
        { item_id: dismissableItem.id, read_reason: 'manual' },
        {
          onSuccess: () => {
            trackInboxItemMarkedRead(
              createInboxItemAnalyticsPayload({
                accountKind,
                item: dismissableItem,
              }),
            )
          },
          onError: (error) => {
            if (
              error instanceof ApiError &&
              error.status === 409 &&
              error.code === 'inbox_item_not_actionable'
            ) {
              toast.info(t`Este item ya no requiere acción.`)
              return
            }

            toast.error(t`No se pudo marcar como leído. Intentá de nuevo.`)
          },
        },
      )
    }
  }

  return (
    <li>
      <article
        className={cn(
          'flex items-start gap-3 rounded-2xl border border-border bg-card px-4 py-3',
          isWaiting && 'opacity-90',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'mt-0.5 h-12 w-1 shrink-0 rounded-full',
            isWaiting ? 'bg-border-strong' : 'bg-primary',
          )}
        />

        <Avatar size="lg">
          {box.counterpart.avatar_url ? (
            <AvatarImage
              src={box.counterpart.avatar_url}
              alt={box.counterpart.display_name}
            />
          ) : null}
          <AvatarFallback>
            {getInitials(box.counterpart.display_name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <InboxCreatorHistoryPopover
            box={box}
            trigger={
              <InboxCreatorBoxMainContent
                box={box}
                href={boxHref ?? undefined}
                hasWaitingContext={hasWaitingContext}
                onNavigationClick={handleNavigationClick}
              />
            }
          />
          {item.kind ===
          InboxItemKind.InboxItemKindConnectionRequestReceived ? (
            <ConnectionRequestInboxActions item={item} />
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {item.kind ===
          InboxItemKind.InboxItemKindConnectionRequestReceived ? null : (
            <InboxCreatorHeadlineAction
              analyticsPayload={analyticsPayload}
              conversationId={conversationId}
              item={item}
            />
          )}

          <TooltipProvider delayDuration={200}>
            <div className="flex items-center gap-0.5">
              {conversationHref ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleOpenConversation}
                      aria-label={t`Ir al chat`}
                      className="hidden shrink-0 rounded-full sm:inline-flex"
                    >
                      <ArrowUpRight className="size-4" aria-hidden />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t`Ir al chat`}</TooltipContent>
                </Tooltip>
              ) : null}

              {box.canDismiss ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleMarkRead}
                      disabled={markRead.isPending}
                      aria-label={t`Marcar caja como leída`}
                      className="shrink-0 rounded-full"
                    >
                      {markRead.isPending ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                      ) : (
                        <MailOpen className="size-4" aria-hidden />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t`Marcar caja como leída`}</TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      tabIndex={0}
                      className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground"
                      aria-label={t`Se resuelve actuando`}
                    >
                      <MailOpen className="size-4" aria-hidden />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{t`Se resuelve actuando`}</TooltipContent>
                </Tooltip>
              )}
            </div>
          </TooltipProvider>
        </div>
      </article>
    </li>
  )
}

function InboxCreatorBoxMainContent({
  box,
  href,
  hasWaitingContext,
  onNavigationClick,
}: {
  box: InboxCreatorBoxModel
  href?: string
  hasWaitingContext: boolean
  onNavigationClick: (event: MouseEvent<HTMLAnchorElement>) => void
}) {
  const item = box.headlineItem
  const subtitleParts = [
    box.counterpart.display_name,
    item.campaign?.name,
  ].filter(
    (part): part is string => typeof part === 'string' && part.length > 0,
  )

  const content = (
    <>
      <div className="flex min-w-0 items-baseline gap-2">
        <h3 className="truncate text-sm font-semibold text-foreground">
          {item.title}
        </h3>
        <time
          className="shrink-0 text-xs text-muted-foreground"
          dateTime={box.newestOccurredAt}
        >
          {item.meta.timestamp}
        </time>
      </div>
      {subtitleParts.length > 0 ? (
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {subtitleParts.join(' · ')}
        </p>
      ) : null}
      <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-1.5">
        <p className="truncate text-xs text-muted-foreground">{item.preview}</p>
        {box.softSummary ? (
          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
            {box.softSummary}
          </span>
        ) : null}
        {hasWaitingContext ? (
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {t`También esperás algo`}
          </span>
        ) : null}
      </div>
    </>
  )

  if (!href) {
    return <div className="min-w-0">{content}</div>
  }

  return (
    <a
      href={href}
      onClick={onNavigationClick}
      className="block min-w-0 rounded-xl outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label={item.navigation_action?.label ?? item.title}
    >
      {content}
    </a>
  )
}

function InboxCreatorHeadlineAction({
  analyticsPayload,
  conversationId,
  item,
}: {
  analyticsPayload: InboxItemAnalyticsPayload
  conversationId: string | null
  item: InboxItem
}) {
  if (
    item.kind === InboxItemKind.InboxItemKindDraftReview &&
    item.source_ref.type === 'deliverable'
  ) {
    return <InboxDraftReviewPopover deliverableId={item.source_ref.id} />
  }

  return (
    <InboxInlineActionPopover
      analyticsPayload={analyticsPayload}
      conversationId={conversationId}
      itemId={item.id}
      inlineActions={item.inline_actions}
    />
  )
}

function getInboxConversationId(item: InboxItem): string | null {
  if (item.source_ref.type === 'conversation') return item.source_ref.id
  if (item.secondary_ref?.type === 'conversation') return item.secondary_ref.id

  return (
    item.navigation_action?.href.match(
      /^\/workspace\/conversations\/([^/?#]+)/,
    )?.[1] ?? null
  )
}

function getInitials(name: string) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return initials || '?'
}
