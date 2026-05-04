// Crea (o reusa) un brand + un creator + una conversation entre ellos, y abre
// dos browsers headed (uno por cada usuario) ya en la URL de la conversation.
//
// Use:
//   pnpm tsx scripts/seed-conversation.ts
//   pnpm tsx scripts/seed-conversation.ts --brand-email=... --creator-email=...
//   pnpm tsx scripts/seed-conversation.ts --seed-messages=20
//
// Cerrá cualquiera de las dos ventanas para terminar el proceso.

import { resolve } from 'node:path'
import { chromium } from '@playwright/test'
import { clerkSetup } from '@clerk/testing/playwright'

import {
  arg,
  back,
  ensureUser,
  loadEnvLocal,
  openSignedInBrowser,
  readEnv,
} from './lib/test-user.ts'

loadEnvLocal(resolve(import.meta.dirname, '..'))

const brandEmail =
  arg('brand-email') ?? 'e2e.manual.brand+clerk_test@example.com'
const creatorEmail =
  arg('creator-email') ?? 'e2e.manual.creator+clerk_test@example.com'
const seedCountRaw = arg('seed-messages')
const seedCount = seedCountRaw ? Number(seedCountRaw) : 0
if (
  seedCountRaw &&
  (!Number.isFinite(seedCount) || seedCount < 0 || seedCount > 500)
) {
  console.error('--seed-messages debe ser un entero entre 0 y 500')
  process.exit(1)
}

const env = readEnv()

console.log('1. Ensure brand + creator (idempotente)...')
const [brand, creator] = await Promise.all([
  ensureUser(env, {
    email: brandEmail,
    fullName: 'Manual Brand',
    kind: 'brand',
  }),
  ensureUser(env, {
    email: creatorEmail,
    fullName: 'Manual Creator',
    kind: 'creator',
  }),
])

console.log('2. Crear conversation...')
const conv = await back<{
  conversation_id: string
  brand_workspace_id: string
}>(env, '/v1/test/conversations', {
  method: 'POST',
  body: JSON.stringify({
    brand_clerk_user_id: brand.clerkUserId,
    creator_clerk_user_id: creator.clerkUserId,
    ...(seedCount > 0
      ? { seed_messages: { count: seedCount, alternating_authors: true } }
      : {}),
  }),
})
console.log(`   conversation_id: ${conv.conversation_id}`)

console.log('3. clerkSetup() — fetch testing token...')
await clerkSetup()

const conversationPath = `/workspace/conversations/${conv.conversation_id}`

console.log('4. Lanzar browsers headed (brand + creator)...')
const browser = await chromium.launch({ headless: false })

// Sign-in en serie: clerk.signIn navega y hace polling, lanzar dos en paralelo
// puede pisarse con el handshake del backend.
const brandPage = await openSignedInBrowser(
  browser,
  env.appUrl,
  brand,
  conversationPath,
)
const creatorPage = await openSignedInBrowser(
  browser,
  env.appUrl,
  creator,
  conversationPath,
)
void brandPage
void creatorPage

console.log(`\nListo. Dos browsers abiertos en la conversation:`)
console.log(`  brand   = ${brand.email}`)
console.log(`  creator = ${creator.email}`)
console.log(`  ${env.appUrl}${conversationPath}`)
console.log(`\nCerrá cualquiera de las ventanas para terminar.\n`)

browser.on('disconnected', () => {
  process.exit(0)
})
