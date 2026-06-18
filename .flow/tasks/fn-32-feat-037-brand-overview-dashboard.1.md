# fn-32-feat-037-brand-overview-dashboard.1 Commit del cliente API generado (FEAT-037)

## Description

`pnpm api:sync` ya se corrió y generó los archivos del cliente API para FEAT-037, pero todavía no están committeados (aparecen como `??` o `M` en `git status`). Esta task los verifica, compila y los committea.

## Archivos generados a committear

Archivos nuevos (`??`):
- `src/shared/api/generated/model/dashboardCard.ts`
- `src/shared/api/generated/model/dashboardCardDelta.ts`
- `src/shared/api/generated/model/dashboardCardDeltaDirection.ts`
- `src/shared/api/generated/model/dashboardCardDeltaKind.ts`
- `src/shared/api/generated/model/dashboardCardKey.ts`
- `src/shared/api/generated/model/dashboardCardType.ts`
- `src/shared/api/generated/model/dashboardCardsResponse.ts`
- `src/shared/api/generated/model/dashboardChartBucket.ts`
- `src/shared/api/generated/model/dashboardChartOfferRef.ts`
- `src/shared/api/generated/model/dashboardChartResponse.ts`
- `src/shared/api/generated/model/dashboardChartResponseGrouping.ts`
- `src/shared/api/generated/model/dashboardChartSeriesGasto.ts`
- `src/shared/api/generated/model/dashboardChartSeriesOferta.ts`
- `src/shared/api/generated/model/dashboardChartSeriesVistas.ts`
- `src/shared/api/generated/model/dashboardRangeMeta.ts`
- `src/shared/api/generated/model/dashboardTopCreator.ts`
- `src/shared/api/generated/model/dashboardTopCreatorsResponse.ts`
- `src/shared/api/generated/model/dashboardTopCreatorsResponseSortBy.ts`
- `src/shared/api/generated/model/dashboardTopVideo.ts`
- `src/shared/api/generated/model/dashboardTopVideoCreatorRef.ts`
- `src/shared/api/generated/model/dashboardTopVideoPlatform.ts`
- `src/shared/api/generated/model/dashboardTopVideosResponse.ts`
- `src/shared/api/generated/model/dashboardTopVideosResponseSortBy.ts`
- `src/shared/api/generated/model/getAnalyticsDashboardCardsParams.ts`
- `src/shared/api/generated/model/getAnalyticsDashboardCardsPlatformsItem.ts`
- `src/shared/api/generated/model/getAnalyticsDashboardCardsStatus.ts`
- `src/shared/api/generated/model/getAnalyticsDashboardChartGrouping.ts`
- `src/shared/api/generated/model/getAnalyticsDashboardChartParams.ts`
- `src/shared/api/generated/model/getAnalyticsDashboardChartPlatformsItem.ts`
- `src/shared/api/generated/model/getAnalyticsDashboardChartSeriesItem.ts`
- `src/shared/api/generated/model/landingTargetResponse.ts`
- `src/shared/api/generated/model/landingTargetResponseTarget.ts`
- `src/shared/api/generated/model/onboardingChecklistItem.ts`
- `src/shared/api/generated/model/onboardingChecklistItemKey.ts`
- `src/shared/api/generated/model/onboardingChecklistProgress.ts`
- `src/shared/api/generated/model/onboardingChecklistResponse.ts`

Archivos modificados (`M`):
- `openapi/spec.json`
- `src/shared/api/generated/analytics/analytics.ts`
- `src/shared/api/generated/identity/identity.ts`
- `src/shared/api/generated/model/index.ts`
- `src/shared/api/generated/zod/analytics/analytics.ts`
- `src/shared/api/generated/zod/identity/identity.ts`

## Hooks a verificar antes de commitear

En `src/shared/api/generated/analytics/analytics.ts`:
- `useGetAnalyticsDashboardCards`
- `useGetAnalyticsDashboardChart`
- `useGetAnalyticsDashboardTopVideos`
- `useGetAnalyticsDashboardTopCreators`
- `useGetAnalyticsDashboardOnboardingChecklist`
- `getGetAnalyticsDashboardCardsQueryKey`
- `getGetAnalyticsDashboardOnboardingChecklistQueryKey`

En `src/shared/api/generated/identity/identity.ts`:
- `useGetBrandWorkspaceLandingTarget`
- `getGetBrandWorkspaceLandingTargetQueryKey`

## Pasos

1. `pnpm typecheck` para verificar que los archivos generados compilan sin errores.
2. Si falla: NO editar `src/shared/api/generated/**` a mano. Verificar si hay algún conflicto de tipos. Reportar bloqueo si es necesario correr `pnpm api:sync` de nuevo (backend en `http://localhost:45741`).
3. Si pasa: committear todos los archivos listados arriba.
4. No tocar nada más en esta task.

## Acceptance

- [ ] `pnpm typecheck` pasa sin errores.
- [ ] `grep -c "useGetAnalyticsDashboardCards" src/shared/api/generated/analytics/analytics.ts` devuelve ≥1.
- [ ] `grep -c "useGetBrandWorkspaceLandingTarget" src/shared/api/generated/identity/identity.ts` devuelve ≥1.
- [ ] Cero ediciones manuales a `src/shared/api/generated/**` (el diff solo contiene archivos generados + `openapi/spec.json`).
- [ ] Commit creado con todos los archivos generados.
- Verify: `pnpm typecheck`

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
