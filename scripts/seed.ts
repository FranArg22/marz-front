// Seed interactivo para testing manual: pregunta qué seedear (brand, creator,
// plan, discoverable, conversación), crea los entes pedidos contra los
// endpoints /v1/test/* del backend y abre un browser headed (logueado) por
// cada usuario creado.
//
// Use (interactivo):
//   pnpm tsx scripts/seed.ts
//
// Use (no interactivo, saltea prompts con flags):
//   pnpm tsx scripts/seed.ts --brand --creator --conversation
//   pnpm tsx scripts/seed.ts --brand --plan=free
//   pnpm tsx scripts/seed.ts --creator --discoverable
//   pnpm tsx scripts/seed.ts --run-id=debug-1
//
// Flags:
//   --brand            crear brand (saltea el prompt)
//   --creator          crear creator (saltea el prompt)
//   --plan=free|growth plan de la brand (default growth; saltea el prompt)
//   --discoverable     hacer al creator discoverable (saltea el prompt)
//   --conversation     poner brand+creator en una conversación (saltea el prompt)
//   --run-id=...       id determinístico para los emails
//
// Cerrá cualquiera de las ventanas para terminar el proceso (corre cleanup).

import { resolve } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { chromium } from '@playwright/test'
import { clerkSetup } from '@clerk/testing/playwright'

import {
  arg,
  back,
  clerkApi,
  ensureUser,
  loadEnvLocal,
  openSignedInBrowser,
  readEnv
  
} from './lib/test-user.ts'
import type {EnsuredUser} from './lib/test-user.ts';

loadEnvLocal(resolve(import.meta.dirname, '..'))

const hasFlag = (name: string): boolean => process.argv.includes(`--${name}`)

const seedRunId =
  arg('run-id') ?? new Date().toISOString().replace(/\D/g, '').slice(0, 14)

// --- Prompts ---------------------------------------------------------------

const rl = createInterface({ input: stdin, output: stdout })

// Lee un sí/no con default. Si `forced` está definido (vino por flag), no
// pregunta y devuelve ese valor.
async function confirm(
  question: string,
  defaultYes: boolean,
  forced?: boolean,
): Promise<boolean> {
  if (forced !== undefined) {
    console.log(`${question} ${forced ? 'y' : 'n'} (--flag)`)
    return forced
  }
  const hint = defaultYes ? '[Y/n]' : '[y/N]'
  const answer = (await rl.question(`${question} ${hint} `))
    .trim()
    .toLowerCase()
  if (answer === '') return defaultYes
  return answer === 'y' || answer === 'yes' || answer === 's' || answer === 'si'
}

// Pregunta el plan (free/growth). Si vino por --plan=, no pregunta.
async function askPlan(): Promise<'free' | 'growth'> {
  const forced = arg('plan')
  if (forced !== undefined) {
    if (forced !== 'free' && forced !== 'growth') {
      console.error(`--plan debe ser "free" o "growth" (recibí "${forced}")`)
      process.exit(1)
    }
    console.log(`¿En qué plan? ${forced} (--plan)`)
    return forced
  }
  const answer = (await rl.question('¿En qué plan? (free / growth) [growth] '))
    .trim()
    .toLowerCase()
  if (answer === '' || answer === 'growth') return 'growth'
  if (answer === 'free') return 'free'
  console.error(`plan inválido "${answer}" — usá free o growth`)
  process.exit(1)
}

// Determina si un prompt fue forzado por flag (true) o no (undefined → preguntar).
const forcedBrand = hasFlag('brand') ? true : undefined
const forcedCreator = hasFlag('creator') ? true : undefined
const forcedDiscoverable = hasFlag('discoverable') ? true : undefined
const forcedConversation = hasFlag('conversation') ? true : undefined

