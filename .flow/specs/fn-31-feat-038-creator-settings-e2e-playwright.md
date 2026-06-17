# fn-31-feat-038-creator-settings-e2e-playwright — FEAT-038 Creator Settings — E2E Playwright

## Overview

Tests E2E Playwright para la pantalla `/_creator/settings` (Ajustes del creator). Cubre las 28 combinaciones test_id del test plan distribuidas en 6 spec files (una por sección de la pantalla) más un spec para la matriz de auth.

La implementación de la pantalla está completa (epic fn-30 cerrado). Estos tests verifican el comportamiento real de la UI contra el backend de dev.

## Scope

**In:**
- 6 spec files nuevos en `src/test/e2e/suites/creator-settings/` (shell, general, collaboration, rates, portfolio, wallet)
- 1 spec para la matriz de auth (`api.spec.ts`)
- Los 28 test_id declarados en el test plan (todos `action: create`)
- Fixture setup vía `onboardedCreatorUser` y `onboardedBrandUser` existentes en `src/test/e2e/support/fixtures.ts`
- Tests de validación usando route mocking (`page.route`) para forzar respuestas 4xx

**Out:**
- Modificar tests existentes en `src/test/e2e/suites/identity/creator-settings.spec.ts`
- Backend, API, DB

## Approach

7 tasks, una por spec file. Task .1 crea el directorio y el patrón de import; las tasks .2–.6 pueden ejecutarse en paralelo; task .7 (auth matrix) usa `page.request` y se puede hacer en paralelo también.

## Quick commands

```bash
pnpm test:e2e                              # playwright completo
pnpm test:e2e --grep "Creator settings"   # solo los tests nuevos
```

## Acceptance

- [ ] Los 28 test_id tienen implementación en algún spec file
- [ ] `pnpm test:e2e` verde en CI
- [ ] No se duplican tests existentes de `identity/creator-settings.spec.ts`
