# fn-31-feat-039-e2e-ajustes-perfil-de-marca.7 E2E brand-settings-auth-matrix.spec.ts — auth matrix endpoints nuevos (ESC-19)

## Description

Crea `src/test/e2e/suites/billing/brand-settings-auth-matrix.spec.ts`. Cubre la matriz de autenticación/autorización de los 5 endpoints nuevos de FEAT-039 (ESC-19). Los tests usan `fetch` vía `page.evaluate` para enviar requests directamente al backend sin pasar por la UI.

### Estrategia

Crear un usuario brand-owner onboarded como el usuario principal, y hacer los requests API directamente. Para los casos 401 (sin bearer), no autenticar la página. Para 403 (creator), usar `onboardedCreatorUser`.

Los tests NO van por la UI — son API-level assertions que se ejecutan en el contexto de la página con autenticación activa (o sin ella).

### Endpoints a verificar

| Endpoint | Sin auth | Creator | Owner válido |
|---|---|---|---|
| `GET /v1/brand-workspaces/me/settings` | 401 | 403 | 200 |
| `PATCH /v1/brand-workspaces/me/settings` | 401 | 403 | 200/422 |
| `POST /v1/brand-workspaces/me/logo:presign` | 401 | 403 | 200/400 |
| `GET /v1/billing/plan-usage` | 401 | 403 | 200 |
| `POST /v1/billing/checkout-sessions` | 401 | 403 | 403 already_subscribed ó 201 |

### Tests a implementar

#### Test 1: `brand_settings.api.auth_matrix` (ESC-19)

Estructura sugerida (un solo test con múltiples assertions):

```typescript
test('brand_settings.api.auth_matrix', async ({ page, onboardedBrandUser, onboardedCreatorUser }) => {
  // ---- Sin auth: requests desde página no autenticada ----
  await page.goto('/')
  // No autenticar — los requests deben retornar 401

  const unauthResults = await page.evaluate(async () => {
    const endpoints = [
      { method: 'GET', url: '/v1/brand-workspaces/me/settings' },
      { method: 'PATCH', url: '/v1/brand-workspaces/me/settings', body: {} },
      { method: 'POST', url: '/v1/brand-workspaces/me/logo:presign', body: { content_type: 'image/png', content_length: 1024 } },
      { method: 'GET', url: '/v1/billing/plan-usage' },
      { method: 'POST', url: '/v1/billing/checkout-sessions', body: { plan: 'growth', interval: 'monthly', success_url: '/', cancel_url: '/' } },
    ]
    return Promise.all(endpoints.map(async ({ method, url, body }) => {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...(method === 'POST' ? { 'Idempotency-Key': 'e2e-auth-test' } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
      })
      return { url, method, status: res.status }
    }))
  })

  for (const result of unauthResults) {
    expect(result.status, `${result.method} ${result.url} sin auth`).toBe(401)
  }

  // ---- Creator auth: 403 en todos los endpoints ----
  await onboardedCreatorUser.signIn(page)
  // Hacer los mismos requests con el creator autenticado (el Bearer es el cookie/session de Clerk)
  const creatorResults = await page.evaluate(async () => {
    // mismo array de requests — la sesión activa es la del creator
    // ...
  })
  for (const result of creatorResults) {
    expect(result.status, `${result.method} ${result.url} creator`).toBe(403)
  }
})
```

**Nota de implementación**: el bearer en la app se maneja mediante cookies de Clerk. Al usar `page.evaluate` para hacer `fetch`, el browser incluye las cookies automáticamente. El test solo necesita que el usuario esté autenticado en la página para que los requests incluyan el bearer.

**Importante**: verificar que los requests sin autenticación realmente retornan 401 y no 302 (redirect a login). Si el app usa cookies httpOnly, los `fetch` desde JS pueden comportarse diferente. Ajustar según lo que retorne realmente el backend. Si el 401 no es alcanzable vía JS fetch (el backend retorna 302), documentarlo en Done summary y adaptar el assert.

**Para el mock del checkout (POST)**: el brand-owner onboarded tiene plan free → el POST debería retornar 201 (o necesitar idempotency key). Mockear el checkout para retornar 403 `already_subscribed` si el owner tiene plan pago, o 201 si free. Ajustar según el estado del `onboardedBrandUser`.

### Verificación

```bash
pnpm test:e2e -- src/test/e2e/suites/billing/brand-settings-auth-matrix.spec.ts
pnpm typecheck
```

## Acceptance

- [ ] Existe `src/test/e2e/suites/billing/brand-settings-auth-matrix.spec.ts`.
- [ ] Test `brand_settings.api.auth_matrix`: verifica 401 sin auth para los 5 endpoints.
- [ ] Test `brand_settings.api.auth_matrix`: verifica 403 con creator auth para los 5 endpoints.
- [ ] Done summary documenta el comportamiento real de auth (si 401 ó 302, cómo funciona el bearer en fetch).
- [ ] `pnpm typecheck` pasa.
- [ ] `pnpm quality-gates` verde.

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
