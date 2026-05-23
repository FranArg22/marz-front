# fn-22-feat-025-paid-plans-stripe-billing-ui.3 PlansGrid + PlanCard (catálogo de planes UI)

## Description
Componentes presentacionales del catálogo de planes: `PlansGrid` y `PlanCard`. Reusables en paywall (B13) y en `/billing` (upsell futuro). Solo UI, sin lógica de billing — recibe `plans` y callbacks por props.

## Consulta al `.pen`

**Antes de implementar**, leer la pantalla `B13 · Paywall` del archivo `marz-docs/marzv2.pen` via Pencil MCP en modo solo lectura. Pasos exactos del flujo (siguiendo `marz-docs/DESIGN-DEV.md`):

1. `get_editor_state({ include_schema: true })`
2. `get_variables()` para los tokens.
3. `batch_get` apuntando al frame `B13PaywallScreen` con `readDepth` bajo.
4. `get_screenshot()` para verificación.

Mapear cada propiedad visual del `.pen` a utility Tailwind o `var(--token)`. Nunca hardcodear color/radio/spacing. Light + dark.

## Componentes

### `PlanCard`

- Archivo: `src/features/billing/components/PlanCard.tsx`.
- Props:
  - `plan: 'starter' | 'growth' | 'scale'`
  - `interval: 'month' | 'year'`
  - `amountUsd: number`
  - `selected: boolean`
  - `onSelect: () => void`
  - `highlightLabel?: string` (para "Más elegido" o similar si el `.pen` lo muestra; sino prop opcional, no se renderiza)
- Render: card con título del plan, precio formateado (`Intl.NumberFormat` hoisteado a module scope — regla React Doctor), interval label, lista de features (estática si el `.pen` la define textual; sino solo precio + título), CTA "Elegir plan".
- Accesible: `role="radio"`, `aria-checked={selected}`, focusable, keyboard navigation funciona dentro del `radiogroup` padre.

### `PlansGrid`

- Archivo: `src/features/billing/components/PlansGrid.tsx`.
- Props:
  - `plans: BillingPlan[]` (tipo importado de `src/shared/api/generated`)
  - `selectedPlan?: 'starter' | 'growth' | 'scale'`
  - `selectedInterval: 'month' | 'year'`
  - `onIntervalChange: (interval: 'month' | 'year') => void`
  - `onPlanSelect: (plan: 'starter' | 'growth' | 'scale') => void`
- Render:
  - Toggle `monthly | annual` arriba, `role="switch"` o `role="tablist"` según lo que muestre el `.pen`.
  - Grid de 3 `PlanCard` filtrados por `interval` seleccionado.
  - `role="radiogroup"` envolviendo las cards.
- Sin estado interno; controlled component.

## Reglas

- Headings con `font-semibold` (regla React Doctor) salvo que el `.pen` exija otro peso explícito.
- `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })` hoisteado fuera del componente.
- Cero keys de array por índice; usar `` `${plan.plan}-${plan.interval}` ``.
- Tailwind shorthands `size-N`, `p-N` cuando aplica.
- Cero strings hardcoded user-facing: usar `<Trans>` de Lingui (los strings de UI propios del componente; el plan name del backend viene como literal `starter|growth|scale` y se traduce via map → mensaje Lingui).

## Tests (Vitest + Testing Library)

- Render con 6 planes (3 × 2 intervals) y `selectedInterval='month'` → 3 cards visibles, cards `year` ocultas.
- Click en toggle `annual` invoca `onIntervalChange('year')`.
- Click en card invoca `onPlanSelect(plan)`.
- `aria-checked` refleja `selected` prop.
- Sin selección, ningún card está `aria-checked`.

## Verificación visual Playwright MCP

Una vez integrado en una pantalla (en task 4 vamos al paywall), verificar ≥95% match contra screenshot del `.pen` en light y dark.
## Acceptance
- Existen `src/features/billing/components/PlanCard.tsx` y `PlansGrid.tsx` con props arriba descritos.
- `PlanCard` es presentacional puro: cero imports de hooks de data, cero useState propio.
- `PlansGrid` es controlled; cero `useState` interno para selección/interval.
- `Intl.NumberFormat` declarado a module scope (no dentro del componente).
- `role="radiogroup"`/`role="radio"`/`aria-checked` presentes y testeados.
- Cero hex/rgb/colores hardcoded; cero `text-[16px]` / `gap-[12px]`; solo utilities Tailwind y `var(--token)`.
- Cero strings user-facing sin Lingui.
- Tests Vitest pasan.
- Verify: `pnpm vitest run src/features/billing/components && pnpm lint && pnpm typecheck`
## Done summary
Implemented fn-22-feat-025-paid-plans-stripe-billing-ui.3; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: