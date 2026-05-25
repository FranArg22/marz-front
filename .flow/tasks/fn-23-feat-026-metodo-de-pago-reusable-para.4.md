# fn-23-feat-026-metodo-de-pago-reusable-para.4 BillingPage bloque metodo de pago con logica same_payment_method

## Description

Modificar `src/features/billing/components/BillingPage.tsx` para:
1. Agregar el bloque "Método de pago" debajo de `DetailsCard` en todas las vistas activas (`TrialingView`, `ActiveView`, `PastDueView`, `CanceledView`).
2. Wirear `trackBillingEvent` al montar el bloque y al click de "Gestionar en Stripe" desde la card de offers.
3. Lógica `same_payment_method`:
   - `true` (caso único en MVP): renderiza **una sola** `PaymentMethodCard` con badge "Se usa para suscripción y pagos a creators". El bloque de subscription (`DetailsCard`) elimina la fila "Tarjeta" para no duplicar (queda solo la card combinada).
   - `false` (futuro): renderiza **dos** `PaymentMethodCard`s separadas; `DetailsCard` mantiene su fila "Tarjeta".

## Cambios en `BillingPage.tsx`

### Nuevo componente interno `PaymentMethodBlock`

```tsx
interface PaymentMethodBlockProps {
  subscription: BillingSubscription
}
```

- Importar `PaymentMethodCard` desde `./PaymentMethodCard`.
- Importar `trackBillingEvent` desde `../analytics`.
- Importar `useCreatePortalSession` (ya importado en el archivo).
- `useEffect` (o `useMount`) que llame `trackBillingEvent('offers_payment_method_viewed')` al montar.
- Handler `handleManageClick` que llame `trackBillingEvent('offers_payment_method_portal_opened')` y luego dispare `portalMutation.mutate(...)` igual al `ManagePortalButton` existente.

Rama `same_payment_method = true`:
```tsx
<PaymentMethodCard
  title={t`Método de pago`}
  paymentMethod={subscription.offers_payment_method}
  secondaryLabel={t`Se usa para suscripción y pagos a creators`}
  onManageClick={handleManageClick}
/>
```

Rama `same_payment_method = false`:
```tsx
<PaymentMethodCard
  title={t`Método de pago de la suscripción`}
  paymentMethod={subscription.subscription_payment_method}
  onManageClick={handleManageClick}
/>
<PaymentMethodCard
  title={t`Método de pago para pagos a creators`}
  paymentMethod={subscription.offers_payment_method}
  onManageClick={handleManageClick}
/>
```

### Ajuste a `DetailsCard`

Agregar prop `hideTarjeta?: boolean`. Cuando `same_payment_method = true`, pasar `hideTarjeta` y omitir la fila "Tarjeta" en el render (para no duplicarla con la card combinada).

### Inserción en las vistas

En `TrialingView`, `ActiveView`, `PastDueView`, `CanceledView`: agregar `<PaymentMethodBlock subscription={subscription} />` dentro de `<BillingShell>`, después de `<DetailsCard>`.

### Eliminar `ManagePortalButton` standalone si queda huérfano

`ManagePortalButton` sigue existiendo para `PastDueView` (botón rojo "Actualizar tarjeta"). Solo en `CanceledView` el CTA de gestión lo provee la `PaymentMethodCard`. Revisar qué vistas mantenían `ManagePortalButton` y cuál queda duplicado tras agregar el bloque — ajustar con criterio mínimo (no sobreingeniería).

## Tests en `BillingPage.test.tsx`

Agregar casos:

1. **`same_payment_method=true` → card combinada con badge, sin fila "Tarjeta" duplicada**:
   - Mock con `same_payment_method: true`, `subscription_payment_method` y `offers_payment_method` iguales.
   - Aserta: existe 1 sola `PaymentMethodCard` (o elemento con el badge "Se usa para suscripción").
   - Aserta: la fila con label "Tarjeta" NO existe en el DOM (porque `hideTarjeta=true`).

2. **`same_payment_method=false` → 2 cards separadas**:
   - Mock con `same_payment_method: false`, ambos PMs definidos con valores distintos.
   - Aserta: aparece "Método de pago de la suscripción" y "Método de pago para pagos a creators".

3. **`trackBillingEvent('offers_payment_method_viewed')` invocado al montar**:
   - `vi.mock('../analytics', ...)` con spy.
   - Render `BillingPage` con subscription activa.
   - Aserta: spy llamado con `'offers_payment_method_viewed'`.

4. **`trackBillingEvent('offers_payment_method_portal_opened')` al click**:
   - Spy en analytics.
   - Click en botón "Gestionar en Stripe" de la card de offers.
   - Aserta: spy llamado con `'offers_payment_method_portal_opened'`.

Mock de `../analytics` en el test:
```ts
const trackBillingEventMock = vi.fn()
vi.mock('../analytics', () => ({
  trackBillingEvent: (...args: unknown[]) => trackBillingEventMock(...args),
}))
```

## E2E — actualizar `src/test/e2e/suites/billing/billing-page.spec.ts`

El test E2E existente navega a `/billing` y asertan `visa •••• 4242`. Después de FEAT-026, ese texto sigue visible (ahora dentro de `PaymentMethodCard` en vez de la fila "Tarjeta" de `DetailsCard`), así que la aserción existente (línea ~60) debería seguir verde.

Agregar **una aserción nueva** después de la existente para verificar el bloque combinado:

```ts
await expect(page.getByText(/Se usa para suscripción y pagos a creators/i)).toBeVisible()
```

Esto valida que `same_payment_method=true` renderiza la card combinada con el badge descriptivo.

No cambiar el resto del test (flujo Stripe checkout + portal).

## Reglas

- Modificar `BillingPage.tsx`, `BillingPage.test.tsx`, y `src/test/e2e/suites/billing/billing-page.spec.ts`.
- Usar `t`...`` de `@lingui/core/macro` para strings. No hardcodear.
- No `useEffect` extra fuera del tracking. El `useEffect` de tracking solo depende de `[]` (montar).
- `useCreatePortalSession` ya importado — no duplicar.

## Verificación

```bash
pnpm typecheck
pnpm vitest run src/features/billing/components/BillingPage.test.tsx
pnpm test:e2e -- --grep "billing"
```

## Acceptance

- `same_payment_method=true`: 1 `PaymentMethodCard` con badge "Se usa para suscripción y pagos a creators"; fila "Tarjeta" de `DetailsCard` no visible.
- `same_payment_method=false`: 2 `PaymentMethodCard`s separadas; fila "Tarjeta" de `DetailsCard` visible.
- `trackBillingEvent('offers_payment_method_viewed')` invocado al montar el bloque.
- `trackBillingEvent('offers_payment_method_portal_opened')` invocado al click en la card de offers.
- E2E: el test en `billing-page.spec.ts` asertan el badge "Se usa para suscripción y pagos a creators" visible en la página `/billing`.
- `pnpm typecheck` verde.
- `pnpm vitest run src/features/billing/components/BillingPage.test.tsx` verde.