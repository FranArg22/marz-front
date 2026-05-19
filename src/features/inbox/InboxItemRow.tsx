import { t } from '@lingui/core/macro'
import { useRouter } from '@tanstack/react-router'
import { ArrowUpRight, Loader2, MailOpen } from 'lucide-react'

import { useMe } from '#/shared/api/generated/accounts/accounts'

import { InboxMessagePreviewPopover } from './InboxMessagePreviewPopover'
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
import { ApiError } from '#/shared/api/mutator'
import { InboxDraftReviewPopover } from './InboxDraftReviewPopover'

import type { InboxItem, InboxResponse } from './api/inbox'
import { isKnownRouterHref } from './routerHref'
import {
  createInboxItemAnalyticsPayload,
  trackInboxItemMarkedRead,
  trackInboxItemOpened,
} from './analytics'
import { useMarkInboxItemReadMutation } from './hooks/useMarkInboxItemReadMutation'
import { InboxInlineActionPopover } from './InboxInlineActionPopover'

interface InboxItemRowProps {
  accountKind: InboxResponse['account_kind']
  item: InboxItem
}

export function InboxItemRow({ accountKind, item }: InboxItemRowProps) {
  const router = useRouter()
  const counterpartName = item.counterpart?.display_name ?? item.meta.primary
  const avatarUrl = item.counterpart?.avatar_url
  const isWaiting = item.section === 'waiting'
  const markRead = useMarkInboxItemReadMutation()
  const analyticsPayload = createInboxItemAnalyticsPayload({
    accountKind,
    item,
  })

  const conversationId = getInboxConversationId(item)
  const conversationHref = conversationId
    ? `/workspace/conversations/${conversationId}`
    : null
  const rowHref = conversationHref ?? item.navigation_action?.href

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

    if (!rowHref) return

    const navigationType =
      conversationHref !== null
        ? 'open_conversation'
        : (item.navigation_action?.type ?? 'open_conversation')
    navigateTo(rowHref, navigationType)
  }

  function handleOpenConversation(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    if (!conversationHref) return
    navigateTo(conversationHref, 'open_conversation')
  }

  function handleMarkRead(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    markRead.mutate(
      { item_id: item.id, read_reason: 'manual' },
      {
        onSuccess: () => {
          trackInboxItemMarkedRead(analyticsPayload)
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

  return (
    <li>
      <article
        className={cn(
          'flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3',
          isWaiting && 'opacity-90',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'h-11 w-1 shrink-0 rounded-full',
            isWaiting ? 'bg-border-strong' : 'bg-primary',
          )}
        />

        <Avatar size="lg">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={counterpartName} />
          ) : null}
          <AvatarFallback>{getInitials(counterpartName)}</AvatarFallback>
        </Avatar>

        <InboxItemMainContent
          item={item}
          href={rowHref ?? undefined}
          onNavigationClick={handleNavigationClick}
        />

        {item.kind === 'draft_review' &&
        item.source_ref.type === 'deliverable' ? (
          <InboxDraftReviewPopover deliverableId={item.source_ref.id} />
        ) : (
          <InboxInlineActionPopover
            analyticsPayload={analyticsPayload}
            conversationId={conversationId}
            itemId={item.id}
            inlineActions={item.inline_actions}
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
                    className="shrink-0 rounded-full"
                  >
                    <ArrowUpRight className="size-4" aria-hidden />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t`Ir al chat`}</TooltipContent>
              </Tooltip>
            ) : null}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleMarkRead}
                  disabled={markRead.isPending}
                  aria-label={t`Marcar como leído`}
                  className="shrink-0 rounded-full"
                >
                  {markRead.isPending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <MailOpen className="size-4" aria-hidden />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t`Marcar como leído`}</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </article>
    </li>
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

interface MessagePreviewEntry {
  id: string
  preview: string
  occurred_at: string
  author_account_id: string
}

function extractRecentPreviews(item: InboxItem): MessagePreviewEntry[] {
  const raw = (item.metadata as { recent_previews?: unknown } | undefined)
    ?.recent_previews
  if (!Array.isArray(raw)) return []
  const entries: MessagePreviewEntry[] = []
  for (const [position, entry] of raw.entries()) {
    if (typeof entry !== 'object' || entry === null) continue
    const obj = entry as Record<string, unknown>
    const preview = typeof obj.preview === 'string' ? obj.preview : ''
    const occurredAt =
      typeof obj.occurred_at === 'string' ? obj.occurred_at : ''
    const authorId =
      typeof obj.author_account_id === 'string' ? obj.author_account_id : ''
    if (!preview) continue
    entries.push({
      id: `${authorId}-${occurredAt}-${position}`,
      preview,
      occurred_at: occurredAt,
      author_account_id: authorId,
    })
  }
  return entries
}

function extractUnreadCount(item: InboxItem): number {
  const raw = (item.metadata as { unread_count?: unknown } | undefined)
    ?.unread_count
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) return raw
  return 0
}

function InboxItemMainContent({
  href,
  item,
  onNavigationClick,
}: {
  href?: string
  item: InboxItem
  onNavigationClick: (event: MouseEvent<HTMLAnchorElement>) => void
}) {
  const subtitleParts = [
    item.counterpart?.display_name,
    item.campaign?.name,
  ].filter(
    (part): part is string => typeof part === 'string' && part.length > 0,
  )

  const unreadCount = extractUnreadCount(item)
  const previews = extractRecentPreviews(item)
  const showMessageBundle = item.kind === 'message_reply' && unreadCount > 1

  const meQuery = useMe()
  const selfAccountId =
    meQuery.data?.status === 200 ? meQuery.data.data.id : null

  const previewLine = showMessageBundle ? (
    <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
      <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
        +{unreadCount} {t`nuevos`}
      </span>
      <span className="truncate">{item.preview}</span>
    </p>
  ) : (
    <p className="mt-0.5 truncate text-xs text-muted-foreground">
      {item.preview}
    </p>
  )

  const previewSlot =
    showMessageBundle && previews.length > 0 ? (
      <InboxMessagePreviewPopover
        previews={previews}
        selfAccountId={selfAccountId}
        trigger={previewLine}
      />
    ) : (
      previewLine
    )

  const content = (
    <>
      <div className="flex min-w-0 items-baseline gap-2">
        <h3 className="truncate text-sm font-semibold text-foreground">
          {item.title}
        </h3>
        <time
          className="shrink-0 text-xs text-muted-foreground"
          dateTime={item.occurred_at}
        >
          {item.meta.timestamp}
        </time>
      </div>
      {subtitleParts.length > 0 ? (
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {subtitleParts.join(' · ')}
        </p>
      ) : null}
      {previewSlot}
    </>
  )

  if (!href) {
    return <div className="min-w-0 flex-1">{content}</div>
  }

  return (
    <a
      href={href}
      onClick={onNavigationClick}
      className="min-w-0 flex-1 rounded-xl outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label={item.navigation_action?.label ?? item.title}
    >
      {content}
    </a>
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
