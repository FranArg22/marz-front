# fn-31-feat-038-creator-settings-e2e-playwright.5 — E2E portfolio — videos de muestra (ESC-17, ESC-18)

## Description

**Size:** S

Crea `src/test/e2e/suites/creator-settings/portfolio.spec.ts`. Cubre los 2 test_id de la sección Portfolio.

Fixture: `onboardedCreatorUser` de `src/test/e2e/support/fixtures.ts`.

La sección Portfolio siempre muestra exactamente 3 slots de video. Un slot con URL es `cargado`; sin URL es `pendiente`.

### Tests a implementar

**`creator_settings.portfolio.manage_sample_videos`**
- Navegar a `/settings?section=portfolio`.
- Verificar heading `Portfolio` visible.
- Verificar que hay exactamente 3 slots visibles (por ejemplo, con `expect(page.locator('[data-testid^="video-slot"]')).toHaveCount(3)` o similar basado en la estructura real de la UI).
- Ingresar una URL válida (`https://youtu.be/test-video-1`) en el primer slot pendiente (un input vacío).
- Si existe un slot con URL ya cargada, reemplazar su URL por `https://youtu.be/test-video-2`.
- Si existe otro slot cargado, hacer click en el botón `Quitar link` para vaciarlo.
- Click en `Guardar`.
- `waitForResponse` de `PUT /v1/creators/me/sample-videos` → status 200.
- Verificar que el botón `Guardar` queda deshabilitado.
- Recargar y verificar que los slots reflejan los cambios (el slot vacío queda en pendiente, los otros muestran las URLs nuevas).

**`creator_settings.portfolio.reject_invalid_url`**
- Navegar a `/settings?section=portfolio`.
- Ingresar un texto que no es URL (`no-es-una-url`) en un slot vacío.
- Click en `Guardar`.
- Verificar que aparece un mensaje de error de URL inválida.
- Verificar que el botón `Guardar` sigue activo o que la acción fue bloqueada.
- Verificar que NO se llamó a `PUT /v1/creators/me/sample-videos` (usar `page.route` para interceptar y verificar que no recibe la llamada, o que la responde con 422 y verificar el error en UI).

### Acceptance

- [ ] Los 2 test_id están implementados en `portfolio.spec.ts`
- [ ] `pnpm test:e2e --grep "Creator settings — portfolio"` pasa
- [ ] `manage_sample_videos` realiza las 3 operaciones: agregar, reemplazar, quitar
- [ ] `reject_invalid_url` verifica el error de validación en la UI

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
