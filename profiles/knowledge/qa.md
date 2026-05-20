# qa.md

Convenciones E2E del front. Aplicar antes que reglas genéricas.

## archivos a leer antes de escribir

- `src/test/e2e/fixtures.ts` — exports: `test`, `expect`, `TestUser`, `getClerkSessionToken`, `seedInboxItems`, `setInboxItemStatus`, `resetInbox`, fixtures (`testUser`, `brandOnboardingUser`, `creatorOnboardingUser`, `onboardedBrandUser`, `onboardedCreatorUser`)
- `src/test/e2e/*.spec.ts` — referencia de estilo (ej. `onboarding.spec.ts`, `creator-channels.spec.ts`, `campaign-configuration.spec.ts`)
- `src/shared/api/test-generated/test/test.ts` — wrappers tipados sobre `/v1/test/*`. Usalos antes de hacer `page.request.post('/v1/test/...')` raw
- `src/shared/api/mutator.ts` — shape del error envelope
- `profiles/knowledge/e2e-fixtures.md`

## TestUser API

```
const user = new TestUser(handle, email, displayName)
await user.ensureExists()           // crea en Clerk + cleanup residual
await user.onboardFull('brand'|'creator')  // → MeResponse { brand_workspace: {...} }
await user.signIn(page)             // login via Clerk testing
await user.delete()                 // cleanup, idempotente
```

## orden obligatorio

```
ensureExists → onboardFull → signIn(page) → getClerkSessionToken(page) → API calls
```

Saltar el orden → "Expected an active Clerk session token". `getClerkSessionToken` REQUIERE signIn previo.

## response handling

- usar `await response.json()` (maneja vacío como null)
- NO `JSON.parse(await response.text())` (rompe con 204)
- si esperás vacío: chequear `response.status() === 204` antes
- errores: `extractApiError(body)` con fallback envelope plano + anidado

```ts
function extractApiError(raw: unknown): { code?: string; details?: any } {
  const b = (raw ?? {}) as any
  if (b.code) return { code: b.code, details: b.details }
  if (b.error?.code) return { code: b.error.code, details: b.error.details }
  return {}
}
```

## fixtures runtime

- PROHIBIDO `process.env.E2E_*_ID` para datos. Nadie las setea
- Crear datos llamando `/v1/test/*` desde `beforeEach` o cuerpo del test
- Composición multi-primitiva → helper en `fixtures.ts` (no en el spec), naming `seed<Algo>`
- Importar wrappers de `#/shared/api/test-generated/test/test` (no hacer fetch raw)

## selectores

prioridad: `data-testid` > `getByRole({ name: /regex amplia/ })` > text exacto

prohibido: `nth-child`, text largo, `.first()` sin razón, `page.waitForTimeout(N)`

esperar: `await expect(loc).toBeVisible()`, `expect.poll(...)`

si falta data-testid en el componente, agregalo al componente. NO improvises selector frágil.

## asserts

NO: `expect(JSON.stringify(body)).toContain('x')`

SI:

```ts
const body = await response.json()
expect(body.target_platforms).not.toContain('twitter_x')
```

## cleanup

cada test que crea data debe limpiarla:

```ts
test('...', async ({ page }, testInfo) => {
  const user = makeUser(testInfo, 'brand', 'esc-N')
  try {
    await user.ensureExists()
    // ...
  } finally {
    await user.delete().catch(() => {})
  }
})
```

con fixtures (`{ brandOnboardingUser }`) el cleanup ya lo hace `fixtures.ts`.

## SETUP REQUERIDO

antes de marcar `test.skip('SETUP REQUERIDO: ...')`:

1. buscar en `src/shared/api/test-generated/test/test.ts`
2. buscar en `marz-api/profiles/knowledge/test-api.md`
3. si no existe: descripción NEUTRAL, no scenario-specific
   - ok: `'seed brand onboarding profile con attribution_source legacy'`
   - mal: `'seed feat023 twitter_x scenario'`

si la primitiva existe pero falta helper de composición → escribir helper en `fixtures.ts`. NO marcar pendiente del back.

## prohibido

- `import { test } from '@playwright/test'` → usar `import { test } from '../fixtures'`
- crear `fixtures.ts` paralelo
- hardcodear `localhost:3000` → usar `process.env.E2E_PORT` / `VITE_API_URL`
- tocar archivos fuera de `src/test/e2e/generated/`
- inventar test cases que no estén en el plan
- importar `test` de `@playwright/test` directo
