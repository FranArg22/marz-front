# fn-30-feat-039-ajustes-perfil-de-marca.6 Cleanup /billing legacy + quality gates finales

## Description

> ESTA TAREA REQUIERE MIRAR EL DISEÑO — node_ids: `Oum8w`, `ZfsRN` (verificar que el sidebar final coincide)

Limpieza del código legacy de `/billing`, verificación de que no quedan componentes huérfanos, y correr los quality gates completos (`pnpm work:post`) para cerrar el epic.

## Pasos

### 1. Verificar huérfanos de `BillingPage`

Después del refactor de la task 4, `BillingPage` en `src/features/billing/components/BillingPage.tsx` fue reemplazada funcionalmente por `BillingSummary` + `SubscriptionSection`. Verificar qué importa `BillingPage`:

```bash
grep -r "BillingPage" src/ --include="*.tsx" --include="*.ts"
```

- Si solo lo importa `src/routes/_brand/billing.tsx` (que ya es un redirect): eliminar el import de `BillingPage` del route file (el redirect no lo necesita).
- Si algo más lo importa: evaluar si ese import debe actualizarse a `BillingSummary` o `SubscriptionSection`.
- Si `BillingPage` queda sin importadores: **no borrarlo**; quedará como thin wrapper hasta que se confirme que no hay tests o rutas que lo usen. Si `BillingPage.test.tsx` referencia funcionalidad movida a `BillingSummary`, actualizar el test para apuntar al nuevo componente.

### 2. Verificar ruta `/billing`

`src/routes/_brand/billing.tsx` debe ser solo el redirect (de task 2). Verificar que:
- No tiene loader ni `ensureQueryData`.
- No importa `BillingPage`.
- `src/routes/_brand/billing.test.ts` verifica el redirect a `/ajustes/suscripcion`.

### 3. Verificar sidebar sin item Billing duplicado

El sidebar `_brand` nunca tuvo un item `Billing` (existe `/billing` como ruta pero no aparecía en `navigation.ts`). Confirmar que la navegación final tiene:
- Item `Ajustes` (agregado en task 2) con `href='/ajustes'`.
- Sin item con `href='/billing'`.

### 4. Grep final de referencias

```bash
grep -r "routes/billing\|_brand/billing" src/ --include="*.tsx" --include="*.ts" | grep -v "\.test\." | grep -v "redirect"
```

Solo deben quedar la ruta redirect y sus tests. Si aparecen referencias a la ruta como destino de navegación (no redirect), actualizarlas a `/ajustes/suscripcion`.

### 5. `pnpm work:post` completo

Correr en orden (el script lo encadena automáticamente):
```bash
pnpm work:post
```

Que ejecuta:
1. `pnpm format` — prettier --write + eslint --fix.
2. `pnpm i18n:extract` — extrae keys nuevas.
3. `pnpm i18n:compile` — compila catálogos.
4. `pnpm quality-gates` — lint → check → typecheck → react-doctor → test → test:e2e → knip → check:api-direct → check:i18n-standards.

Si algún check falla: corregir la causa raíz. No bypassear con `eslint-disable`, `@ts-ignore`, o `--no-verify`.

**react-doctor target: ≥95/100.** Si cae por debajo, corregir los problemas reportados en los componentes nuevos de esta épica.

### 6. Commit final

Committear todo el diff limpio: cleanup de huérfanos, catálogos i18n actualizados, y cualquier fix de lint/format.

## Acceptance
- [ ] `grep -r "BillingPage" src/` no devuelve importaciones activas (solo el archivo propio y sus tests, si se decidió no eliminar el componente).
- [ ] `grep -r "routes/billing\|_brand/billing" src/ --include="*.tsx" --include="*.ts" | grep -v "\.test\." | grep -v "redirect"` devuelve vacío.
- [ ] Sidebar `_brand` tiene `Ajustes` y no tiene ningún item apuntando a `/billing`.
- [ ] `pnpm work:post` pasa completamente sin errores ni bypass.
- [ ] `pnpm react-doctor` reporta ≥95/100.
- [ ] Commit final creado con diff limpio.
- Verify: `pnpm work:post`

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