const wantBrand = await confirm('¿Crear una brand?', true, forcedBrand)
const plan = wantBrand ? await askPlan() : 'free'
const wantCreator = await confirm('¿Crear un creator?', true, forcedCreator)
const wantDiscoverable = wantCreator
  ? await confirm(
      '¿El creator discoverable? (aparece en discovery)',
      true,
      forcedDiscoverable,
    )
  : false
const wantConversation =
  wantBrand && wantCreator
    ? await confirm(
        '¿Deben estar en una conversación juntos?',
        false,
        forcedConversation,
      )
    : false

rl.close()

if (!wantBrand && !wantCreator) {
  console.error('\nNada para seedear (ni brand ni creator). Saliendo.')
  process.exit(0)
}

// --- Seeding ---------------------------------------------------------------

const env = readEnv()

const brandEmail = `e2e.manual.brand.${seedRunId}+clerk_test@example.com`
const creatorEmail = `e2e.manual.creator.${seedRunId}+clerk_test@example.com`

let brand: EnsuredUser | undefined
let creator: EnsuredUser | undefined

console.log('\n1. Crear usuarios (idempotente)...')
if (wantBrand) {
  brand = await ensureUser(env, {
    email: brandEmail,
    fullName: 'Nubex Pay',
    kind: 'brand',
  })
}
if (wantCreator) {
  creator = await ensureUser(env, {
    email: creatorEmail,
    fullName: 'Lucía Fernández',
    kind: 'creator',
  })
}

// El brand_workspace_id se obtiene re-llamando onboard-full (idempotente): su
// respuesta es el MeResponse, que incluye brand_workspace.id. No hace falta una
// conversación para conseguirlo.
let brandWorkspaceId: string | undefined
if (brand) {
  const me = await back<{ brand_workspace?: { id: string } }>(
    env,
    `/v1/test/accounts/${brand.clerkUserId}/onboard-full`,
    { method: 'POST', body: JSON.stringify({ kind: 'brand' }) },
  )
  brandWorkspaceId = me.brand_workspace?.id
  if (!brandWorkspaceId) {
    console.warn('   WARN: no pude obtener brand_workspace_id del onboard-full')
  }
}

if (brand && plan !== 'free' && brandWorkspaceId) {
  console.log(
    `2. Poner la brand en plan "${plan}" (Stripe test subscription)...`,
  )
  const sub = await back<{ status: string; stripe_subscription_id?: string }>(
    env,
    '/v1/test/billing/subscription',
    {
      method: 'POST',
      body: JSON.stringify({
        brand_workspace_id: brandWorkspaceId,
        email: brandEmail,
        plan,
      }),
    },
  )
  console.log(
    `   billing: ${sub.status}${sub.stripe_subscription_id ? ` (${sub.stripe_subscription_id})` : ''}`,
  )
} else if (brand && plan !== 'free' && !brandWorkspaceId) {
  console.warn(`   WARN: salteo el plan "${plan}" — falta brand_workspace_id.`)
}

if (creator && wantDiscoverable) {
  console.log('3. Hacer al creator discoverable...')
  const disc = await back<{ eligible: boolean; channels: number }>(
    env,
    `/v1/test/creators/${creator.clerkUserId}/discoverable`,
    { method: 'POST', body: JSON.stringify({}) },
  )
  console.log(
    `   discoverable: eligible=${disc.eligible}, channels=${disc.channels}`,
  )
}

let conversationId: string | undefined
if (wantConversation && brand && creator) {
  console.log('4. Crear conversation entre brand y creator...')
  const conv = await back<{
    conversation_id: string
    brand_workspace_id: string
    campaign_id?: string
  }>(env, '/v1/test/conversations', {
    method: 'POST',
    body: JSON.stringify({
      brand_clerk_user_id: brand.clerkUserId,
      creator_clerk_user_id: creator.clerkUserId,
      seed_offer_ready: {
        campaign_name: 'Lanzamiento Nubex Verano',
        currency: 'USD',
      },
    }),
  })
  conversationId = conv.conversation_id
  console.log(`   conversation_id: ${conversationId}`)
  if (conv.campaign_id) console.log(`   campaign_id:     ${conv.campaign_id}`)
}

