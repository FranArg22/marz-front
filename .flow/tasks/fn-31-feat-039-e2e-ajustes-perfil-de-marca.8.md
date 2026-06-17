# fn-31-feat-039-e2e-ajustes-perfil-de-marca.8 E2E plan limits — modificar campaign-list-quota (ESC-20) e investigar offers gate (ESC-21)

## Description

Este task tiene dos sub-objetivos:

1. **ESC-20**: verificar que el test de cuota de campañas refleja el tope correcto del plan `starter` (`max_active_campaigns: 1`, no 5). El archivo ya existe.
2. **ESC-21**: investigar si el gate de `MaxActiveCreators` en el flujo de offers está conectado en el frontend, y si corresponde crear un test E2E o solo documentar como pendiente.

### Sub-tarea 1: ESC-20 — verificar `campaign-list-quota.spec.ts`

Leer `src/test/e2e/suites/campaigns/campaign-list-quota.spec.ts`.

El test actual ya usa `max_active_campaigns: 1` en el mock del endpoint `campaign-quota`. Verificar:
1. ¿El mock usa `max_active_campaigns: 1`? Si ya es 1, el test ya está correcto para ESC-20.
2. ¿El link "Ver planes" apunta a `/ajustes/suscripcion`? (ESC-20 requiere que el frontend redirija a la nueva ruta de suscripción, no a la antigua `/billing`.)

```bash
cat src/test/e2e/suites/campaigns/campaign-list-quota.spec.ts
```

Si `max_active_campaigns` ya es 1 y el href del link ya es `/ajustes/suscripcion`, agregar solo un comentario/test_id explícito `campaigns.create.plan_limit_reached` al test existente (renombrando el test o agregando un segundo test que verifique el texto del tooltip o el mensaje del gate).

Si el link apuntaba a `/billing` y fue cambiado a `/ajustes/suscripcion` en la implementación de FEAT-039, agregar un assert explícito: 

```typescript
await expect(page.getByRole('link', { name: 'Ver planes' })).toHaveAttribute('href', '/ajustes/suscripcion')
```

Si el test ya tiene este assert, el task se completa documentando que el assert ya pasaba.

### Sub-tarea 2: ESC-21 — investigar gate MaxActiveCreators en offers

Investigar si el flujo de creación de offers tiene un gate que compara contra `MaxActiveCreators` del plan. Pasos:

1. Buscar en el código del frontend si existe alguna verificación de cuota de creadores activos antes de enviar una offer:
```bash
grep -r "MaxActiveCreators\|active_creators\|creator.*limit\|creators_active" src/ --include="*.tsx" --include="*.ts" | grep -v test | grep -v generated
```

2. Revisar si hay un endpoint del backend que pre-verifica el límite (similar a `campaign-quota`):
```bash
grep -r "creator.quota\|creators-quota\|creator-limit" src/shared/api/generated/ | head -10
```

3. Si NO existe gate en el frontend:
   - Documentar en Done summary: "No existe gate de MaxActiveCreators en flujo de offers en el frontend. ESC-21 queda fuera del scope E2E frontend."
   - Agregar `test.skip` con TODO en el spec de offers (si existe `send-paid-offer.spec.ts` o similar):
   ```typescript
   test.skip('offers.create.creator_limit_reached (ESC-21)', async () => {
     // TODO: requiere gate de MaxActiveCreators en flujo de offers.
     // Confirmar con backend team si el gate existe en la API de offers.
     // Si existe API-side, el E2E debería mockear POST /v1/offers → 409 plan_limit_reached.
   })
   ```

4. Si SÍ existe un endpoint o gate:
   - Implementar el test en `src/test/e2e/suites/offers/` usando `page.route` para mockear `POST /v1/offers` → 409 con el código de error correcto.
   - Verificar que la UI muestra el error adecuado (toast, mensaje en el sidesheet).

### Verificación

```bash
cat src/test/e2e/suites/campaigns/campaign-list-quota.spec.ts
grep -r "MaxActiveCreators\|creators_active" src/ --include="*.tsx" --include="*.ts" | grep -v test | grep -v generated | head -20
pnpm test:e2e -- src/test/e2e/suites/campaigns/campaign-list-quota.spec.ts
pnpm typecheck
```

## Acceptance

- [ ] `campaign-list-quota.spec.ts` verificado: `max_active_campaigns: 1` y href `/ajustes/suscripcion` correcto.
- [ ] El test existente pasa (`pnpm test:e2e -- .../campaign-list-quota.spec.ts` verde).
- [ ] Si el test necesitaba ajuste: cambio mínimo documentado en Done summary.
- [ ] ESC-21 investigado: Done summary documenta si el gate existe en el frontend y qué se hizo (test implementado ó `test.skip` con TODO).
- [ ] `pnpm typecheck` pasa.
- [ ] `pnpm quality-gates` verde.

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
