# fn-23-feat-026-metodo-de-pago-reusable-para.1 Migrar consumers del campo card al nuevo shape BillingPaymentMethod

## Description

El cliente Orval fue regenerado contra el backend de FEAT-026. `BillingSubscription` ya no tiene el campo `card: { brand, last4 }`. En su lugar tiene:

```ts
subscription_payment_method: BillingPaymentMethod | null
offers_payment_method: BillingPaymentMethod | null
same_payment_method: boolean
```

donde `BillingPaymentMethod = { stripe_payment_method_id: string; card_brand: string; card_last4: string }`.

`BillingCardSummary` ya no existe en `src/shared/api/generated/model/`.

Este task elimina toda referencia al shape viejo en el feature billing para que `pnpm typecheck` pase.

## Archivos a modificar

### `src/features/billing/components/BillingPage.tsx`

Líneas ~237-238 tienen:

```ts
subscription.card
  ? `${subscription.card.brand} •••• ${subscription.card.last4}`
```

Reemplazar por lectura desde el nuevo campo. En MVP `same_payment_method` es siempre `true`, así que el valor a mostrar en la fila "Tarjeta" (dentro de `DetailsCard`) viene de `subscription.subscription_payment_method`:

```ts
subscription.subscription_payment_method
  ? `${subscription.subscription_payment_method.card_brand} •••• ${subscription.subscription_payment_method.card_last4}`
  : t`Sin tarjeta cargada`
```

No cambiar nada más en este componente — F.5 agrega el bloque nuevo. Este task solo hace la migración mínima para que el typecheck pase y los tests existentes sigan verde.

### `src/features/billing/components/BillingPage.test.tsx`

La función `baseSubscription` tiene `card: { brand: 'visa', last4: '4242' }`. Reemplazar por los 3 campos nuevos:

```ts
subscription_payment_method: {
  stripe_payment_method_id: 'pm_test_visa',
  card_brand: 'visa',
  card_last4: '4242',
},
offers_payment_method: {
  stripe_payment_method_id: 'pm_test_visa',
  card_brand: 'visa',
  card_last4: '4242',
},
same_payment_method: true,
```

El test `renders trialing block with countdown` asertan `screen.getByText(/visa •••• 4242/i)` — debe seguir verde con el nuevo shape.

## Reglas

- NO modificar nada fuera de `BillingPage.tsx` y `BillingPage.test.tsx`.
- NO agregar el bloque "Método de pago" de F.5 todavía.
- NO tocar `src/shared/api/generated/**`.
- Eliminar cualquier import de `BillingCardSummary` si existe en src/.

## Verificación

```bash
pnpm typecheck
pnpm vitest run src/features/billing/components/BillingPage.test.tsx
```

Ambos deben pasar sin errores.

## Acceptance

- `pnpm typecheck` pasa: cero referencias a `subscription.card` o `BillingCardSummary` en `src/`.
- `pnpm vitest run src/features/billing/components/BillingPage.test.tsx` verde: el test `renders trialing block with countdown` sigue asertando `visa •••• 4242`.
- 0 referencias a `BillingCardSummary` en `src/` (`grep -r BillingCardSummary src/` devuelve vacío).

## Done summary
Implemented fn-23-feat-026-metodo-de-pago-reusable-para.1; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: