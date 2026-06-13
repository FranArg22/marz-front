# fn-31-feat-038-creator-settings-e2e-playwright.3 — E2E collaboration — tipos, intereses y canje (ESC-9 a ESC-12)

## Description

**Size:** M

Crea `src/test/e2e/suites/creator-settings/collaboration.spec.ts`. Cubre los 6 test_id de la sección Colaboraciones: tipos de creador, intereses/content types, bloqueo del sexto niche, y toggle de canje.

Fixture: `onboardedCreatorUser` de `src/test/e2e/support/fixtures.ts`.

### Tests a implementar

**`creator_settings.collaboration.save_creator_kinds`**
- Navegar a `/settings?section=colaboraciones`.
- Verificar heading `Colaboraciones` visible.
- Localizar los chips de tipo de creador (`Influencer`, `Creador UGC` o equivalente en la UI).
- Si alguno no está seleccionado, seleccionarlo. Si ambos están seleccionados, deseleccionar uno y re-seleccionarlo.
- Click en `Guardar`.
- `waitForResponse` de `PATCH /v1/creators/me/profile/collaboration` → status 200.
- Verificar botón `Guardar` deshabilitado tras guardar.

**`creator_settings.collaboration.block_empty_creator_kinds`**
- Navegar a `/settings?section=colaboraciones`.
- Deseleccionar todos los chips de tipo de creador hasta que ninguno esté activo.
- Verificar que la UI impide guardar (botón deshabilitado o mensaje de error al intentar guardar).
- Alternativa si la UI no deja deseleccionar el último: verificar que el último chip no se puede desactivar.

**`creator_settings.collaboration.edit_niches_content_types`**
- Navegar a `/settings?section=colaboraciones`.
- En la card de intereses, quitar un niche si hay más de 1 (para no quedar en 0).
- Agregar un niche buscando en el input de búsqueda (`getByPlaceholder(/intereses/i)` o similar) y seleccionando uno de los resultados.
- En la card de tipos de contenido, si hay más de 1, quitar uno.
- Click en `Guardar`.
- `waitForResponse` de `PATCH /v1/creators/me/profile/collaboration` → status 200.
- Verificar botón `Guardar` deshabilitado.

**`creator_settings.collaboration.block_zero_niche_or_content_type`**
- Navegar a `/settings?section=colaboraciones`.
- Quitar todos los niches uno por uno hasta que solo quede 1.
- Intentar quitar el último niche — verificar que la UI lo bloquea (niche no quitable o botón deshabilitado o error).
- Lo mismo para content types.

**`creator_settings.collaboration.block_sixth_niche`**
- Navegar a `/settings?section=colaboraciones`.
- Agregar niches via UI (buscar y clickear) hasta llegar a exactamente 5 niches. Si `onboardFull` ya siembra 5, saltear este setup.
  - Nota: `onboardFull('creator')` puede sembrar menos de 5. Agregar iterando hasta completar 5.
- Intentar agregar un sexto niche.
- Verificar que la UI bloquea la acción (el botón de agregar queda deshabilitado o aparece mensaje de límite máximo).

**`creator_settings.collaboration.toggle_barter_preference`**
- Navegar a `/settings?section=colaboraciones`.
- Localizar el toggle de canje (`getByRole('switch', { name: /canje/i })` o similar).
- Anotar el estado actual (on/off).
- Cambiar el estado (click en el toggle).
- Click en `Guardar`.
- `waitForResponse` de `PATCH /v1/creators/me/profile/collaboration` → status 200.
- Recargar y verificar que el nuevo estado del toggle persiste.
- Repetir: volver al estado original y guardar.

### Acceptance

- [ ] Los 6 test_id están implementados en `collaboration.spec.ts`
- [ ] `pnpm test:e2e --grep "Creator settings — collaboration"` pasa
- [ ] El test `block_sixth_niche` maneja el caso en que `onboardFull` ya siembra ≥5 niches
- [ ] Los tests de bloqueo verifican la UI (no solo que el API devuelve 422)

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
