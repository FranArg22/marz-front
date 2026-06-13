# fn-31-feat-038-creator-settings-e2e-playwright.1 — E2E shell — sidebar y acceso brand (ESC-1, ESC-2)

## Description

**Size:** S

Crea el directorio `src/test/e2e/suites/creator-settings/` y el primer spec file `shell.spec.ts`. Este spec establece el patrón de imports y fixtures que usan los demás specs de esta feature.

Revisar el archivo existente `src/test/e2e/suites/identity/creator-settings.spec.ts` antes de empezar — contiene tests de rates/wallet/collaboration ya implementados. Esta task **no modifica** ese archivo; solo crea el nuevo directorio y spec.

### Fixture de setup

Usar `onboardedCreatorUser` (ya definido en `src/test/e2e/support/fixtures.ts`):
```typescript
import { test, expect } from '../../support/fixtures'
```

El fixture crea un creator con `onboardFull('creator')`: perfil completo, al menos un canal con tarifas, niches, y todos los campos del settings cargados. Para tests brand: usar `onboardedBrandUser`.

### Tests a implementar

**`creator_settings.shell.sidebar_five_sections`**
- Navegar a `/_creator/settings` (o `/settings?section=general`) como creator onboarded.
- Verificar que existen exactamente 5 entradas en la sidebar en este orden: `General`, `Colaboraciones`, `Redes y tarifas`, `Portfolio`, `Billetera`.
- Las etiquetas deben coincidir con el copy español.

**`creator_settings.shell.sections_prefilled`**
- Navegar a cada sección vía query param `?section=general`, `?section=colaboraciones`, `?section=redes-tarifas`, `?section=portfolio`, `?section=billetera`.
- En cada una verificar que al menos un campo visible muestra un valor no vacío (el perfil pre-existe por el fixture).
- Para `general`: verificar que el nombre o teléfono tiene valor. Para `redes-tarifas`: verificar que aparece al menos una label de canal o tarifa. No necesita valores exactos.

**`creator_settings.shell.brand_access_denied`**
- Iniciar sesión como `onboardedBrandUser` y navegar a `/settings?section=general`.
- Verificar que la URL resultante NO contiene `/settings` (el guard del route redirige). El patrón del test existente en `identity/creator-settings.spec.ts` verifica `await expect(page).toHaveURL(/\/workspace/)`.
- API: importar `{ API_BASE_URL }` de `../../support/env` y `{ getClerkSessionToken }` de `../../support/fixtures`. Obtener el token con `const token = await getClerkSessionToken(page)` y llamar:
  ```typescript
  const res = await page.request.fetch(`${API_BASE_URL}/v1/creators/me/settings`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  expect(res.status()).toBe(403)
  ```

### Acceptance

- [ ] Directorio `src/test/e2e/suites/creator-settings/` creado con `shell.spec.ts`
- [ ] Los 3 test_id están implementados como `test(...)` separados con nombres descriptivos
- [ ] `pnpm test:e2e --grep "Creator settings — shell"` pasa
- [ ] `page.route` no se usa para los happy paths (solo para el check 403 vía `page.request`)

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs: