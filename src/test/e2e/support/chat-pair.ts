import type { Browser, Page } from '@playwright/test'

import { createTestConversation } from '#/shared/api/test-generated/test/test'
import type {
  CreateTestConversationResponse,
  SeedMessagesInput,
  SeedOfferReadyInput,
} from '#/shared/api/test-generated/model'

import { API_BASE_URL } from './env'
import { getClerkSessionToken } from './clerk'
import { TestUser } from './test-user'

export interface ChatPair {
  conversationId: string
  brandWorkspaceId: string
  deliverableId?: string
  campaignId?: string
  brand: TestUser
  creator: TestUser
  brandPage: Page
  creatorPage: Page
}

interface ConversationDeliverablesResponseBody {
  data?: {
    deliverables?: Array<{
      id?: string
      status?: string
    }>
  }
}

async function getCompletedDeliverableId(
  page: Page,
  conversationId: string,
  brandWorkspaceId: string,
): Promise<string | undefined> {
  const token = await getClerkSessionToken(page)
  const response = await page.request.get(
    `${API_BASE_URL}/v1/conversations/${conversationId}/deliverables`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Brand-Workspace-Id': brandWorkspaceId,
      },
    },
  )

  if (!response.ok()) {
    throw new Error(
      `Failed to load seeded deliverables: ${response.status()} ${await response.text()}`,
    )
  }

  const body = (await response.json()) as ConversationDeliverablesResponseBody
  const deliverable = body.data?.deliverables?.find(
    (item) => item.status === 'completed',
  )

  return deliverable?.id
}

export async function createChatPair(
  browser: Browser,
  userKey: string,
  seedMessages?: SeedMessagesInput,
  options?: {
    requireCompletedDeliverable?: boolean
    seedOfferReady?: SeedOfferReadyInput
  },
): Promise<{ pair: ChatPair; cleanup: () => Promise<void> }> {
  const brand = new TestUser(
    `e2e_brand_${userKey}`,
    `e2e.brand.${userKey}+clerk_test@example.com`,
    'E2E Brand',
  )
  const creator = new TestUser(
    `e2e_creator_${userKey}`,
    `e2e.creator.${userKey}+clerk_test@example.com`,
    'E2E Creator',
  )

  try {
    await Promise.all([
      brand.ensureExists().then(() => brand.onboardFull('brand')),
      creator.ensureExists().then(() => creator.onboardFull('creator')),
    ])
  } catch (err) {
    await Promise.all([
      brand.delete().catch(() => {}),
      creator.delete().catch(() => {}),
    ])
    throw err
  }

  let conversation: CreateTestConversationResponse
  try {
    const res = await createTestConversation({
      brand_clerk_user_id: brand.clerkUserId,
      creator_clerk_user_id: creator.clerkUserId,
      ...(seedMessages ? { seed_messages: seedMessages } : {}),
      ...(options?.seedOfferReady
        ? { seed_offer_ready: options.seedOfferReady }
        : {}),
    })
    conversation = (res as { data: CreateTestConversationResponse }).data
  } catch (err) {
    await Promise.all([
      brand.delete().catch(() => {}),
      creator.delete().catch(() => {}),
    ])
    throw err
  }

  const [brandCtx, creatorCtx] = await Promise.all([
    browser.newContext(),
    browser.newContext(),
  ])
  const [brandPage, creatorPage] = await Promise.all([
    brandCtx.newPage(),
    creatorCtx.newPage(),
  ])
  try {
    await brand.signIn(brandPage)
    await creator.signIn(creatorPage)
  } catch (err) {
    await Promise.all([
      brandCtx.close(),
      creatorCtx.close(),
      brand.delete().catch(() => {}),
      creator.delete().catch(() => {}),
    ])
    throw err
  }

  let deliverableId: string | undefined
  try {
    deliverableId = options?.requireCompletedDeliverable
      ? await getCompletedDeliverableId(
          brandPage,
          conversation.conversation_id,
          conversation.brand_workspace_id,
        )
      : undefined
  } catch (err) {
    await Promise.all([
      brandCtx.close(),
      creatorCtx.close(),
      brand.delete().catch(() => {}),
      creator.delete().catch(() => {}),
    ])
    throw err
  }

  const pair: ChatPair = {
    conversationId: conversation.conversation_id,
    brandWorkspaceId: conversation.brand_workspace_id,
    deliverableId,
    campaignId: conversation.campaign_id,
    brand,
    creator,
    brandPage,
    creatorPage,
  }

  const cleanup = async () => {
    await Promise.all([
      brandCtx.close(),
      creatorCtx.close(),
      brand.delete(),
      creator.delete(),
    ])
  }

  return { pair, cleanup }
}

export function buildCompletedDeliverableSeedMessages(
  count: number,
): SeedMessagesInput {
  return {
    count,
    alternating_authors: true,
    mark_read_for: 'both',
  }
}
