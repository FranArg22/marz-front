import { test as base, expect } from '@playwright/test'
import { createHash } from 'node:crypto'

import {
  buildCompletedDeliverableSeedMessages,
  createChatPair,
  type ChatPair,
} from './chat-pair'
import { E2E_RUN_ID } from './env'
import { TestUser } from './test-user'

function buildUserKey(testInfo: {
  testId: string
  workerIndex: number
}): string {
  const testHash = createHash('sha1')
    .update(testInfo.testId)
    .digest('hex')
    .slice(0, 8)
  return `${testInfo.workerIndex}.${E2E_RUN_ID}.${testHash}`
}

export const test = base.extend<{
  testUser: TestUser
  brandOnboardingUser: TestUser
  creatorOnboardingUser: TestUser
  onboardedBrandUser: TestUser
  onboardedCreatorUser: TestUser
  chatPair: ChatPair
  chatPairWithHistory: ChatPair
  chatPairWithCompletedDeliverable: ChatPair
  chatPairWithCompletedDeliverableScrollable: ChatPair
  chatPairOfferReady: ChatPair
}>({
  // eslint-disable-next-line no-empty-pattern
  testUser: async ({}, run, testInfo) => {
    const userKey = buildUserKey(testInfo)
    const user = new TestUser(
      `e2e_worker_${userKey}`,
      // The `+clerk_test` suffix tells Clerk to treat this as a test email:
      // signup/signin work without OTP and don't consume the 100/mo dev quota.
      // https://clerk.com/docs/testing/test-emails
      `e2e.worker.${userKey}+clerk_test@example.com`,
      'E2E Test User',
    )
    await user.ensureExists()
    await run(user)
    await user.delete()
  },

  brandOnboardingUser: async ({ testUser }, run) => {
    await testUser.setOnboardingState('onboarding_pending', 'brand')
    await run(testUser)
  },

  creatorOnboardingUser: async ({ testUser }, run) => {
    await testUser.setOnboardingState('onboarding_pending', 'creator')
    await run(testUser)
  },

  onboardedBrandUser: async ({ testUser }, run) => {
    // onboardFull (not setOnboardingState) so the brand_workspace exists.
    // Without it /conversations 422s with brand_workspace_required.
    await testUser.onboardFull('brand')
    await run(testUser)
  },

  onboardedCreatorUser: async ({ testUser }, run) => {
    await testUser.onboardFull('creator')
    await run(testUser)
  },

  chatPair: async ({ browser }, run, testInfo) => {
    const { pair, cleanup } = await createChatPair(
      browser,
      buildUserKey(testInfo),
    )
    await run(pair)
    await cleanup()
  },

  chatPairWithHistory: async ({ browser }, run, testInfo) => {
    const { pair, cleanup } = await createChatPair(
      browser,
      buildUserKey(testInfo),
      { count: 60, alternating_authors: true },
    )
    await run(pair)
    await cleanup()
  },

  chatPairWithCompletedDeliverable: async ({ browser }, run, testInfo) => {
    const { pair, cleanup } = await createChatPair(
      browser,
      buildUserKey(testInfo),
      buildCompletedDeliverableSeedMessages(2),
      { requireCompletedDeliverable: true },
    )
    await run(pair)
    await cleanup()
  },

  chatPairWithCompletedDeliverableScrollable: async (
    { browser },
    run,
    testInfo,
  ) => {
    const { pair, cleanup } = await createChatPair(
      browser,
      buildUserKey(testInfo),
      buildCompletedDeliverableSeedMessages(60),
      { requireCompletedDeliverable: true },
    )
    await run(pair)
    await cleanup()
  },

  chatPairOfferReady: async ({ browser }, run, testInfo) => {
    const { pair, cleanup } = await createChatPair(
      browser,
      buildUserKey(testInfo),
      undefined,
      {
        seedOfferReady: {
          campaign_name: 'E2E OfferSent Campaign',
          currency: 'USD',
        },
      },
    )
    await run(pair)
    await cleanup()
  },
})

export { expect }
export { TestUser } from './test-user'
export type { ChatPair } from './chat-pair'
export { getClerkSessionToken } from './clerk'
export { seedInboxItems, setInboxItemStatus, resetInbox } from './seeders'
