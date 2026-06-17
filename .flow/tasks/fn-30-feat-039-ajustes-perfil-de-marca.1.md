# fn-30-feat-039-ajustes-perfil-de-marca.1 Commit del cliente API generado (openapi + identity + modelos FEAT-039)

## Description

`pnpm api:sync` ya se corrió y generó los archivos del cliente API para FEAT-039, pero todavía no están committeados (aparecen como `??` o `M` en `git status`). Esta task los verifica, compila y los committea.

## Archivos generados a committear

Archivos nuevos (`??`):
- `src/shared/api/generated/identity/` (directorio completo: `identity.ts`)
- `src/shared/api/generated/zod/identity/` (directorio completo)
- `src/shared/api/generated/model/brandSettingsBrand.ts`
- `src/shared/api/generated/model/brandSettingsProfile.ts`
- `src/shared/api/generated/model/brandSettingsResponse.ts`
- `src/shared/api/generated/model/checkoutSessionResponse.ts`
- `src/shared/api/generated/model/createCheckoutSessionRequest.ts`
- `src/shared/api/generated/model/createCheckoutSessionRequestInterval.ts`
- `src/shared/api/generated/model/createCheckoutSessionRequestPlan.ts`
- `src/shared/api/generated/model/logoPresignRequest.ts`
- `src/shared/api/generated/model/logoPresignResponse.ts`
- `src/shared/api/generated/model/logoPresignResponseRequiredHeaders.ts`
- `src/shared/api/generated/model/patchBrandSettingsRequest.ts`
- `src/shared/api/generated/model/planUsageInvitations.ts`
- `src/shared/api/generated/model/planUsageMetric.ts`
- `src/shared/api/generated/model/planUsageResponse.ts`

Archivos modificados (`M`):
- `openapi/spec.json`
- `src/shared/api/generated/billing/billing.ts`
- `src/shared/api/generated/model/index.ts`
- `src/shared/api/generated/zod/billing/billing.ts`

## Hooks que deben existir

Verificar antes de commitear que los siguientes exports existen en los archivos generados:

En `src/shared/api/generated/identity/identity.ts`:
- `usePresignBrandLogo` (mutation)
- `useGetBrandSettings` (query)
- `usePatchBrandSettings` (mutation)

En `src/shared/api/generated/billing/billing.ts`:
- `useGetPlanUsage` (query)
- `useCreateBillingCheckoutSession` (mutation)

## Pasos

1. Correr `pnpm typecheck` para verificar que los archivos generados compilan sin errores.
2. Si falla: NO editar `src/shared/api/generated/**` a mano. Revisar si `pnpm api:sync` tiene que correr de nuevo contra el backend dev en `http://localhost:35077`. Reportar bloqueo si el backend no está disponible.
3. Si pasa: committear todos los archivos listados arriba.
4. No tocar nada más en esta task.

## Acceptance
- [ ] `pnpm typecheck` pasa sin errores.
- [ ] `grep -R "usePresignBrandLogo" src/shared/api/generated/` devuelve matches.
- [ ] `grep -R "useGetBrandSettings" src/shared/api/generated/` devuelve matches.
- [ ] `grep -R "usePatchBrandSettings" src/shared/api/generated/` devuelve matches.
- [ ] `grep -R "useGetPlanUsage" src/shared/api/generated/` devuelve matches.
- [ ] `grep -R "useCreateBillingCheckoutSession" src/shared/api/generated/` devuelve matches.
- [ ] Cero ediciones manuales a `src/shared/api/generated/**` (el diff solo tiene archivos generados).
- [ ] Commit creado con todos los archivos generados.
- Verify: `pnpm typecheck`

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
