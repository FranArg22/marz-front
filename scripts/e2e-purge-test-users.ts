// Purge accumulated e2e test users from Clerk dev instance + backend.
// Clerk dev instances cap at 100 users; repeated e2e runs accumulate ghosts
// when tests crash before cleanup. Run with:
//
//   pnpm tsx scripts/e2e-purge-test-users.ts
//
// Reads CLERK_SECRET_KEY + MARZ_TEST_SECRET from .env.local.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadEnv() {
  const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnv()

const CLERK_SECRET = process.env.CLERK_SECRET_KEY
const TEST_SECRET = process.env.MARZ_TEST_SECRET
const API_URL = (
  process.env.VITE_API_URL ??
  process.env.API_URL ??
  'http://localhost:8080'
).replace(/\/$/, '')

if (!CLERK_SECRET) throw new Error('CLERK_SECRET_KEY is required')
if (!TEST_SECRET) throw new Error('MARZ_TEST_SECRET is required')

async function listClerkUsers(): Promise<
  Array<{ id: string; email_addresses: Array<{ email_address: string }> }>
> {
  const all: Array<{
    id: string
    email_addresses: Array<{ email_address: string }>
  }> = []
  const limit = 100
  for (let offset = 0; ; offset += limit) {
    const res = await fetch(
      `https://api.clerk.com/v1/users?limit=${limit}&offset=${offset}`,
      { headers: { Authorization: `Bearer ${CLERK_SECRET}` } },
    )
    if (!res.ok)
      throw new Error(`Clerk list failed: ${res.status} ${await res.text()}`)
    const page = (await res.json()) as Array<{
      id: string
      email_addresses: Array<{ email_address: string }>
    }>
    all.push(...page)
    if (page.length < limit) return all
  }
}

async function deleteClerkUser(id: string): Promise<void> {
  const res = await fetch(`https://api.clerk.com/v1/users/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${CLERK_SECRET}` },
  })
  if (!res.ok && res.status !== 404) {
    throw new Error(
      `Clerk delete ${id} failed: ${res.status} ${await res.text()}`,
    )
  }
}

async function purgeBackend(pattern: string): Promise<void> {
  const res = await fetch(`${API_URL}/v1/test/accounts:purge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Test-Secret': TEST_SECRET!,
    },
    body: JSON.stringify({ email_like: pattern }),
  })
  if (!res.ok) {
    throw new Error(`Backend purge failed: ${res.status} ${await res.text()}`)
  }
  console.log(`Backend purge('${pattern}'): ${await res.text()}`)
}

async function main() {
  const users = await listClerkUsers()
  const e2eUsers = users.filter((u) =>
    u.email_addresses.some((e) => e.email_address.includes('+clerk_test@')),
  )
  console.log(
    `Clerk: ${users.length} total users, ${e2eUsers.length} e2e ghosts to delete`,
  )

  let deleted = 0
  for (const u of e2eUsers) {
    try {
      await deleteClerkUser(u.id)
      deleted += 1
      if (deleted % 10 === 0)
        console.log(`  deleted ${deleted}/${e2eUsers.length}`)
    } catch (err) {
      console.error(`  failed to delete ${u.id}:`, err)
    }
  }
  console.log(`Clerk: deleted ${deleted}/${e2eUsers.length}`)

  // Backend purge uses SQL LIKE patterns. Covers all e2e-style emails.
  await purgeBackend('e2e.%@example.com')
  await purgeBackend('other.%@example.com')

  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
