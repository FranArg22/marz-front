# fn-31-feat-039-e2e-ajustes-perfil-de-marca.2 E2E brand-settings-shell.spec.ts — shell, sidebar, access denied, legacy redirect

## Description

Crea `src/test/e2e/suites/identity/brand-settings-shell.spec.ts`. Cubre el shell de Ajustes: sidebar con dos tabs, redirect default a `/ajustes/general`, acceso denegado para creator, y redirect legacy `/billing → /ajustes/suscripcion`.

### Setup compartido

Todos los tests usan `onboardedBrandUser` (o `onboardedCreatorUser` para ESC-2). Patrón base:

```typescript
import { test, expect } from '../../support/fixtures'

test.describe('brand settings shell', () => {
  // tests aquí
})
```

### Tests a implementar

#### Test 1: `brand_settings.shell.sidebar_two_sections` (ESC-1)

- Setup: `onboardedBrandUser`
- Acción: navegar a `/ajustes/general`
- Assertions:
  - `page.getByTestId('settings.nav.general')` es visible
  - `page.getByTestId('settings.nav.subscription')` es visible
  - No hay más de 2 links de navegación en el nav de settings (usar `getByRole('navigation', { name: /Secciones de ajustes/i }).getByRole('link')` y verificar `count() === 2`)
  - El link General tiene `aria-current="page"`

#### Test 2: `brand_settings.shell.general_is_default` (ESC-1)

- Setup: `onboardedBrandUser`
- Acción: navegar a `/ajustes` (sin subruta)
- Assertion: `page.url()` contiene `/ajustes/general` (redirect automático del router)

#### Test 3: `brand_settings.shell.creator_access_denied` (ESC-2)

- Setup: `onboardedCreatorUser`
- Acción: `page.goto('/ajustes')` (la ruta está bajo `_brand` que tiene guard)
- Assertion: `page.url()` NO contiene `/ajustes` — el guard redirige a otra ruta (onboarding, creator home, o similar). Verificar que el creator no puede aterrizar en ajustes de marca.
- Nota: el guard de `_brand` está en `src/routes/_brand.tsx` (o similar); verificar el redirect real antes de escribir el assert. Si redirige a `/`, a `/onboarding/creator`, o a `/conversaciones`, ajustar el expect al destino real.

#### Test 4: `brand_settings.subscription.legacy_billing_redirect` (ESC-25)

- Setup: `onboardedBrandUser`
- Acción: `page.goto('/billing')`
- Assertion: `page.url()` contiene `/ajustes/suscripcion`

### Cómo encontrar el redirect real del guard _brand

Antes de escribir el test del creator, leer `src/routes/_brand.tsx` (o `src/routes/_brand/index.tsx`) para ver el `beforeLoad` que protege el group. El redirect exacto está ahí.

```bash
cat src/routes/_brand.tsx
# Si no existe:
find src/routes -name "_brand.tsx" -o -name "_brand.ts" | head -5
```

### Verificación

```bash
pnpm test:e2e -- src/test/e2e/suites/identity/brand-settings-shell.spec.ts
pnpm typecheck
```

## Acceptance

- [ ] Existe `src/test/e2e/suites/identity/brand-settings-shell.spec.ts`.
- [ ] Test `brand_settings.shell.sidebar_two_sections`: verifica 2 nav links, General activo.
- [ ] Test `brand_settings.shell.general_is_default`: navegar a `/ajustes` redirige a `/ajustes/general`.
- [ ] Test `brand_settings.shell.creator_access_denied`: creator no puede acceder a `/ajustes`.
- [ ] Test `brand_settings.subscription.legacy_billing_redirect`: `/billing` redirige a `/ajustes/suscripcion`.
- [ ] Todos los tests usan `data-testid` de T1 (`settings.nav.general`, `settings.nav.subscription`).
- [ ] `pnpm typecheck` pasa.
- [ ] `pnpm quality-gates` verde.

## Done summary
Implemented fn-31-feat-039-e2e-ajustes-perfil-de-marca.2; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: