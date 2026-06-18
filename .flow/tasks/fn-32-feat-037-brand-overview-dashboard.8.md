# fn-32-feat-037-brand-overview-dashboard.8 EmptyBlockState + ErrorBlockState + invalidaciones cross-feature

## Description

Estados vacío y error para los bloques del dashboard, más invalidaciones de queries desde mutations de otras features. Sin UI de diseño en el `.pen` para los estados vacío/error — implementar según convención del DS existente (ver otros estados del repo).

## Archivos a crear / modificar

### `src/features/analytics/dashboard/EmptyBlockState.tsx` (nueva)

Estado vacío por bloque. Mensaje "Sin datos para estos filtros" + botón "Limpiar filtros".

```tsx
interface EmptyBlockStateProps {
  onClear: () => void  // callback para resetear filtros a defaults en URL
}
```

El callback `onClear` navega con:
```ts
navigate({ search: () => ({
  campaign_ids: [],
  creator_ids: [],
  platforms: [],
  countries: [],
  status: 'active' as const,
  range_preset: '14d' as const,
  range_start: undefined,
  range_end: undefined,
  chart_series: ['oferta', 'vistas'] as const,
  chart_grouping: 'day' as const,
  top_videos_sort: 'views' as const,
  top_creators_sort: 'views' as const,
}) })
```

### `src/features/analytics/dashboard/ErrorBlockState.tsx` (nueva)

Estado de error por bloque. Mensaje "Algo salió mal" + botón "Reintentar".

```tsx
interface ErrorBlockStateProps {
  onRetry: () => void  // callback que llama .refetch() del query del bloque
}
```

El error de un bloque no afecta a los demás (cada bloque maneja su propio estado).

### Conectar estados en los bloques existentes

Reemplazar los placeholders de error/empty creados en tasks anteriores:

En `MetricsGrid.tsx`:
```tsx
if (isError) return <ErrorBlockState onRetry={onRetry} />
// onRetry viene de la prop o de cardsQuery.refetch() pasado desde DashboardPage
```

En `PerformanceChart.tsx`:
```tsx
if (isError) return <ErrorBlockState onRetry={onRetry} />
if (!isLoading && (!data || data.buckets.length === 0)) return <EmptyBlockState onClear={onClear} />
```

En `TopVideosTable.tsx` (cuando `videos.length === 0`):
```tsx
return <EmptyBlockState onClear={onClear} />
```
```tsx
if (isError) return <ErrorBlockState onRetry={onRetry} />
```

En `TopCreatorsTable.tsx`: ídem.

En `OnboardingChecklist.tsx` (cuando `isError`):
```tsx
return <ErrorBlockState onRetry={onRetry} />
```

Actualizar las interfaces de cada componente para incluir `onRetry: () => void` y `onClear: () => void` donde corresponda. En `DashboardPage.tsx`, pasar los callbacks:
```tsx
<MetricsGrid
  ...
  onRetry={cardsQuery.refetch}
/>
<PerformanceChart
  ...
  onRetry={chartQuery.refetch}
  onClear={handleClearFilters}
/>
// etc.
```

### Invalidaciones cross-feature

Buscar estas mutations en el proyecto y agregarles `queryClient.invalidateQueries()` en su `onSuccess`:

1. **`useCreateCampaignMutation`** en `src/features/campaigns/wizard/mutations.ts`: invalidar `getGetAnalyticsDashboardCardsQueryKey()`, `getGetAnalyticsDashboardChartQueryKey()`, `getGetAnalyticsDashboardTopVideosQueryKey()`, `getGetAnalyticsDashboardTopCreatorsQueryKey()`, `getGetAnalyticsDashboardOnboardingChecklistQueryKey()`, `getGetBrandWorkspaceLandingTargetQueryKey()`.

2. **`useApproveDraftMutation`** en `src/features/deliverables/api/draftUpload.ts`: invalidar `getGetAnalyticsDashboardOnboardingChecklistQueryKey()`.

3. **Callback de retorno de Stripe** en `src/routes/_brand/checkout-return.tsx`: invalidar `getGetAnalyticsDashboardCardsQueryKey()`, `getGetAnalyticsDashboardChartQueryKey()`.

Verificación de nombres:
```bash
grep -n "export function useCreateCampaignMutation" src/features/campaigns/wizard/mutations.ts
grep -n "export function useApproveDraftMutation" src/features/deliverables/api/draftUpload.ts
```

Importar los query key helpers de `#/shared/api/generated/analytics/analytics` y `#/shared/api/generated/identity/identity`.

## Tests

`src/features/analytics/dashboard/EmptyBlockState.test.tsx`:
- Render muestra "Sin datos para estos filtros".
- Click en "Limpiar filtros" → llama `onClear`.
- A11y: botón con texto visible.

`src/features/analytics/dashboard/ErrorBlockState.test.tsx`:
- Render muestra mensaje de error.
- Click en "Reintentar" → llama `onRetry`.
- A11y: botón con texto visible.

Tests de integración de invalidaciones (en los archivos de test de las mutations existentes):
- Crear campaign → `getGetAnalyticsDashboardOnboardingChecklistQueryKey()` aparece en `queryClient.invalidateQueries()` calls.

## Acceptance

- [ ] Error en `/cards` → `ErrorBlockState` solo en ese bloque; chart/checklist/tablas siguen funcionando.
- [ ] Error en `/chart` → `ErrorBlockState` solo en chart.
- [ ] Vacío en `/top-videos` → `EmptyBlockState` con botón "Limpiar filtros".
- [ ] Botón "Limpiar filtros" → URL resetea todos los filtros a defaults.
- [ ] Botón "Reintentar" → refetch del query del bloque correspondiente.
- [ ] Crear campaign → onboarding checklist se actualiza (query invalidado).
- [ ] Aprobar draft → onboarding checklist se actualiza.
- [ ] `pnpm typecheck && pnpm vitest run src/features/analytics/dashboard/EmptyBlock src/features/analytics/dashboard/ErrorBlock` pasan.
- [ ] `pnpm quality-gates` pasa (lint, typecheck, tests, react-doctor, knip).
- Verify: `pnpm quality-gates`

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs: