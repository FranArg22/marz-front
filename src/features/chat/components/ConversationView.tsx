import { useCallback, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import {
  useConversationDetailQuery,
  useMessagesInfiniteQuery,
} from '#/features/chat/queries'
import { useChatWsListeners } from '#/features/chat/ws/useChatWsListeners'
import { handleMessageCreated } from '#/features/chat/ws/messageCreatedHandler'
import { useAutoMarkRead } from '#/features/chat/hooks/useAutoMarkRead'
import { useViewportAtBottom } from '#/features/chat/hooks/useViewportAtBottom'
import { useTypingStore } from '#/features/chat/stores/typingStore'
import {
  trackChatEvent,
  estimateLatencyMs,
} from '#/features/chat/analytics/track'

import { ArrowLeft, Banknote } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { t } from '@lingui/core/macro'

import { useOffersPanelStore } from '#/features/chat/workspace/offersPanelStore'
import { useConversationPendingAction } from '#/features/offers/hooks/useConversationPendingAction'
import { ConversationHeader } from './ConversationHeader'
import { EmptyConversationFallback } from './EmptyConversationFallback'
import type { MessageTimelineHandle } from './MessageTimeline'
import { MessageTimeline } from './MessageTimeline'
import { MessageComposer } from './MessageComposer'
import { NewMessagesPill } from './NewMessagesPill'
import { TypingIndicator } from './TypingIndicator'

interface ConversationViewProps {
  conversationId: string
  currentAccountId: string
  sessionKind: 'brand' | 'creator' | undefined
  onUploadDraft?: (deliverableId: string) => void
  highlightPaymentId?: string
}

export function ConversationView({
  conversationId,
  currentAccountId,
  sessionKind,
  onUploadDraft,
  highlightPaymentId,
}: ConversationViewProps) {
  const queryClient = useQueryClient()
  const detailQuery = useConversationDetailQuery(conversationId)
  const timelineRef = useRef<MessageTimelineHandle>(null)
  const { isAtBottom, onAtBottomStateChange } = useViewportAtBottom()
  const setTyping = useTypingStore((s) => s.setTyping)
  const clearTyping = useTypingStore((s) => s.clearTyping)

  useMessagesInfiniteQuery(conversationId)

  const { unreadCount, clearUnread, handleIncomingMessage } = useAutoMarkRead({
    conversationId,
    currentAccountId,
    isAtBottom,
  })

  const openedTrackedRef = useRef(false)
  const unreadCountRef = useRef(unreadCount)
  useEffect(() => {
    unreadCountRef.current = unreadCount
  }, [unreadCount])

  useEffect(() => {
    if (!detailQuery.data) return
    const { counterpart } = detailQuery.data

    if (!openedTrackedRef.current) {
      openedTrackedRef.current = true
      trackChatEvent('conversation_opened', {
        conversation_id: conversationId,
        counterpart_kind: counterpart.kind,
        has_unread: unreadCountRef.current > 0,
      })
    }
  }, [detailQuery.data, conversationId])

  const onMessageCreated = useCallback(
    (envelope: Parameters<typeof handleMessageCreated>[1]) => {
      handleMessageCreated(
        queryClient,
        envelope,
        currentAccountId,
        conversationId,
      )
      handleIncomingMessage(envelope.payload.author_account_id)
      clearTyping(conversationId, envelope.payload.author_account_id)

      if (envelope.payload.author_account_id !== currentAccountId) {
        trackChatEvent('message_received_live', {
          conversation_id: conversationId,
          latency_ms_estimate: estimateLatencyMs(envelope.payload.created_at),
        })
      }
    },
    [
      queryClient,
      currentAccountId,
      handleIncomingMessage,
      clearTyping,
      conversationId,
    ],
  )

  const onTypingStarted = useCallback(
    (envelope: { payload: { actor_account_id: string } }) => {
      setTyping(conversationId, envelope.payload.actor_account_id)
    },
    [conversationId, setTyping],
  )

  const onTypingStopped = useCallback(
    (envelope: { payload: { actor_account_id: string } }) => {
      clearTyping(conversationId, envelope.payload.actor_account_id)
    },
    [conversationId, clearTyping],
  )

  const { send: wsSend } = useChatWsListeners(conversationId, {
    enabled: true,
    onMessageCreated,
    onTypingStarted,
    onTypingStopped,
  })

  const handlePillClick = useCallback(() => {
    timelineRef.current?.scrollToBottom()
    clearUnread()
  }, [clearUnread])

  if (detailQuery.isLoading) {
    return <ConversationViewSkeleton />
  }

  if (detailQuery.isError) {
    return <EmptyConversationFallback />
  }

  const conversation = detailQuery.data
  if (!conversation) {
    return <EmptyConversationFallback />
  }

  const canSend =
    conversation.can_send && Boolean(conversation.counterpart.is_active)

  return (
    <div className="flex h-full flex-col">
      <ConversationHeader
        conversation={conversation}
        leadingSlot={<BackToListButton />}
        trailingSlot={
          <OffersToggleButton
            conversationId={conversationId}
            sessionKind={sessionKind}
          />
        }
      />

      <div className="relative flex flex-1 flex-col overflow-hidden">
        <MessageTimeline
          conversationId={conversationId}
          currentAccountId={currentAccountId}
          sessionKind={sessionKind}
          onUploadDraft={onUploadDraft}
          highlightPaymentId={highlightPaymentId}
          onAtBottomStateChange={onAtBottomStateChange}
          timelineRef={timelineRef}
        />
        <NewMessagesPill count={unreadCount} onClick={handlePillClick} />
      </div>

      <TypingIndicator
        conversationId={conversationId}
        currentAccountId={currentAccountId}
      />
      <MessageComposer
        conversationId={conversationId}
        currentAccountId={currentAccountId}
        canSend={canSend}
        wsSend={wsSend}
        onSent={() => timelineRef.current?.scrollToBottom()}
      />
    </div>
  )
}

function BackToListButton() {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() =>
        void navigate({ to: '/workspace', search: (prev) => prev })
      }
      aria-label={t`Volver a conversaciones`}
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
      title={t`Volver a conversaciones`}
    >
      <ArrowLeft className="size-4" />
    </button>
  )
}

function OffersToggleButton({
  conversationId,
  sessionKind,
}: {
  conversationId: string
  sessionKind: 'brand' | 'creator' | undefined
}) {
  const toggle = useOffersPanelStore((s) => s.toggle)
  const isOpen = useOffersPanelStore((s) => s.isOpen)
  const hasPendingAction = useConversationPendingAction(
    conversationId,
    sessionKind,
  )
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t`Ofertas`}
      aria-expanded={isOpen}
      className="relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 md:hidden"
      title={t`Ofertas`}
    >
      <Banknote className="size-4" />
      {t`Ofertas`}
      {hasPendingAction ? (
        <span
          aria-hidden
          className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-red-600"
        />
      ) : null}
    </button>
  )
}

function ConversationViewSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-5 py-3">
        <div className="size-10 animate-pulse rounded-full bg-muted" />
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="flex-1" />
    </div>
  )
}
