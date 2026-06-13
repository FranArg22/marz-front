# fn-30-feat-038-creator-profile-edit-frontend.7 — E2E integral + estados de error

## Description

**Size:** L

Suite E2E de la pantalla `/_creator/settings` en `src/test/e2e/suites/identity/creator-settings.spec.ts`.

Cubre los flujos principales, los estados de error del `SectionSaveBar`, y una pasada de accesibilidad.

### Estructura

Usar `test.describe` agrupado por sección. Importar `test, expect` desde `../../support/fixtures`.

```ts
import { test, expect } from '../../support/fixtures'
// onboardedCreatorUser fixture para autenticación
```

### Flujos a cubrir

#### Flujo A — Tarifa (RatesSection)

```
1. onboardedCreatorUser.signIn(page)
2. page.goto('/settings?section=redes-tarifas')
3. Editar el monto del primer canal visible
4. Editar tarifa UGC
5. Click "Guardar"
6. Verificar toast de éxito o que el form pasa a no-dirty
7. Reload → valores persistidos
```

#### Flujo B — Cuenta de cobro (WalletSection)

```
1. onboardedCreatorUser.signIn(page)
2. page.goto('/settings?section=billetera')
3. Empty state → click "Agregar cuenta de cobro"
4. Completar los 4 campos + tipo "Banco"
5. Click "Guardar" en el modal
6. Modal cierra; PayoutAccountCard muestra resumen + badge Activa
7. Click "Editar" → modal abre con valores actuales precargados
8. Cambiar account_type a "Aplicación o billetera virtual"
9. Click "Guardar"
10. Card muestra nuevo tipo
```

#### Flujo C — Error de guardado en SectionSaveBar

```
1. onboardedCreatorUser.signIn(page)
2. page.goto('/settings?section=colaboraciones')
3. Modificar un campo (toggle barter)
4. Interceptar el PATCH /v1/creators/me/profile/collaboration → responder 500
5. Click "Guardar"
6. SectionSaveBar muestra mensaje de error
7. Form permanece dirty (botón Guardar habilitado para reintentar)
8. Quitar el intercept
9. Click "Guardar" de nuevo → éxito
```

Para la intercepción de errores usar `page.route(...)` de Playwright.

#### Flujo D — Validación de accesibilidad (axe)

```
1. Navegar a /settings?section=general
2. Correr axe-core → 0 violaciones críticas
3. Navegar a /settings?section=billetera → abrir modal
4. Correr axe-core → 0 violaciones críticas en el modal
```

Si axe no está configurado en el proyecto, instalarlo:
```bash
pnpm add -D axe-playwright axe-core
```
Y usar `checkA11y` de `axe-playwright` o `AxeBuilder` de `@axe-core/playwright`.

Verificar primero si el proyecto ya tiene axe configurado:
```bash
grep -rn "axe\|checkA11y\|AxeBuilder" src/test/e2e/ --include="*.ts"
```

### POM sugerido

Si se crean más de 3 interacciones de la misma pantalla, extraer a `src/test/e2e/poms/creator-settings.pom.ts`. No es obligatorio para esta task si los tests son simples.

### Consideraciones

- Los tests E2E requieren backend dev activo (`pnpm dev`). Si la CI no tiene el backend disponible, agregar `test.skip(!process.env.BACKEND_AVAILABLE, 'requires backend dev')`.
- Los flujos A y B dependen de datos iniciales del creator onboardado. Si el creator de test ya tiene rates/cuenta, adaptar el flujo para "editar" en vez de "crear desde cero".

## Acceptance

- [ ] `src/test/e2e/suites/identity/creator-settings.spec.ts` existe y pasa `pnpm test:e2e`.
- [ ] Flujo A (tarifas): monto editado + guardado → recarga → valor persistido.
- [ ] Flujo B (cuenta de cobro): alta + edición de tipo → card muestra estado actualizado.
- [ ] Flujo C (error): intercept 500 → SectionSaveBar muestra error + form dirty; retry → éxito.
- [ ] Flujo D (a11y): 0 violaciones críticas en General + en modal de Billetera.
- [ ] Brand en `/_creator/settings` → redirect (guard del group).
- [ ] `pnpm typecheck` verde.

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
