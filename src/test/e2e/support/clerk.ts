import type { Page } from '@playwright/test'

import { CLERK_API_URL, CLERK_SECRET } from './env'

interface ClerkUser {
  id: string
}

async function clerkApi(path: string, init?: RequestInit): Promise<unknown> {
  if (!CLERK_SECRET) return null

  const res = await fetch(`${CLERK_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${CLERK_SECRET}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Clerk API ${path} failed: ${res.status} ${text}`)
  }

  return res.json()
}

function isClerkUser(value: unknown): value is ClerkUser {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string'
  )
}

export async function getClerkUserByEmail(
  email: string,
): Promise<ClerkUser | null> {
  const searchParams = new URLSearchParams()
  searchParams.append('email_address', email)

  const response = await clerkApi(`/users?${searchParams.toString()}`)
  if (!Array.isArray(response)) return null
  const first = response[0]
  return isClerkUser(first) ? first : null
}

export async function createClerkUser(params: {
  workerId: string
  email: string
  fullName: string
}): Promise<ClerkUser> {
  const [firstName = params.fullName, ...rest] = params.fullName.split(' ')
  const response = await clerkApi('/users', {
    method: 'POST',
    body: JSON.stringify({
      external_id: params.workerId,
      email_address: [params.email],
      first_name: firstName,
      last_name: rest.join(' ') || undefined,
    }),
  })

  if (!isClerkUser(response)) {
    throw new Error('Clerk API create user returned an invalid response')
  }

  return response
}

export async function deleteClerkUser(clerkUserId: string): Promise<void> {
  if (!CLERK_SECRET) return
  const res = await fetch(`${CLERK_API_URL}/users/${clerkUserId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${CLERK_SECRET}` },
  })
  if (!res.ok && res.status !== 404) {
    const text = await res.text()
    throw new Error(
      `Clerk DELETE /users/${clerkUserId} failed: ${res.status} ${text}`,
    )
  }
}

export async function getClerkSessionToken(page: Page): Promise<string> {
  const token = await page.evaluate(async () => {
    const clerk = (
      window as Window & {
        Clerk?: { session?: { getToken: () => Promise<string | null> } }
      }
    ).Clerk
    return (await clerk?.session?.getToken()) ?? null
  })

  if (!token) {
    throw new Error('Expected an active Clerk session token')
  }

  return token
}
