# fn-32-feat-037-brand-overview-dashboard FEAT-037 Brand Overview Dashboard (Frontend)

## Overview

Pantalla home del brand product (`/inicio`). Cinco bloques de datos cargando en paralelo: 8 métricas con delta híbrido, gráfico de performance temporal, checklist de onboarding, top 5 videos y top 5 creators. Filtros globales persistidos en URL (single source of truth, no Zustand).

## Scope

- Nueva ruta `_brand/inicio.tsx` con `validateSearch` Zod completo.
- Redirect post-login modificado en `src/routes/index.tsx`: brand → llama `landing-target`, va a `/inicio` o `/campaigns/new`.
- Item `Inicio` añadido al sidebar brand en `navigation.ts`.
- Feature folder: `src/features/analytics/dashboard/`.
- Commit del cliente API generado por `pnpm api:sync` (ya en git status sin commitear).

## Approach

1. Commit de archivos generados (`api:sync` ya corrido vs backend dev).
2. Routing + sidebar + redirect condicional.
3. Shell `DashboardPage` + `DashboardFilters` + `DashboardDateRangePicker` (filtros → URL).
4. `MetricsGrid` + `MetricCard` (8 cards, delta, tooltip, ícono info).
5. `OnboardingChecklist` (barra + 6 items, desaparece si `completed=true`).
6. `PerformanceChart` + `ChartSeriesChips` + `ChartConfigPopover` (recharts, 2 ejes Y).
7. `TopVideosTable` + `TopCreatorsTable` (shadcn, sort → URL).
8. `EmptyBlockState` + `ErrorBlockState` + invalidaciones cross-feature.

## Hooks generados clave (en `src/shared/api/generated/analytics/analytics.ts`)

- `useGetAnalyticsDashboardCards(params, options)` — staleTime 60s
- `useGetAnalyticsDashboardChart(params, options)` — staleTime 300s
- `useGetAnalyticsDashboardTopVideos(params, options)` — staleTime 300s
- `useGetAnalyticsDashboardTopCreators(params, options)` — staleTime 300s
- `useGetAnalyticsDashboardOnboardingChecklist(options)` — staleTime 600s
- `useGetBrandWorkspaceLandingTarget(options)` — staleTime 3600s (en identity.ts)

## Plan tier

`getWorkspacePlan(useBrandSession().brandWorkspace.plan) === 'free'` → deshabilita rangos 14d/30d/custom.
Patrón existente: `src/features/offers/utils/workspacePlan`.

## Gráfico

No hay librería de charts en el proyecto. Instalar `recharts` con `pnpm add recharts` (la task F.6 lo hace). Usar `LineChart` con dos ejes Y, eje X con fechas.

## Quick commands

- `pnpm typecheck`
- `pnpm quality-gates`
- `pnpm vitest run src/features/analytics`

## Acceptance

- [ ] Ruta `/inicio` renderiza con datos del backend.
- [ ] Redirect post-login brand → `/inicio` (con campañas) o `/campaigns/new` (sin campañas).
- [ ] Sidebar muestra item "Inicio" como primer item brand.
- [ ] 5 queries cargan en paralelo; error en una no rompe las demás.
- [ ] Filtros actualizan URL y disparan refetch.
- [ ] `pnpm quality-gates` pasa.

## References

- Pen file: `marz-docs/features/FEAT-037-brand-overview-dashboard/feat37.pen`
- Screens: `zPC6O` (light) / `OwCbG` (dark)
- `src/features/identity/app-shell/navigation.ts` — sidebar config
- `src/routes/index.tsx` — redirect post-login actual (brand → `/campaigns`)
