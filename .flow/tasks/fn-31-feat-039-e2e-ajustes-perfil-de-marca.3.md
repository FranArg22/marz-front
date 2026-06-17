# fn-31-feat-039-e2e-ajustes-perfil-de-marca.3 E2E brand-settings-general.spec.ts — prefill, save, validaciones, email read-only

## Description

Crea `src/test/e2e/suites/identity/brand-settings-general.spec.ts`. Cubre datos precargados, guardar campos, validaciones de campos requeridos y formato, phone opcional, y email read-only. Todos los tests usan `page.route()` para controlar las respuestas del API y así evitar dependencia de datos reales en DB.

### Estrategia de mocking

Todos los tests mockean `GET /v1/brand-workspaces/me/settings` para controlar los valores precargados. El PATCH se deja pasar al backend en algunos tests y se intercepta en otros (validaciones).

**Mock helper sugerido** (definir en el scope del describe):

```typescript
function mockGetSettings(page: Page, overrides: Partial<typeof BASE_SETTINGS> = {}) {
  const data = { ...BASE_SETTINGS, ...overrides }
  return page.route(/\/v1\/brand-workspaces\/me\/settings$/, async (route) => {
    if (route.request().method() !== 'GET') { await route.continue(); return }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data }) })
  })
}
```

**Fixture base** (`BASE_SETTINGS`):
```typescript
const BASE_SETTINGS = {
  profile: { full_name: 'Carla Méndez', email: 'carla@brand.com', phone_e164: '+5491155512345' },
  brand: { name: 'Acme', website_url: 'https://acme.com', logo_url: null },
}
```

### Tests a implementar

#### Test 1: `brand_settings.general.prefilled` (ESC-1 general)

- Mock GET /settings → BASE_SETTINGS
- Navegar a `/ajustes/general`
- Assertions:
  - Input Nombre (`label /Nombre/i` o campo `full_name`) tiene valor "Carla Méndez"
  - Input Email (`label /Email/i`) tiene valor "carla@brand.com" y está disabled
  - Input Teléfono (`label /Teléfono/i`) tiene valor "+5491155512345"
  - Input Nombre de marca (`label /Nombre de marca/i`) tiene valor "Acme"
  - Input Sitio web (`label /Sitio web/i`) tiene valor "https://acme.com"
  - Botón `[data-testid="settings.general.save_button"]` está disabled (form no dirty)

#### Test 2: `brand_settings.general.save_button_enabled_on_dirty` (ESC-3 parte 1)

- Mock GET /settings → BASE_SETTINGS
- Navegar a `/ajustes/general`
- Rellenar campo Nombre con "Carla M. Pérez" (cambio)
- Assertion: botón `[data-testid="settings.general.save_button"]` está enabled

#### Test 3: `brand_settings.general.save_all_fields_one_request` (ESC-3 parte 2)

- Mock GET /settings → BASE_SETTINGS
- Mock PATCH /settings para capturar el request body y responder 200
- Navegar a `/ajustes/general`
- Editar los 4 campos: full_name="Carla M. Pérez", phone_e164="+5491155599999", name="Acme Studio", website_url="https://acme.studio"
- Click en guardar
- Assertions:
  - PATCH fue llamado exactamente 1 vez con todos los campos editados en el body
  - Toast "Ajustes guardados" visible
  - Botón save vuelve a estar disabled (form no dirty)
- Verificar que NO se envió `email` en el body del PATCH

#### Test 4: `brand_settings.general.required_full_name` (ESC-6)

- Mock GET /settings → BASE_SETTINGS  
- Mock PATCH → 422 `{ error: { code: "validation_error", fields: { full_name: ["required"] } } }`
- Navegar a `/ajustes/general`
- Limpiar campo Nombre completo y hacer click en guardar
- Assertion: mensaje de error inline para el campo full_name. Sin toast de éxito.

#### Test 5: `brand_settings.general.required_brand_name` (ESC-6)

