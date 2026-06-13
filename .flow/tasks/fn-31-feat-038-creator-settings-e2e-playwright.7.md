# fn-31-feat-038-creator-settings-e2e-playwright.7 — E2E api auth matrix (ESC-23)

## Description

**Size:** S

Crea `src/test/e2e/suites/creator-settings/api.spec.ts`. Cubre el test_id `creator_settings.api.auth_matrix`.

Este spec valida que los 8 endpoints nuevos de creator settings devuelven los códigos de error correctos según el tipo de usuario. No usa navegación UI — usa `page.request.fetch` (Playwright API context) para hacer llamadas HTTP directas al backend.

Fixtures: `onboardedCreatorUser`, `onboardedBrandUser`, `creatorOnboardingUser` de `src/test/e2e/support/fixtures.ts`.

### Endpoints a verificar

Los 8 endpoints del feature (base path `/v1/creators/me`):
```
GET  /v1/creators/me/settings
PATCH /v1/creators/me/profile/contact
PUT  /v1/creators/me/avatar
PATCH /v1/creators/me/profile/collaboration
PUT  /v1/creators/me/rates
PUT  /v1/creators/me/sample-videos
GET  /v1/creators/me/payout-account
PUT  /v1/creators/me/payout-account
```

### URL base del backend

Importar `API_BASE_URL` de `../../support/env` (defaults a `http://localhost:8080`, configurable via `VITE_API_URL` o `API_URL`). NO usar la URL del frontend (puerto 3000) — los endpoints son del backend.

```typescript
import { API_BASE_URL } from '../../support/env'
```

### Cómo obtener el session token

Importar `getClerkSessionToken` de `../../support/fixtures` (re-exportado desde `../../support/clerk`). Después de `signIn`, llamar:

```typescript
import { getClerkSessionToken } from '../../support/fixtures'

const token = await getClerkSessionToken(page)
```

### Casos de auth a verificar (por tipo de usuario)

**Sin token (401)**
- Para cada endpoint, hacer la llamada sin header Authorization:
  ```typescript
  const res = await page.request.fetch(`${API_BASE_URL}/v1/creators/me/settings`, {
    method: 'GET',
  })
  expect(res.status()).toBe(401)
  ```
- Esperar status 401 en todos.

**Token de brand (403)**
- Usar fixture `onboardedBrandUser`. Hacer `signIn(page)`, luego `getClerkSessionToken(page)`.
- Invocar cada endpoint con ese token en `Authorization: Bearer ${token}`.
- Esperar status 403 en todos.

**Token de creator no onboarded (403)**
- Usar fixture `creatorOnboardingUser` (ya definido en `src/test/e2e/support/fixtures.ts`, llama a `setOnboardingState('onboarding_pending', 'creator')`).
- Hacer `signIn(page)`, luego `getClerkSessionToken(page)`.
- Invocar cada endpoint.
- Esperar status 403 en todos.

### Implementación sugerida

```typescript
import { test, expect, getClerkSessionToken } from '../../support/fixtures'
import { API_BASE_URL } from '../../support/env'

const ENDPOINTS: Array<{ method: string; path: string }> = [
  { method: 'GET', path: '/v1/creators/me/settings' },
  { method: 'PATCH', path: '/v1/creators/me/profile/contact' },
  { method: 'PUT', path: '/v1/creators/me/avatar' },
  { method: 'PATCH', path: '/v1/creators/me/profile/collaboration' },
  { method: 'PUT', path: '/v1/creators/me/rates' },
  { method: 'PUT', path: '/v1/creators/me/sample-videos' },
  { method: 'GET', path: '/v1/creators/me/payout-account' },
  { method: 'PUT', path: '/v1/creators/me/payout-account' },
]

async function callApi(page: Page, method: string, path: string, token?: string) {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  return page.request.fetch(`${API_BASE_URL}${path}`, { method, headers })
}
```

### Acceptance

- [ ] El test_id `creator_settings.api.auth_matrix` está implementado en `api.spec.ts`
- [ ] Los 3 escenarios (sin token, brand, creator no onboarded) se verifican para los 8 endpoints
- [ ] Usa `API_BASE_URL` de `../../support/env` para la URL del backend (no la del frontend)
- [ ] Usa `getClerkSessionToken` de `../../support/fixtures` para extraer tokens
- [ ] Usa `creatorOnboardingUser` fixture para el caso de creator no onboarded
- [ ] `pnpm test:e2e --grep "Creator settings — api"` pasa
- [ ] Los assertions verifican el status code HTTP (401 o 403) — no navegan a pantallas UI

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs: