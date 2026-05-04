// One-shot: crea un creator de test + una conversation contra tu brand real.
// Use: pnpm tsx scripts/seed-debug-conversation.ts <YOUR_BRAND_CLERK_USER_ID>
// Imprime la URL para abrir en tu browser ya logueado.

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')

try {
  const envLocal = readFileSync(resolve(root, '.env.local'), 'utf-8')
  for (const line of envLocal.split('\n')) {
    const m = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)$/)
    if (m?.[1] && m[2] !== undefined)
      process.env[m[1]] ??= m[2].replace(/^['"]|['"]$/g, '')
  }
} catch {}

const brandClerkId = process.argv[2]
if (!brandClerkId) {
  console.error(
    'Usage: pnpm tsx scripts/seed-debug-conversation.ts <BRAND_CLERK_USER_ID>',
  )
  process.exit(1)
}

const CLERK = process.env.CLERK_SECRET_KEY!
const SECRET = process.env.MARZ_TEST_SECRET!
const API = (process.env.VITE_API_URL ?? 'http://localhost:8080').replace(
  /\/$/,
  '',
)

const CREATOR_EMAIL = 'e2e.debug.creator+clerk_test@example.com'

async function clerk<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`https://api.clerk.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${CLERK}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  if (!res.ok)
    throw new Error(`clerk ${path}: ${res.status} ${await res.text()}`)
  return (await res.json()) as T
}

async function back<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      'X-Test-Secret': SECRET,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  if (!res.ok)
    throw new Error(`back ${path}: ${res.status} ${await res.text()}`)
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

console.log('1. Buscar/crear creator en Clerk...')
const existing = await clerk<Array<{ id: string }>>(
  `/users?email_address=${encodeURIComponent(CREATOR_EMAIL)}`,
)
let creatorClerkId: string
if (existing.length > 0 && existing[0]) {
  creatorClerkId = existing[0].id
  console.log(`   reusando ${creatorClerkId}`)
} else {
  const created = await clerk<{ id: string }>('/users', {
    method: 'POST',
    body: JSON.stringify({
      external_id: 'e2e_debug_creator',
      email_address: [CREATOR_EMAIL],
      first_name: 'Debug',
      last_name: 'Creator',
    }),
  })
  creatorClerkId = created.id
  console.log(`   creado ${creatorClerkId}`)
}

console.log('2. Crear account en back para el creator...')
await back('/v1/test/accounts', {
  method: 'POST',
  body: JSON.stringify({
    clerk_user_id: creatorClerkId,
    email: CREATOR_EMAIL,
    full_name: 'Debug Creator',
  }),
})

console.log('3. Onboard-full creator...')
await back(`/v1/test/accounts/${creatorClerkId}/onboard-full`, {
  method: 'POST',
  body: JSON.stringify({ kind: 'creator' }),
})

console.log('4. Crear conversation entre tu brand y el creator...')
const conv = await back<{ conversation_id: string }>('/v1/test/conversations', {
  method: 'POST',
  body: JSON.stringify({
    brand_clerk_user_id: brandClerkId,
    creator_clerk_user_id: creatorClerkId,
  }),
})

console.log(`\nListo.\n`)
console.log(`Abrí en tu browser ya logueado:`)
console.log(
  `  http://localhost:3000/workspace/conversations/${conv.conversation_id}`,
)
console.log(`\nDevTools → Console → vas a ver el stack real del error.`)
console.log(`\nCleanup cuando termines:`)
console.log(`  pnpm tsx scripts/purge-clerk-e2e-users.ts`)
