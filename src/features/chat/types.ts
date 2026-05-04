import type { ConversationDetail } from '#/shared/api/generated/model'

// Re-export generated detail types so call sites import a single source.
export type {
  ConversationDetail,
  ConversationDetailCounterpart,
  ConversationDetailPresence as ConversationPresence,
} from '#/shared/api/generated/model'

export interface ConversationDetailResponse {
  data: ConversationDetail
}

// Flat shape used by timeline/cache code. Bridges the discriminated
// `TextMessageListItem | SystemEventMessageListItem` returned by the API.
// Conversions live in `chat/queries.ts` (read path) and
// `chat/mutations/useSendMessageMutation.ts` (write path).
export interface MessageItem {
  id: string
  conversation_id: string
  author_account_id: string | null
  type: 'text' | 'system_event'
  text_content: string | null
  event_type: string | null
  payload: Record<string, unknown> | null
  created_at: string
  read_by_self: boolean
}

export interface MessagesResponse {
  data: MessageItem[]
  next_before_cursor: string | null
  has_more: boolean
}

export interface MessagesParams {
  conversationId: string
  beforeCursor?: string
  limit?: number
}
