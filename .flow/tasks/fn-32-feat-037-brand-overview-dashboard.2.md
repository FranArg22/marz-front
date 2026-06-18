# fn-32-feat-037-brand-overview-dashboard.2 Routing + landing redirect + sidebar

## Description

> ESTA TAREA REQUIERE MIRAR EL DISEÑO — node_ids: `x2nTSR` (sidebar light), `Ms8fL` (sidebar dark)

Tres cambios:
1. Nueva ruta `/inicio` en `src/routes/_brand/inicio.tsx` — esqueleto vacío (solo el shell; el contenido va en las tasks siguientes).
2. Redirect post-login brand en `src/routes/index.tsx`: actualmente hardcodea `'/campaigns'`; cambia a llamar el endpoint `landing-target` y redirigir a `/inicio` o `/campaigns/new`.
3. Item `Inicio` en el sidebar brand en `src/features/identity/app-shell/navigation.ts`.

Antes de implementar el sidebar, leer el diseño:
```
pencil interactive --in marz-docs/features/FEAT-037-brand-overview-dashboard/feat37.pen --out /tmp/marz-feat037-read.pen
pencil > batch_get({ nodeIds: ["x2nTSR", "Ms8fL"], readDepth: 2, resolveVariables: true })
pencil > exit()
```

## Archivos a crear / modificar

### 1. `src/routes/_brand/inicio.tsx` (nueva)

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const dashboardSearchSchema = z.object({
  campaign_ids: z.array(z.string().uuid()).optional().default([]),
  creator_ids: z.array(z.string().uuid()).optional().default([]),
  platforms: z.array(z.enum(['instagram', 'tiktok', 'youtube'])).optional().default([]),
  countries: z.array(z.string().length(2)).optional().default([]),
  status: z.enum(['active', 'inactive', 'all']).optional().default('active'),
  range_preset: z.enum(['7d', '14d', '30d', 'custom']).optional().default('14d'),
  range_start: z.string().optional(),
  range_end: z.string().optional(),
  chart_series: z.array(z.enum(['oferta', 'vistas', 'gasto'])).optional().default(['oferta', 'vistas']),
  chart_grouping: z.enum(['day', 'week', 'month']).optional().default('day'),
  top_videos_sort: z.enum(['views', 'cpm', 'engagement']).optional().default('views'),
  top_creators_sort: z.enum(['views', 'videos', 'cpm', 'engagement']).optional().default('views'),
})

export type DashboardSearch = z.infer<typeof dashboardSearchSchema>

export const Route = createFileRoute('/_brand/inicio')({
  validateSearch: dashboardSearchSchema,
  component: DashboardPagePlaceholder,
})

function DashboardPagePlaceholder() {
  return <div data-testid="dashboard-placeholder" />
}
```

El guard `kind=brand + role=owner` ya está cubierto por el `beforeLoad` del layout `_brand.tsx` (comprueba `me.kind === 'brand'`). No agregar lógica redundante.

### 2. `src/routes/index.tsx` (modificar)

Actualmente:
```tsx
const home = me.kind === 'brand' ? '/campaigns' : '/offers'
throw redirect({ to: home })
```

Cambiar a: para `kind === 'brand'`, llamar `getBrandWorkspaceLandingTarget()` y redirigir a `/inicio` (si `target === 'dashboard'`) o `/campaigns/new` (si `target === 'create_campaign'`). Para cualquier error del endpoint, default a `/inicio`.

Importar `getBrandWorkspaceLandingTarget` desde `#/shared/api/generated/identity/identity`.

La función `getBrandWorkspaceLandingTarget` es una función async que devuelve un response tipado. El campo `data.target` es `'dashboard' | 'create_campaign'`.

```tsx
// dentro del beforeLoad, reemplazar la línea de brand:
if (me.kind === 'brand') {
  let landingTarget: 'dashboard' | 'create_campaign' = 'dashboard'
  try {
    const res = await getBrandWorkspaceLandingTarget()
    if (res.status === 200) {
      landingTarget = res.data.target
    }
  } catch {
    // default a dashboard si falla
  }
  throw redirect({ to: landingTarget === 'create_campaign' ? '/campaigns/new' : '/inicio' })
}
```

### 3. `src/features/identity/app-shell/navigation.ts` (modificar)

Agregar item `Inicio` como primer elemento del array `brand`:

```ts
{
  id: 'inicio',
  label: () => t`Inicio`,
  icon: 'home',
  href: '/inicio',
},
```

Insertar antes del item `inbox` existente.

## Tests

### `src/routes/_brand/inicio.test.ts` (nueva)

Vitest. Verificar que el schema Zod de `validateSearch` aplica defaults correctamente:
- Sin params → `{ range_preset: '14d', status: 'active', chart_grouping: 'day', top_videos_sort: 'views', top_creators_sort: 'views', chart_series: ['oferta','vistas'], ... }`
- `range_preset: 'custom'` + `range_start` + `range_end` → parse correcto.
- `platforms: ['instagram', 'unknown']` → error de validación (enum).

### `src/features/identity/app-shell/navigation.test.ts` (modificar)

Actualizar los tests existentes que verifican la lista de items del sidebar brand para incluir `inicio`. El test en `AppSidebar.test.tsx` que matchea `/Workspace|Inbox|Payments...` también debería agregar `Inicio`.

## Acceptance

- [ ] Ruta `/inicio` existe y `validateSearch` parsea todos los params con defaults correctos.
- [ ] Test Zod: `pnpm vitest run src/routes/_brand/inicio` pasa.
- [ ] `src/routes/index.tsx`: brand con `landing-target=dashboard` → redirect a `/inicio`.
- [ ] `src/routes/index.tsx`: brand con `landing-target=create_campaign` → redirect a `/campaigns/new`.
- [ ] `src/routes/index.tsx`: si endpoint falla → redirect a `/inicio` (no rompe).
- [ ] Item `Inicio` aparece primero en el sidebar brand (`navigation.ts`).
- [ ] `pnpm typecheck` pasa.
- [ ] Visual ≥95% del sidebar contra nodos `x2nTSR` (light) y `Ms8fL` (dark).
- Verify: `pnpm typecheck && pnpm vitest run src/routes/_brand/inicio`

## Done summary
Implemented fn-32-feat-037-brand-overview-dashboard.2; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: