# fn-22-feat-025-paid-plans-stripe-billing-ui.6 BillingTopbarPill (3 estados + portal CTA)

## Description
Componente `BillingTopbarPill` que renderiza una pill condicional a la izquierda del search en `AppTopbar`. Solo visible para `account.kind === 'brand'` y solo en 3 estados de billing accionables.

## Archivos

- Nuevo: `src/features/billing/components/BillingTopbarPill.tsx`.
- Modificado: `src/features/identity/app-shell/AppTopbar.tsx` (inyectar el pill inmediatamente antes del `<div>` del search).

## Estados visibles (los demás → `null`)

| State id | Condición | Color/token | Copy (vía Lingui) | Click |
|---|---|---|---|---|
| `trial_ending` | `in_trial=true && days_until_trial_ends != null && days_until_trial_ends <= 2` | warning | "Tu trial termina en N día(s)" | abrir portal |
| `past_due` | `status='past_due'` | error | "Tu cobro falló — actualizá la tarjeta" | abrir portal |
| `canceled_pending` | `status='canceled' && cancel_at != null` | info | "Cancelaste — acceso hasta DD/MM" | navegar a `/billing` |

Cualquier otro estado (incluyendo `active` sin trial ending, `unpaid`, `no_subscription`/404) → render `null`.

## Implementación

### Lectura de estado

- `useBillingSubscription({ staleTime: 60_000 })`.
- Si `account.kind !== 'brand'` → `null` (chequear vía `useMe()` o el contexto de sesión existente del repo; ver `profiles/knowledge/auth.md` para la fuente correcta de `kind`).
- Si `query.isLoading` → `null` (no mostrar skeleton en topbar).
- Si `query.isError` (incluido 404) → `null`.

### Render

- Pill chico, rounded-full, ícono + texto, tooltip con detalle adicional al hover/focus.
- Tokens: `bg-warning-subtle text-warning-strong`, `bg-destructive/10 text-destructive`, `bg-info/10 text-info` según corresponda. **Verificar nombres exactos de tokens en `src/styles.css`** (`profiles/knowledge/tokens.md`); si no existen, usar tokens shadcn existentes (`bg-primary/10`, etc.) y dejar nota en code review — no hardcodear colores hex.
- Botón nativo `<button>` con `aria-label` que repite la copy completa y `data-pill-state="trial_ending|past_due|canceled_pending"`.
- `role="status"` o `aria-live="polite"` para que cambios sean anunciados sin spam.

### Click handler

- `trial_ending` y `past_due` → invocar `useCreatePortalSession().mutate({ data: { return_url: window.location.href } })`; en `onSuccess` `window.location.assign(response.data.portal_url)`. Mostrar spinner inline mientras la mutation está pendiente.
- `canceled_pending` → `useNavigate({ to: '/billing' })`.

### Tooltip

- Componente `Tooltip` de shadcn ya existente en `src/components/ui/tooltip.tsx` (o `shared/ui/`). Usar wrapper si hay; si no, primitive directamente y dejar nota.
- Contenido: para `canceled_pending` mostrar `cancel_at` formateada con `Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })` hoisteada a module scope.

## Integración en `AppTopbar`

En `src/features/identity/app-shell/AppTopbar.tsx`, justo antes del `<div className="flex h-9 w-70 items-center gap-2 rounded-full bg-muted px-3.5">` (search), insertar `<BillingTopbarPill />`. El componente decide si renderiza o no.

No modificar la signature ni el `flex-1` que empuja el search a la derecha; solo insertar el pill antes del search.

## Tests (Vitest + Testing Library)

- Cada estado renderiza copy + handler correcto (3 tests).
- `account.kind='creator'` → render null.
- `status='active'` sin trial ending → null.
- `status='unpaid'` → null (no es un estado accionable directo; pasa por past_due primero).
- Click en `trial_ending` invoca mutation portal y `window.location.assign` con `portal_url`.
- Click en `canceled_pending` invoca `useNavigate({ to: '/billing' })`.
- `data-pill-state` se setea correctamente.

## Verificación visual (Playwright MCP)

Con el dev server corriendo: navegar a `/_brand/...` con sesión seedeada en cada uno de los 3 estados. Snapshot light + dark.
## Acceptance
- `src/features/billing/components/BillingTopbarPill.tsx` existe y los 3 estados están testeados.
- `AppTopbar.tsx` instancia `<BillingTopbarPill />` exactamente una vez, antes del search.
- `kind='creator'` y estados no-accionables renderizan `null`.
- Cero hex/rgb hardcoded; cero `text-[16px]`; tokens DS o utilities Tailwind.
- `Intl.DateTimeFormat` hoisteado a module scope.
- `aria-label` describe la acción completa; `role`/`aria-live` correcto.
- Click handler para portal usa `useCreatePortalSession` y redirige a `portal_url`.
- Click handler para `canceled_pending` navega a `/billing`.
- Cero ediciones en `src/components/ui/*` (shadcn primitives intactos).
- Tests Vitest pasan (7+ casos).
- Verify: `pnpm vitest run src/features/billing/components/BillingTopbarPill src/features/identity/app-shell/AppTopbar && pnpm lint && pnpm typecheck && pnpm react-doctor`
## Done summary
Implemented fn-22-feat-025-paid-plans-stripe-billing-ui.6; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: