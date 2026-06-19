# fn-32-feat-037-brand-overview-dashboard.5 OnboardingChecklist

## Description

> ESTA TAREA REQUIERE MIRAR EL DISEÑO — node_ids: `yEesH` (OnboardingChecklist light), `lyLNf` (OnboardingChecklist dark)

Card de onboarding con barra de progreso y 6 items con CTA. No se renderiza si el workspace ya completó el checklist.

Antes de implementar, leer el diseño:
```
pencil interactive --in marz-docs/features/FEAT-037-brand-overview-dashboard/feat37.pen --out /tmp/marz-feat037-read.pen
pencil > batch_get({ nodeIds: ["yEesH", "lyLNf"], readDepth: 3, resolveVariables: true })
pencil > export_nodes({ nodeIds: ["yEesH"], outputDir: "/tmp", format: "png" })
pencil > exit()
```

## Tipos del API (ya generados)

```ts
// src/shared/api/generated/model/onboardingChecklistResponse.ts
interface OnboardingChecklistResponse {
  completed: boolean
  progress: OnboardingChecklistProgress  // { done: number, total: number }
  items?: OnboardingChecklistItem[]       // ausente si completed=true
}

interface OnboardingChecklistItem {
  key: OnboardingChecklistItemKey
  done: boolean
  label: string      // "Completá tu perfil de marca"
  cta_label: string  // "Ir a Ajustes"
  cta_route: string  // "/ajustes/general"
}
```

## Archivos a crear

### `src/features/analytics/dashboard/OnboardingChecklist.tsx`

```tsx
interface OnboardingChecklistProps {
  data: OnboardingChecklistResponse | undefined
  isLoading: boolean
  isError: boolean
}
```

Lógica de render:
- Si `isLoading=true` → skeleton.
- Si `isError=true` → placeholder `<div data-testid="checklist-error" />` (ErrorBlockState en task 8).
- Si `data?.completed === true` → **no renderiza nada** (`return null`). El bloque desaparece cuando las 6 items están done.
- Si `data` disponible y `!completed` → renderiza la card completa.

Estructura de la card:
1. Header con título "Primeros pasos" y progreso `${progress.done}/${progress.total}`.
2. Barra de progreso: ancho = `(progress.done / progress.total) * 100`%.
3. Lista de 6 items. Por cada `OnboardingChecklistItem`:
   - Ícono check: si `done=true` → check verde; si `false` → círculo vacío.
   - Label: `item.label` (texto del backend).
   - CTA: `<Link to={item.cta_route}>{item.cta_label}</Link>` usando TanStack Router.
   - Si `done=true`, el CTA puede estar oculto o en estado secondary — seguir el diseño.

Conectar con `DashboardPage`: reemplazar `<div data-testid="checklist">` por `<OnboardingChecklist data={checklistQuery.data?.status === 200 ? checklistQuery.data.data : undefined} isLoading={checklistQuery.isPending} isError={checklistQuery.isError} />`.

Reglas:
- Usar `item.key` como React key (estable, no index).
- CTA usa `<Link>` nativo de TanStack Router (no `<a>` directamente).
- `progress.total` es siempre 6 en el MVP (el backend lo confirma, pero no hardcodear el divisor — usar `progress.total`).
- Headings con `font-semibold`.
- A11y: cada item es un `<li>`, el link es `<a>` nativo vía `<Link>`, focus visible.

## Tests

`src/features/analytics/dashboard/OnboardingChecklist.test.tsx`:
- `completed=true` → no renderiza nada (query `getByTestId` debe fallar o no existir).
- `completed=false, done=0` → 6 items con todos los checks vacíos, barra al 0%.
- `completed=false, done=3` → barra al 50%, 3 items con check, 3 sin check.
- `completed=false, done=6` → NO puede pasar si backend funciona bien (devolvería `completed=true`), pero test de borde: si llega `done=6, completed=false`, la barra es 100%.
- `isLoading=true` → skeleton visible.
- Click en CTA de item → navega a `cta_route`. (Mockear `Link` o usar `renderWithRouter`.)

## Acceptance

- [ ] `completed=true` → componente retorna null (no renderiza nada).
- [ ] `done=3/6` → barra al 50%, 3 checks completos, 3 pendientes.
- [ ] Click en CTA navega a `cta_route` del backend.
- [ ] Loading → skeleton visible.
- [ ] A11y: lista con items nav-focusables, links con texto visible.
- [ ] Visual ≥95% vs nodos `yEesH` y `lyLNf`.
- [ ] `pnpm typecheck && pnpm vitest run src/features/analytics/dashboard/OnboardingChecklist` pasan.
- Verify: `pnpm typecheck && pnpm vitest run src/features/analytics/dashboard/OnboardingChecklist`

## Done summary
Implemented fn-32-feat-037-brand-overview-dashboard.5; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: