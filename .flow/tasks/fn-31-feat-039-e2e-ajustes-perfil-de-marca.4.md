# fn-31-feat-039-e2e-ajustes-perfil-de-marca.4 E2E brand-settings-general.spec.ts — logo upload, clear, S3 missing, no-diff

## Description

Agrega tests al archivo `src/test/e2e/suites/identity/brand-settings-general.spec.ts` (creado en T3). Cubre el flujo de logo upload (presign + PUT a S3 + PATCH), logo clear con fallback a inicial, S3 key missing rechazado, y no-diff no-event.

### Estrategia de mocking para logo upload

El flujo real es:
1. Frontend llama `POST /v1/brand-workspaces/me/logo:presign` → recibe `{ upload_url, s3_key }`
2. Frontend hace `PUT <upload_url>` directo a S3 (URL externa)
3. Frontend llama `PATCH /v1/brand-workspaces/me/settings` con `{ logo_s3_key }`

En E2E se mockean los tres pasos:

```typescript
const FAKE_S3_KEY = 'brand-logos/ws-test-id/e2e-test.png'
const FAKE_UPLOAD_URL = 'https://s3.amazonaws.com/test-bucket/test-upload'

// Mock presign
await page.route(/\/v1\/brand-workspaces\/me\/logo:presign$/, async (route) => {
  await route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ data: { upload_url: FAKE_UPLOAD_URL, s3_key: FAKE_S3_KEY, expires_at: '2099-01-01T00:00:00Z' } })
  })
})
// Mock S3 PUT
await page.route(FAKE_UPLOAD_URL, async (route) => {
  await route.fulfill({ status: 200 })
})
```

### Tests a implementar

#### Test 1: `brand_settings.general.logo_upload_preview` (ESC-4 parte 1)

- Mock GET /settings → `{ profile: {...}, brand: { name: 'Acme', website_url: 'https://acme.com', logo_url: null } }`
- Mock presign + S3 PUT como arriba
- Navegar a `/ajustes/general`
- Localizar el control de logo (leer `src/features/identity/settings/LogoUploader.tsx` para entender la UI — puede ser un `<input type="file">` oculto o un botón que lo dispara)
- Cargar un archivo PNG de prueba usando `page.setInputFiles(...)` en el input de tipo file
- Assertion: antes de guardar, aparece una preview de la imagen (tag `<img>` con `src` que no es la URL original — puede ser un `blob:` URL)

**Nota**: `LogoUploader.tsx` ya existe en `src/features/identity/settings/LogoUploader.tsx`. Leerlo primero para entender el input de file y cómo se renderiza la preview.

#### Test 2: `brand_settings.general.logo_upload_persists` (ESC-4 parte 2)

- Igual al anterior + mock PATCH capturando el body
- Click en guardar
- Assertions:
  - PATCH body contiene `logo_s3_key: FAKE_S3_KEY`
  - Toast "Ajustes guardados" visible
  - El presign fue llamado exactamente 1 vez
  - El PUT a S3 fue llamado exactamente 1 vez

#### Test 3: `brand_settings.general.logo_clear_falls_back_initial` (ESC-5)

- Mock GET → brand con `logo_url: 'https://cdn.example.com/brand-logos/ws-id/existing.png'`
- Mock PATCH → capturar body + responder 200 con `{ data: { ..., brand: { ..., logo_url: null } } }`
- Navegar a `/ajustes/general`
- Localizar el control de borrado de logo (botón de eliminar en `LogoUploader.tsx` — leer el componente)
- Click en borrar logo
- Click en guardar
- Assertions:
  - PATCH body contiene `logo_s3_key: null`
  - La preview muestra el fallback con inicial del nombre de marca (texto "A" para "Acme" o similar)
  - Toast visible

#### Test 4: `brand_settings.general.logo_s3_key_missing_rejected` (ESC-10)

- Mock GET → BASE_SETTINGS (logo_url null)
- Mock presign → responde con un `s3_key` cuyo objeto "no existe en S3" (el frontend no sabe esto; el rechazo viene del PATCH)
- Mock PATCH → responder 422 `{ error: { code: "validation_error", fields: { logo_s3_key: ["object_not_found"] } } }`
- Simular el upload: mock presign + mock S3 PUT ok + enviar PATCH
- Assertion: error inline para el campo logo (`object_not_found`)

**Implementación alternativa**: si el LogoUploader no tiene error handling visible para este campo, el error se puede verificar viendo que el toast de éxito NO aparece y que hay un mensaje de error (puede ser un banner o inline según el componente).

#### Test 5: `brand_settings.general.no_diff_no_event` (ESC-24)

- Mock GET → BASE_SETTINGS
- Interceptar PATCH para capturar si se llama o no
- Navegar a `/ajustes/general`
- Click en guardar SIN hacer cambios (botón debería estar disabled)
- Assertion: el botón está disabled y el PATCH NO fue llamado

**Nota**: la lógica de `GeneralSection.tsx` tiene `if (Object.keys(diff).length === 0) return` — el form ni siquiera llama al PATCH si no hay diff. Este test confirma que el botón está disabled cuando no hay cambios, lo que previene el envío.

### Leer LogoUploader antes de implementar

```bash
cat src/features/identity/settings/LogoUploader.tsx
```

Entender: ¿Hay un `<input type="file">` para seleccionar? ¿Cuál es el selector del botón de borrar? ¿Cómo se renderiza la preview?

### Verificación

```bash
pnpm test:e2e -- src/test/e2e/suites/identity/brand-settings-general.spec.ts --grep "logo|no.diff"
pnpm typecheck
```

## Acceptance

- [ ] Test `brand_settings.general.logo_upload_preview`: preview aparece antes de guardar.
- [ ] Test `brand_settings.general.logo_upload_persists`: PATCH con `logo_s3_key`, presign y S3 PUT llamados 1 vez cada uno.
- [ ] Test `brand_settings.general.logo_clear_falls_back_initial`: PATCH con `logo_s3_key: null`, fallback de inicial visible.
- [ ] Test `brand_settings.general.logo_s3_key_missing_rejected`: PATCH 422 con `object_not_found`, error inline visible.
- [ ] Test `brand_settings.general.no_diff_no_event`: botón save disabled sin cambios, PATCH no llamado.
- [ ] `LogoUploader.tsx` leído antes de implementar (selector de file input y botón borrar documentados en Done summary).
- [ ] `pnpm typecheck` pasa.
- [ ] `pnpm quality-gates` verde.

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
