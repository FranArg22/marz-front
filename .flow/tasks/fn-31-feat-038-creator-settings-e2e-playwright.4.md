# fn-31-feat-038-creator-settings-e2e-playwright.4 — E2E rates — canales, tarifas y UGC (ESC-13 a ESC-16)

## Description

**Size:** M

Crea `src/test/e2e/suites/creator-settings/rates.spec.ts`. Cubre los 5 test_id de la sección Redes y tarifas.

Fixture: `onboardedCreatorUser` de `src/test/e2e/support/fixtures.ts`.

Referencia de implementación de happy paths: `src/test/e2e/suites/identity/creator-settings.spec.ts` ya tiene un test similar (`saves edited channel and UGC rates`). Este spec **no modifica** ese archivo — crea tests con los test_id específicos del test plan y puede tener distinto alcance.

### Tests a implementar

**`creator_settings.rates.edit_channel_rate`**
- Navegar a `/settings?section=redes-tarifas`.
- Verificar heading `Redes y tarifas` visible.
- Localizar el primer input de tarifa de canal (`getByLabel(/Reel de Instagram|Video de TikTok|Short de YouTube/)` u otro label de formato).
- Modificar el valor a uno nuevo válido (ej. `150.00`).
- Click en `Guardar`.
- `waitForResponse` de `PUT /v1/creators/me/rates` → status 200.
- Recargar y verificar que el valor nuevo persiste en el input.

**`creator_settings.rates.reject_invalid_rate`**
- Navegar a `/settings?section=redes-tarifas`.
- Ingresar `0` en un campo de tarifa de canal.
- Verificar que la UI bloquea el guardado o muestra error de validación.
- Ingresar `-10` y verificar lo mismo.
- El botón `Guardar` debe permanecer deshabilitado o mostrar error si se presiona.

**`creator_settings.rates.format_platform_mismatch`**
- Este escenario valida que el backend rechaza un formato inválido para una plataforma (422 `invalid_for_platform`).
- Usar `page.route` para interceptar `PUT /v1/creators/me/rates` y responder con:
  ```json
  { "code": "validation_error", "fields": { "channel_rates[0].format": "invalid_for_platform" } }
  ```
- Ingresar cualquier tarifa válida, click en `Guardar`.
- Verificar que la UI muestra el mensaje de error (el texto del campo `message` del 422 o un mensaje genérico de error).
- Verificar que el botón `Guardar` sigue activo para reintentar.

**`creator_settings.rates.channels_read_only`**
- Navegar a `/settings?section=redes-tarifas`.
- Verificar que la card de redes conectadas muestra handles de canales como texto sin input editable.
- `expect(page.locator('[data-testid="channel-handle-input"]')).not.toBeAttached()` o similar — verificar que NO hay input para el handle.
- Si el canal tiene followers, verificar que los followers también se muestran como texto no editable.

**`creator_settings.rates.edit_ugc_rate`**
- Navegar a `/settings?section=redes-tarifas`.
- Localizar el input `Tarifa UGC` (`getByLabel('Tarifa UGC')` o similar).
- Ingresar `0` — verificar que es rechazado (validación client-side o al guardar).
- Ingresar un monto válido (ej. `200.00`).
- Click en `Guardar`.
- `waitForResponse` de `PUT /v1/creators/me/rates` → status 200 (el endpoint unificado incluye ugc_rate_amount).
- Recargar y verificar que persiste.

### Acceptance

- [ ] Los 5 test_id están implementados en `rates.spec.ts`
- [ ] `pnpm test:e2e --grep "Creator settings — rates"` pasa
- [ ] `format_platform_mismatch` usa `page.route` para simular la respuesta 422 del backend
- [ ] `channels_read_only` verifica ausencia de inputs editables para handle/followers
- [ ] `reject_invalid_rate` y `edit_ugc_rate` (paso de monto 0) verifican bloqueo en la UI

## Done summary
Implemented fn-31-feat-038-creator-settings-e2e-playwright.4; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: