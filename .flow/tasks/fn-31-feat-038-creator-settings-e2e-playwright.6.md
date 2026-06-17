# fn-31-feat-038-creator-settings-e2e-playwright.6 — E2E wallet — cuenta de cobro (ESC-19 a ESC-22)

## Description

**Size:** M

Crea `src/test/e2e/suites/creator-settings/wallet.spec.ts`. Cubre los 5 test_id de la sección Billetera.

Fixtures: `onboardedCreatorUser` y `onboardedBrandUser` de `src/test/e2e/support/fixtures.ts`.

Referencia de implementación de happy paths: `src/test/e2e/suites/identity/creator-settings.spec.ts` ya tiene un test de crear + editar cuenta (`creates a payout account and edits its account type`). Este spec **no modifica** ese archivo. Los tests aquí tienen distintos nombres y cubren escenarios adicionales (privacidad, cancelar modal).

Helpers del archivo existente que conviene reutilizar como funciones locales: `selectOption(page, label, option)` para selects y `openPayoutAccountModal(page)` para detectar si hay botón `Agregar cuenta de cobro` o `Editar`.

### Tests a implementar

**`creator_settings.wallet.add_payout_account`**
- Navegar a `/settings?section=billetera` como creator onboarded sin cuenta cargada.
  - Si `onboardFull` ya crea una cuenta, usar `page.request.delete(...)` o `PUT` para limpiarla primero — O simplemente verificar el estado actual y ajustar el flujo: si hay cuenta, este test pasa a verificar que existe el botón `Editar`; si no hay cuenta, verifica el botón `Agregar`.
  - Para garantizar estado vacío: al inicio del test, si existe el botón `Editar`, hacer `page.route('**/v1/creators/me/payout-account', ...)` para simular respuesta vacía. Alternativa más robusta: usar un helper que elimine la cuenta vía API de test si existe.
  - **Nota:** si no hay endpoint de test para limpiar la cuenta, el test puede crear una cuenta nueva (con valores únicos de este test run) y verificar el flujo de alta como si fuera la primera vez, confiando en que el estado post-test no afecte a otros.
- Abrir el modal con `Agregar cuenta de cobro` o equivalente.
- Verificar que el modal está visible con los campos: Tipo de cuenta (Banco / App externa), Titular, Proveedor/Banco, Identificador, País.
- Verificar texto fijo sobre USD (nota "Marz transfiere en USD" o similar).
- Completar: Tipo = `Banco`, Titular = `Test Creator`, Banco = `Banco Test`, Identificador = `test-alias-${Date.now()}`, País = `Argentina`.
- `waitForResponse` de `PUT /v1/creators/me/payout-account` → status 200.
- Verificar que el modal se cierra y aparece badge `Activa`.

**`creator_settings.wallet.reject_incomplete_payout_account`**
- Navegar a `/settings?section=billetera`.
- Abrir el modal de crear/editar cuenta.
- Dejar el campo Titular vacío.
- Click en `Guardar`.
- Verificar que aparece mensaje de error (Titular requerido u equivalente).
- Verificar que el modal permanece abierto.

**`creator_settings.wallet.cancel_modal_no_persist`**
- Navegar a `/settings?section=billetera`.
- Abrir el modal de crear/editar cuenta.
- Completar algún campo (ej. Titular = `No debe guardarse`).
- Click en `Cancelar` o cerrar el modal (click fuera o botón X).
- Verificar que el modal se cerró.
- Verificar que NO se llamó a `PUT /v1/creators/me/payout-account` (interceptar con `page.route` y verificar que no se activa, o simplemente verificar que `No debe guardarse` no aparece en la card).

**`creator_settings.wallet.replace_payout_account`**
- Navegar a `/settings?section=billetera` como creator onboarded.
- Si no existe una cuenta cargada, crear una primero siguiendo el flujo de `add_payout_account` (sin verificación extendida — solo cargar estado).
- Verificar card de cuenta activa con badge `Activa` y botón `Editar`.
- Click en `Editar`.
- Cambiar el tipo de cuenta (de `Banco` a `Aplicación o billetera virtual` o viceversa).
- Modificar el campo Proveedor/Identificador.
- `waitForResponse` de `PUT /v1/creators/me/payout-account` → status 200.
- Verificar que el modal se cierra y la card muestra el nuevo tipo.

**`creator_settings.wallet.payout_account_private`**
- Iniciar sesión como `onboardedBrandUser`.
- Importar `{ API_BASE_URL }` de `../../support/env` y `{ getClerkSessionToken }` de `../../support/fixtures`.
- Obtener el token del brand con `const token = await getClerkSessionToken(page)`.
- Llamar al endpoint directamente:
  ```typescript
  const res = await page.request.fetch(`${API_BASE_URL}/v1/creators/me/payout-account`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  expect(res.status()).toBe(403)
  ```
- Verificar que la respuesta contiene `"code": "not_creator"` o código de error equivalente.

### Acceptance

- [ ] Los 5 test_id están implementados en `wallet.spec.ts`
- [ ] `pnpm test:e2e --grep "Creator settings — wallet"` pasa
- [ ] `payout_account_private` hace un request directo a la API backend vía `API_BASE_URL` (no al frontend)
- [ ] `cancel_modal_no_persist` verifica que el PUT no se llama al cancelar
- [ ] `replace_payout_account` realiza una segunda operación PUT exitosa sobre la misma cuenta

## Done summary
Implemented fn-31-feat-038-creator-settings-e2e-playwright.6; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: