# fn-30-feat-039-ajustes-perfil-de-marca.4 SubscriptionSection + BillingSummary refactor + FreePlanCTA + PlanUsageCard

## Description

> ESTA TAREA REQUIERE MIRAR EL DISEÑO — node_ids: `C9aEtz`

Implementar la pantalla Suscripción con tres sub-componentes: `SubscriptionSection` (orquesta), `BillingSummary` (refactor desde `BillingPage` existente), `FreePlanCTA` (para plan free) y `PlanUsageCard` (3 mini-cards de uso del plan).

Antes de implementar, leer el diseño de `PlanUsageCard`:
```
pencil interactive --in marz-docs/features/FEAT-039-ajustes-perfil-marca/FEAT-039.pen --out /tmp/marz-FEAT-039-read.pen
pencil > batch_get({ nodeIds: ["C9aEtz"], readDepth: 3, resolveVariables: true })
pencil > export_nodes({ nodeIds: ["C9aEtz"], outputDir: "/tmp", format: "png" })
```

La pantalla Suscripción no tiene diseño propio en `FEAT-039.pen`; reusa el layout de Billing de FEAT-025 (ver `src/features/billing/components/BillingPage.tsx` como referencia visual).

## Archivos a crear / modificar

### `src/features/billing/settings/SubscriptionSection.tsx`

Componente orquestador para `/ajustes/suscripcion`. Llama en paralelo:
- `useBillingSubscription({ staleTime: 30_000 })` — hook existente en `src/features/billing/hooks/useBillingSubscription.ts`.
- `useOffersPaymentMethods()` — hook wrapper existente en `src/features/billing/hooks/useOffersPaymentMethod.ts` (envuelve `useListBillingPaymentMethods` de `src/shared/api/generated/brand/brand.ts`). Si se prefiere el hook Orval directo: `useListBillingPaymentMethods` de `src/shared/api/generated/brand/brand.ts`.
- `useGetPlanUsage()` — de `src/shared/api/generated/billing/billing.ts`.

Lógica de rama:
- Si la subscription query devuelve 404 (no subscription) o `subscription.plan === 'free'`: renderizar `<FreePlanCTA>` + `<PlanUsageCard>`.
- Si plan pago (`starter | growth | scale`): renderizar `<BillingSummary>` + `<PlanUsageCard>`.

`BillingSummary` y `FreePlanCTA` se montan arriba, `PlanUsageCard` debajo.

**Nota sobre 404 del subscription query**: La ruta `/billing` actual redirige al home cuando el subscription query da 404 (ver `src/routes/_brand/billing.tsx` loader). En la nueva `SubscriptionSection`, un 404 significa workspace en plan free → no redirigir, sino renderizar `FreePlanCTA`. Manejar el 404 response del query en el componente sin dejar que sea un error.

### `src/features/billing/settings/BillingSummary.tsx`

Extracción del contenido de `src/features/billing/components/BillingPage.tsx` a un componente independiente en `src/features/billing/settings/`. Sin cambios funcionales: misma lógica, mismos hooks, mismos estilos. `BillingPage` pasa a ser un thin wrapper de `BillingSummary` (o se actualiza para importar `BillingSummary` internamente).

Recibe los datos ya cargados por `SubscriptionSection` vía props (no hace fetch propio para evitar doble request):
```ts
interface BillingSummaryProps {
  subscription: BillingSubscription
  paymentMethods: BillingPaymentMethodList | undefined
}
```

Incluye el botón "Gestionar en Stripe" que llama `useCreatePortalSession()` existente (`src/features/billing/hooks/useCreatePortalSession.ts`).

**`return_url` del portal**: El `ManagePortalButton` actual en `BillingPage.tsx:270` tiene `return_url: \`${window.location.origin}/billing\``. En `BillingSummary` actualizar a `return_url: \`${window.location.origin}/ajustes/suscripcion\``, ya que el usuario vuelve del portal de Stripe a la nueva ruta.

### `src/features/billing/settings/FreePlanCTA.tsx`

Componente de empty state para workspace en plan free. Muestra:
- Texto descriptivo del plan free (límites: sin invitaciones, 1 campaña activa, creadores ilimitados).
- Botón "Mejorar plan" (CTA) → abre `PlanUpgradeModal` (prop `onUpgrade: () => void`).

No hace fetch propio; recibe lo que necesita por props o toma los datos del contexto de suscripción ya cargado.

### `src/features/billing/settings/PlanUsageCard.tsx`

Card con 3 mini-cards. Datos de `useGetPlanUsage()`.

**Estructura del response** (`PlanUsageResponse` de `src/shared/api/generated/model/planUsageResponse.ts`):
```ts
{
  campaigns_active: { current: number | null, limit: number | null, available: boolean },
  creators_active:  { current: number | null, limit: number | null, available: boolean },
  invitations:      { current: number | null, limit: number | null, cycle_resets_at: string | null, available: boolean },
}
```

Render por mini-card:
- `available: false` → mostrar estado de error (icono ⚠ + "No disponible") sin tirar las demás.
- `limit === null` → "∞" como límite, sin barra de progreso.
- `limit === 0` → "N/A" (aplica solo a `invitations` en plan free).
- `limit > 0` → barra de progreso `current/limit` + texto `X de Y`.
- `cycle_resets_at` (solo en invitations, si no null): mostrar "Reinicia el DD/MM/YYYY" formateado con `Intl.DateTimeFormat` hoisted a módulo scope.

Labels:
- Campañas: `t\`Campañas activas\``
- Creadores: `t\`Creadores activos\``
- Invitaciones: `t\`Invitaciones\`` + sublabel con fecha de reinicio.

Header de la card: `t\`Uso\`` (el diseño muestra solo "Uso", no "Uso del plan").

Visual: corresponde al nodo `C9aEtz` del `.pen`.

## Reglas

- `Intl.DateTimeFormat` para `cycle_resets_at` hoisted a scope de módulo.
- No usar `new Date()` en JSX/render: formatear solo en event handlers o memo si se necesita.
- No replicar el estado del server a Zustand.
- Strings via Lingui.
- Si `SubscriptionSection` importa `PlanUpgradeModal` (de la task siguiente), usar un import lazy o prop `onUpgrade` para evitar dependencia circular entre tasks.

## Tests (Vitest)

`src/features/billing/settings/PlanUsageCard.test.tsx`:
- Plan starter: campañas con barra `1/1`, creadores `3/5`, invitaciones `10/30` con fecha de reinicio.
- Plan scale: `limit=null` → "∞" sin barra.
- Plan free: invitaciones `limit=0` → "N/A".
- `available: false` en campaigns → fallback error, resto ok.

`src/features/billing/settings/SubscriptionSection.test.tsx`:
- Plan free → renderiza `FreePlanCTA` + `PlanUsageCard`.
- Plan pago → renderiza `BillingSummary` + `PlanUsageCard`.
- Subscription 404 → renderiza como plan free (FreePlanCTA).

## Acceptance
- [ ] `SubscriptionSection` con plan pago muestra `BillingSummary` + `PlanUsageCard`.
- [ ] `SubscriptionSection` con plan free (o subscription 404) muestra `FreePlanCTA` + `PlanUsageCard`.
- [ ] `PlanUsageCard`: `limit=null` → "∞" sin barra; `limit=0` → "N/A"; `available:false` → fallback por mini-card sin romper las demás.
- [ ] `cycle_resets_at` mostrado como fecha formateada (Intl hoisted).
- [ ] `ManagePortalButton` en `BillingSummary` usa `return_url` apuntando a `/ajustes/suscripcion` (no `/billing`).
- [ ] Visual ≥95% match con nodo `C9aEtz` del `.pen`.
- [ ] `pnpm typecheck && pnpm vitest run src/features/billing/settings` pasan.
- Verify: `pnpm typecheck && pnpm vitest run src/features/billing/settings`

## Done summary
Implemented fn-30-feat-039-ajustes-perfil-de-marca.4; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: