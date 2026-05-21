import { t } from '@lingui/core/macro'

import { ChatRailItem } from '#/features/chat/components/ChatRailItem'

import type { ConversationListItem } from '#/shared/api/generated/model'

interface ConversationRailItemProps {
  conversation: ConversationListItem
  active?: boolean
  variant?: 'full' | 'compact'
  onClick?: (conversationId: string) => void
}

export function ConversationRailItem({
  conversation,
  active = false,
  variant = 'full',
  onClick,
}: ConversationRailItemProps) {
  const { counterpart, last_message_preview, unread_count } = conversation

  const preview = resolvePreview(
    last_message_preview.kind,
    last_message_preview.text,
  )
  const fallback = counterpart.display_name.charAt(0).toUpperCase()

  return (
    <div role="listitem">
      <ChatRailItem
        name={counterpart.display_name}
        preview={preview}
        avatarUrl={counterpart.avatar_url ?? undefined}
        avatarFallback={fallback}
        active={active}
        unread={unread_count > 0}
        variant={variant}
        onClick={() => onClick?.(conversation.id)}
      />
    </div>
  )
}

function resolvePreview(
  kind: ConversationListItem['last_message_preview']['kind'],
  text: string,
): string {
  switch (kind) {
    case 'empty':
      return t`Conversación iniciada`
    case 'system_event':
      return text
    case 'attachment':
      return t`Archivo adjunto`
    case 'text':
      return text
    default:
      return text
  }
}
