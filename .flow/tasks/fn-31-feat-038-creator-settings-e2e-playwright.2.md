# fn-31-feat-038-creator-settings-e2e-playwright.2 — E2E general — contacto y avatar (ESC-3 a ESC-8)

## Description

**Size:** M

Crea `src/test/e2e/suites/creator-settings/general.spec.ts`. Cubre los 6 test_id de la sección General: edición de contacto, validaciones de cumpleaños y teléfono, email read-only, reemplazo de avatar y rechazo de avatar inválido.

Fixture: `onboardedCreatorUser` de `src/test/e2e/support/fixtures.ts`.

### Tests a implementar

**`creator_settings.general.save_contact_fields`**
- Navegar a `/settings?section=general` como creator onboarded.
- Verificar heading `General` visible.
- Leer el valor actual de algún campo editable (ej. campo de teléfono o ciudad).
- Modificarlo con un valor nuevo válido.
- Click en botón `Guardar` al fondo de la sección.
- `waitForResponse` que la llamada `PATCH /v1/creators/me/profile/contact` responda con status 200.
- Verificar que el botón `Guardar` queda deshabilitado (sin cambios pendientes).
- Recargar la página y verificar que el valor nuevo persiste.

**`creator_settings.general.reject_under_18`**
- Navegar a `/settings?section=general`.
- Buscar el input de fecha de cumpleaños.
- Ingresar una fecha que implica menos de 18 años (ej. `2015-01-01`).
- Click en `Guardar`.
- Verificar que aparece un mensaje de error sobre edad mínima (texto en español, no necesita match exacto — usar `/18|edad|menor/i`).
- Verificar que el botón `Guardar` sigue activo (la sección queda dirty para corregir).

**`creator_settings.general.reject_invalid_phone`**
- Navegar a `/settings?section=general`.
- Limpiar el campo de teléfono e ingresar un valor sin código de país (ej. `1122334455`).
- Click en `Guardar`.
- Verificar mensaje de error de formato de teléfono.

**`creator_settings.general.email_read_only`**
- Navegar a `/settings?section=general`.
- Localizar el campo email (puede ser `getByLabel('Email')` o `getByLabel('Correo')`).
- Verificar que está `disabled` o tiene atributo `readonly` (`expect(input).toBeDisabled()`).

**`creator_settings.general.replace_avatar`**
- Navegar a `/settings?section=general`.
- Localizar el input de tipo `file` para avatar (usar `page.locator('input[type="file"]')` o similar).
- Crear un Buffer pequeño de imagen PNG válida (1x1px, hardcodeado en el test):
  ```typescript
  // PNG 1x1 transparente mínimo (bytes hardcodeados)
  const pngBytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')
  await page.locator('input[type="file"]').setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: pngBytes })
  ```
- Click en `Guardar`.
- `waitForResponse` de `PUT /v1/creators/me/avatar` → status 200.
- Verificar que la imagen del avatar cambió (el src del `<img>` del avatar contiene una URL nueva, o simplemente que el request se completó sin error).

**`creator_settings.general.reject_invalid_avatar`**
- Navegar a `/settings?section=general`.
- Subir un archivo con extensión inválida (ej. un `.txt` con contenido "not an image"):
  ```typescript
  await page.locator('input[type="file"]').setInputFiles({ name: 'bad.txt', mimeType: 'text/plain', buffer: Buffer.from('not an image') })
  ```
- Modificar también un campo de contacto (ej. cambiar Ciudad a un valor nuevo) para verificar atomicidad: si el avatar falla, el contacto tampoco se guarda.
- Click en `Guardar`.
- Verificar que aparece un mensaje de error en la UI (puede ser client-side antes de hacer request).
- Verificar que NO se llamó a `POST /v1/onboarding/creator/avatar:presign` ni a `PATCH /v1/creators/me/profile/contact`. Usar `page.route('**/v1/creators/me/profile/contact', ...)` para interceptar y verificar que nunca se activa, o verificar que ambos requests están ausentes.
- Recargar la página y verificar que ni el avatar ni el campo de contacto cambiaron (no hubo guardado parcial).

### Acceptance

- [ ] Los 6 test_id están implementados en `general.spec.ts`
- [ ] `pnpm test:e2e --grep "Creator settings — general"` pasa
- [ ] El test de replace_avatar usa `setInputFiles` con buffer PNG real (no mock de API)
- [ ] Los tests de rechazo (cumpleaños, teléfono, avatar inválido) verifican mensajes de error en la UI
- [ ] `reject_invalid_avatar` verifica atomicidad: avatar inválido bloquea también el guardado de contacto (no hay cambio parcial)

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs: