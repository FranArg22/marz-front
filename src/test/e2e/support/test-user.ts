import { clerk } from '@clerk/testing/playwright'
import type { Page } from '@playwright/test'

import {
  createTestAccount,
  deleteTestAccount,
  onboardTestAccountFull,
  setTestOnboardingState,
} from '#/shared/api/test-generated/test/test'
import type {
  AccountKind,
  MeResponse,
  OnboardingStatus,
} from '#/shared/api/test-generated/model'

import { CLERK_SECRET } from './env'
import {
  createClerkUser,
  deleteClerkUser,
  getClerkUserByEmail,
} from './clerk'

export class TestUser {
  clerkUserId: string
  accountId: string | null = null

  constructor(
    public workerId: string,
    public email: string,
    public fullName: string,
  ) {
    this.clerkUserId = workerId
  }

  async ensureExists(): Promise<MeResponse> {
    if (CLERK_SECRET) {
      const existing = await getClerkUserByEmail(this.email)
      if (!existing) {
        const clerkUser = await createClerkUser({
          workerId: this.workerId,
          email: this.email,
          fullName: this.fullName,
        })
        this.clerkUserId = clerkUser.id
      } else {
        this.clerkUserId = existing.id
      }
    }

    const res = await createTestAccount({
      clerk_user_id: this.clerkUserId,
      email: this.email,
      full_name: this.fullName,
    })
    const me = (res as { data: MeResponse }).data
    this.accountId = me.id
    return me
  }

  async setOnboardingState(
    status: OnboardingStatus,
    kind?: AccountKind,
  ): Promise<MeResponse> {
    const res = await setTestOnboardingState(this.clerkUserId, {
      status,
      ...(kind ? { kind } : {}),
    })
    return (res as { data: MeResponse }).data
  }

  async onboardFull(kind: AccountKind): Promise<MeResponse> {
    const res = await onboardTestAccountFull(this.clerkUserId, { kind })
    return (res as { data: MeResponse }).data
  }

  async delete(): Promise<void> {
    await deleteTestAccount(this.clerkUserId)
    await deleteClerkUser(this.clerkUserId)
  }

  async signIn(page: Page): Promise<void> {
    await page.goto('/')
    await clerk.signIn({ page, emailAddress: this.email })
  }

  async signOut(page: Page): Promise<void> {
    await clerk.signOut({ page })
  }
}
