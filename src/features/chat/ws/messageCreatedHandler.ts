import type { InfiniteData, QueryClient } from '@tanstack/react-query'

import type { DomainEventEnvelope } from '#/shared/ws/events'
import type { MessageCreatedPayload } from '#/shared/ws/types'
import { getMessagesQueryKey } from '#/shared/queries/messages'
import { getConversationOffersQueryKey } from '#/shared/queries/offers'
import { getConversationDeliverablesQueryKey } from '#/shared/queries/deliverables'
import { getDeliverableLinksQueryKey } from '#/features/deliverables/hooks/useDeliverableLinks'
import { OFFER_EVENT_TYPES } from '#/shared/offers/constants'
import type { MessageItem, MessagesResponse } from '#/features/chat/types'
import { toMessagePayload } from '#/features/chat/utils/messagePayload'

type MessagesInfiniteData = InfiniteData<
  { data: MessagesResponse; status: number },
  string | undefined
>

// Draft/link lifecycle system events that change the deliverable state shown in
// the context panel. The chat only receives the message; the panel reads the
// deliverables query, so it must be invalidated when these arrive.
/* eslint-disable lingui/no-unlocalized-strings -- claves internas de eventos WS, no es UI */
const DELIVERABLE_EVENT_TYPES = new Set([
  'DraftSubmitted',
  'DraftApproved',
  'ChangesRequested',
  'LinkSubmitted',
  'LinkApproved',
  'LinkChangesRequested',
])
/* eslint-enable lingui/no-unlocalized-strings */

export function handleMessageCreated(
  queryClient: QueryClient,
  envelope: DomainEventEnvelope<MessageCreatedPayload>,
  currentAccountId: string,
  activeConversationId?: string,
) {
  const { payload } = envelope

  const messagesKey = getMessagesQueryKey(payload.conversation_id)

  const confirmedMessage: MessageItem =
    payload.type === 'system_event'
      ? {
          id: payload.id,
          conversation_id: payload.conversation_id,
          author_account_id: payload.author_account_id,
          type: 'system_event',
          text_content: null,
          event_type: payload.event_type,
          payload: toMessagePayload(payload.payload),
          created_at: payload.created_at,
          read_by_self: payload.author_account_id === currentAccountId,
        }
      : {
          id: payload.id,
          conversation_id: payload.conversation_id,
          author_account_id: payload.author_account_id,
          type: 'text',
          text_content: payload.text,
          event_type: null,
          payload: null,
          created_at: payload.created_at,
          read_by_self: payload.author_account_id === currentAccountId,
        }

  queryClient.setQueryData<MessagesInfiniteData>(messagesKey, (old) => {
    // No cache yet (counterpart had timeline open with zero messages) or the
    // first page hasn't been materialized: seed a fresh first page so the
    // incoming message renders immediately instead of waiting for a refetch.
    if (!old || old.pages.length === 0) {
      return {
        pages: [
          {
            data: {
              data: [confirmedMessage],
              next_before_cursor: null,
              has_more: false,
            },
            status: 200,
          },
        ],
        pageParams: [undefined],
      }
    }

    // client_message_id only exists on text payloads (server echoes the id
    // the client sent on POST so the optimistic insert can be reconciled).
    const clientMessageId =
      payload.type === 'text' ? payload.client_message_id : null
    if (clientMessageId) {
      const found = old.pages.some((page) =>
        page.data.data.some((msg) => msg.id === clientMessageId),
      )
      if (found) {
        return replaceByClientMessageId(old, clientMessageId, confirmedMessage)
      }
    }

    const alreadyExists = old.pages.some((page) =>
      page.data.data.some((msg) => msg.id === payload.id),
    )
    if (alreadyExists) return old

    return appendToFirstPage(old, confirmedMessage)
  })

  if (
    payload.type === 'system_event' &&
    OFFER_EVENT_TYPES.has(payload.event_type)
  ) {
    queryClient.invalidateQueries({
      queryKey: getConversationOffersQueryKey(payload.conversation_id),
    })
    // Accepting an offer materializes deliverables asynchronously (OfferAccepted
    // → outbox → worker), so the mutation's immediate invalidation races ahead of
    // the insert. This WS event arrives after the worker runs, so refresh the
    // deliverables panel here too (otherwise the creator only sees it after F5).
    queryClient.invalidateQueries({
      queryKey: getConversationDeliverablesQueryKey(payload.conversation_id),
    })
  }

  if (
    payload.type === 'system_event' &&
    payload.event_type === 'PaymentMarked' &&
    (activeConversationId === undefined ||
      payload.conversation_id === activeConversationId)
  ) {
    const systemEventPayload = toMessagePayload(payload.payload)
    const snapshot =
      (systemEventPayload?.['snapshot'] as
        | Record<string, unknown>
        | undefined) ?? systemEventPayload
    const deliverableId = snapshot?.['deliverable_id']

    if (typeof deliverableId === 'string') {
      queryClient.invalidateQueries({
        queryKey: ['deliverables', deliverableId],
      })
    }
    queryClient.invalidateQueries({
      queryKey: ['conversations', payload.conversation_id, 'messages'],
    })
    queryClient.invalidateQueries({
      queryKey: getConversationDeliverablesQueryKey(payload.conversation_id),
    })
    queryClient.invalidateQueries({
      queryKey: getConversationOffersQueryKey(payload.conversation_id),
    })
  }

  if (
    payload.type === 'system_event' &&
    DELIVERABLE_EVENT_TYPES.has(payload.event_type)
  ) {
    // Draft/link submitted/approved/changes: the chat shows the message but the
    // context panel reads the deliverables query, so refresh it + the
    // per-deliverable detail the panel rows read.
    queryClient.invalidateQueries({
      queryKey: getConversationDeliverablesQueryKey(payload.conversation_id),
    })
    // Approving the last link finalizes the offer (it stops being "current"),
    // which flips the panel to the empty/send-offer state — refresh offers too.
    queryClient.invalidateQueries({
      queryKey: getConversationOffersQueryKey(payload.conversation_id),
    })
    const systemEventPayload = toMessagePayload(payload.payload)
    const snapshot =
      (systemEventPayload?.['snapshot'] as
        | Record<string, unknown>
        | undefined) ?? systemEventPayload
    const deliverableId = snapshot?.['deliverable_id']
    if (typeof deliverableId === 'string') {
      queryClient.invalidateQueries({
        queryKey: ['deliverables', deliverableId],
      })
      // The "Link publicado" panel reads the deliverable's published-links
      // query; refresh it so a submitted/approved link shows without an F5.
      queryClient.invalidateQueries({
        queryKey: getDeliverableLinksQueryKey(deliverableId),
      })
    }
  }
}

function replaceByClientMessageId(
  cache: MessagesInfiniteData,
  clientMessageId: string,
  confirmedMessage: MessageItem,
): MessagesInfiniteData {
  const pages = cache.pages.map((page) => ({
    ...page,
    data: {
      ...page.data,
      data: page.data.data.map((msg) =>
        msg.id === clientMessageId ? confirmedMessage : msg,
      ),
    },
  }))
  return { ...cache, pages }
}

function appendToFirstPage(
  cache: MessagesInfiniteData,
  message: MessageItem,
): MessagesInfiniteData {
  const pages = [...cache.pages]
  const firstPage = pages[0]!
  pages[0] = {
    ...firstPage,
    data: {
      ...firstPage.data,
      data: [message, ...firstPage.data.data],
    },
  }
  return { ...cache, pages }
}
