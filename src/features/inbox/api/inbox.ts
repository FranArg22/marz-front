import { createServerFn } from '@tanstack/react-start'
import { auth } from '@clerk/tanstack-react-start/server'
import { z } from 'zod'

import {
  listInbox,
  markInboxItemRead as generatedMarkInboxItemRead,
  markInboxRead as generatedMarkInboxVisibleRead,
} from '#/shared/api/generated/notifications/notifications'
import {
  generateIdempotencyKey,
  withIdempotencyKey,
} from '#/shared/api/idempotency'
import type {
  InboxInlineAction,
  InboxItem,
  InboxItemKind,
  InboxNavigationAction,
  InboxResponse,
  MarkInboxItemReadRequest,
  MarkInboxItemReadResponse,
  MarkInboxReadResponse,
} from '#/shared/api/generated/model'

export type {
  InboxInlineAction,
  InboxItem,
  InboxItemKind,
  InboxNavigationAction,
  InboxResponse,
  MarkInboxItemReadRequest,
  MarkInboxItemReadResponse,
}

export type MarkInboxVisibleReadResponse = MarkInboxReadResponse
type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

type SerializableInboxInlineAction = Omit<
  InboxInlineAction,
  'request_schema'
> & {
  request_schema: { [key: string]: JsonValue }
}

type SerializableInboxItem = Omit<InboxItem, 'inline_actions' | 'metadata'> & {
  inline_actions: SerializableInboxInlineAction[]
  metadata: { [key: string]: JsonValue }
}

export type SerializableInboxResponse = Omit<
  InboxResponse,
  'action_items' | 'waiting_items'
> & {
  action_items: SerializableInboxItem[]
  waiting_items: SerializableInboxItem[]
}

export const inboxQueryKey = ['inbox'] as const

export function getInboxQueryKey(campaignId?: string | null) {
  return [...inboxQueryKey, campaignId ?? null] as const
}

export const getInboxInputSchema = z.object({
  campaign_id: z.string().uuid().optional(),
})

export const markInboxItemReadInputSchema = z.object({
  item_id: z.string().uuid(),
  read_reason: z.enum(['manual', 'resolved_elsewhere']).optional(),
})

export const markInboxVisibleReadInputSchema = z.object({
  campaign_id: z.string().uuid().optional(),
  sections: z.array(z.enum(['action', 'waiting'])).optional(),
})

export type GetInboxInput = z.infer<typeof getInboxInputSchema>
export type MarkInboxItemReadInput = z.infer<
  typeof markInboxItemReadInputSchema
>
export type MarkInboxVisibleReadInput = z.infer<
  typeof markInboxVisibleReadInputSchema
>

async function fetchInbox(input: GetInboxInput = {}): Promise<InboxResponse> {
  const authObject = await auth()

  if (!authObject.userId) {
    throw new Error('Unauthorized')
  }

  const token = await authObject.getToken()
  if (!token) {
    throw new Error('Unauthorized')
  }

  const response = await listInbox(input, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data as InboxResponse
}

export async function markInboxItemRead(
  input: MarkInboxItemReadInput,
): Promise<MarkInboxItemReadResponse> {
  const response = await generatedMarkInboxItemRead(
    input.item_id,
    { read_reason: input.read_reason },
    withIdempotencyKey(generateIdempotencyKey()),
  )
  return response.data as MarkInboxItemReadResponse
}

export async function markInboxVisibleRead(
  input: MarkInboxVisibleReadInput,
): Promise<MarkInboxVisibleReadResponse> {
  const response = await generatedMarkInboxVisibleRead(
    {
      campaign_id: input.campaign_id,
      sections: input.sections,
    },
    withIdempotencyKey(generateIdempotencyKey()),
  )
  return response.data as MarkInboxVisibleReadResponse
}

function toJsonValue(value: unknown): JsonValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value
  }

  if (Array.isArray(value)) {
    return value.map(toJsonValue)
  }

  if (typeof value === 'object') {
    return toJsonObject(value)
  }

  return null
}

function toJsonObject(value: object): { [key: string]: JsonValue } {
  const jsonObject: { [key: string]: JsonValue } = {}

  for (const [key, child] of Object.entries(value)) {
    jsonObject[key] = toJsonValue(child)
  }

  return jsonObject
}

function serializeInboxItem(item: InboxItem): SerializableInboxItem {
  return {
    ...item,
    inline_actions: item.inline_actions.map((action) => ({
      ...action,
      request_schema: toJsonObject(action.request_schema),
    })),
    metadata: toJsonObject(item.metadata),
  }
}

function serializeInboxResponse(
  response: InboxResponse,
): SerializableInboxResponse {
  return {
    ...response,
    action_items: response.action_items.map(serializeInboxItem),
    waiting_items: response.waiting_items.map(serializeInboxItem),
  }
}

export const getInbox = createServerFn({ method: 'GET' })
  .inputValidator(getInboxInputSchema)
  .handler(async ({ data }) => serializeInboxResponse(await fetchInbox(data)))