// --- Browsers --------------------------------------------------------------

console.log('\n5. clerkSetup() — fetch testing token...')
await clerkSetup()

// Start path por usuario: con conversación, ambos en la conversation; sin
// conversación, la brand en /discovery y el creator en su home.
const conversationPath = conversationId
  ? `/workspace/conversations/${conversationId}`
  : undefined
const brandStart = conversationPath ?? '/discovery'
const creatorStart = conversationPath ?? '/'

console.log('6. Lanzar browsers headed...')
const browser = await chromium.launch({
  headless: false,
  args: ['--remote-debugging-port=9222'],
  handleSIGINT: false,
  handleSIGTERM: false,
  handleSIGHUP: false,
})

// Sign-in en serie: clerk.signIn navega y hace polling; en paralelo puede
// pisarse con el handshake del backend.
if (brand) {
  const page = await openSignedInBrowser(browser, env.appUrl, brand, brandStart)
  void page
}
if (creator) {
  const page = await openSignedInBrowser(
    browser,
    env.appUrl,
    creator,
    creatorStart,
  )
  void page
}

console.log('\nListo. Resumen de lo creado:')
if (brand) {
  console.log(`  brand   = ${brand.email}`)
  console.log(
    `            plan=${plan}${brandWorkspaceId ? ` workspace=${brandWorkspaceId}` : ''}`,
  )
  console.log(`            start: ${env.appUrl}${brandStart}`)
}
if (creator) {
  console.log(`  creator = ${creator.email}`)
  console.log(`            discoverable=${wantDiscoverable}`)
  console.log(`            start: ${env.appUrl}${creatorStart}`)
}
if (conversationId) {
  console.log(`  conversation = ${env.appUrl}${conversationPath}`)
}
console.log('\nApretá Ctrl+C (o cerrá una ventana) para terminar y limpiar.\n')

// --- Cleanup ---------------------------------------------------------------

const users = [brand, creator].filter((u): u is EnsuredUser => u !== undefined)

let cleaningUp = false
async function deleteOne(label: string, fn: () => Promise<unknown>) {
  console.log(`  [...]  ${label}`)
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('timeout 10s')), 10_000),
  )
  try {
    await Promise.race([fn(), timeout])
    console.log(`  [ok]   ${label}`)
  } catch (err) {
    console.error(`  [fail] ${label}: ${(err as Error).message}`)
  }
}

async function cleanup(exitCode: number) {
  if (cleaningUp) return
  cleaningUp = true
  console.log(
    '\nLimpiando cuentas de prueba (cascade borra conversation + campaign)...',
  )
  await Promise.all(
    users.flatMap((u) => [
      deleteOne(`backend ${u.kind} ${u.clerkUserId}`, () =>
        back(env, `/v1/test/accounts/${u.clerkUserId}`, { method: 'DELETE' }),
      ),
      deleteOne(`clerk ${u.kind} ${u.clerkUserId}`, () =>
        clerkApi(env, `/users/${u.clerkUserId}`, { method: 'DELETE' }),
      ),
    ]),
  )
  console.log('Cleanup completo.')
  process.exit(exitCode)
}

// Cerrar cualquier ventana termina el proceso (como el script viejo).
browser.on('disconnected', () => void cleanup(0))

let sigintCount = 0
process.on('SIGINT', () => {
  sigintCount++
  if (sigintCount === 1) {
    console.log(
      '\nSIGINT recibido — corriendo cleanup. Volvé a apretar Ctrl+C para abortar.',
    )
    void cleanup(130)
  } else {
    console.log('\nAbort forzado.')
    process.exit(130)
  }
})
process.on('SIGTERM', () => void cleanup(143))