- Igual pero clearing el campo de Nombre de marca
- Mock PATCH → 422 con `fields: { name: ["required"] }`

#### Test 6: `brand_settings.general.required_website_url` (ESC-6)

- Igual pero clearing el campo Sitio web
- Mock PATCH → 422 con `fields: { website_url: ["required"] }`

#### Test 7: `brand_settings.general.invalid_phone_e164` (ESC-7)

- Mock PATCH → 422 con `fields: { phone_e164: ["invalid_e164"] }`
- Ingresar "12345" en Teléfono y guardar
- Assertion: error inline en campo teléfono

#### Test 8: `brand_settings.general.invalid_website_url` (ESC-7)

- Mock PATCH → 422 con `fields: { website_url: ["invalid_url"] }`
- Ingresar "acme" en Sitio web y guardar
- Assertion: error inline en sitio web

#### Test 9: `brand_settings.general.phone_optional_clear` (ESC-8)

- Mock GET → BASE_SETTINGS (phone set)
- Mock PATCH → capturar body + responder 200
- Limpiar campo Teléfono y guardar
- Assertion: PATCH body contiene `phone_e164: null`. Toast visible.

#### Test 10: `brand_settings.general.email_input_disabled` (ESC-9)

- Mock GET → BASE_SETTINGS
- Navegar a `/ajustes/general`
- Assertion: input con `label /Email/i` tiene atributo `disabled` (o `readonly`) — NO es editable.
- Intentar fill en el campo de email (debe fallar silenciosamente o el valor no cambia)

#### Test 11: `brand_settings.general.patch_rejects_email_field` (ESC-9)

- Mock PATCH para el path `/v1/brand-workspaces/me/settings` → responder 422 con `{ error: { code: "invalid_body" } }`
- En este test el dev debe intentar disparar el PATCH con `email` en el body usando `page.evaluate` o `fetch` directamente desde el contexto de la página con el bearer actual
- Assertion: respuesta es 422 con código `invalid_body`
- Nota: si el frontend nunca envía `email` (lo bloquea en el form), este test puede verificar solo que el input UI está disabled y no envía el campo (del PATCH interceptado de T3 se puede derivar este assert)

### Notas de implementación

- Para los tests de validaciones (T4-T8), la validación puede ocurrir en el frontend (zod) o en el backend. Si el form usa zod con `validators.onChange`, los errores pueden aparecer sin llegar al PATCH. Verificar el comportamiento real del componente en `GeneralSection.tsx`: la validación `onChange` usa el schema zod; `onSubmit` también. El backend se llama igual. El mock del PATCH para 422 simula la respuesta del backend.
- Para los inputs, buscar por `label` o `placeholder` ya que los componentes usan `<field.TextField label={t\`...\`}>`. Usar `page.getByLabel(...)` como localizador primario.

### Verificación

```bash
pnpm test:e2e -- src/test/e2e/suites/identity/brand-settings-general.spec.ts --grep "prefill|save|required|invalid|phone|email"
pnpm typecheck
```

## Acceptance

- [ ] Existe `src/test/e2e/suites/identity/brand-settings-general.spec.ts`.
- [ ] Test `brand_settings.general.prefilled`: todos los campos con los valores del mock.
- [ ] Test `brand_settings.general.save_button_enabled_on_dirty`: botón habilitado al editar.
- [ ] Test `brand_settings.general.save_all_fields_one_request`: un solo PATCH con todos los campos, toast visible.
- [ ] Tests `required_*`: error inline por campo requerido, sin toast de éxito.
- [ ] Tests `invalid_*`: error inline por formato inválido.
- [ ] Test `brand_settings.general.phone_optional_clear`: PATCH con `phone_e164: null`.
- [ ] Test `brand_settings.general.email_input_disabled`: input email no editable.
- [ ] Test `brand_settings.general.patch_rejects_email_field`: validado (ver nota de implementación).
- [ ] `pnpm typecheck` pasa.
- [ ] `pnpm quality-gates` verde.

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
