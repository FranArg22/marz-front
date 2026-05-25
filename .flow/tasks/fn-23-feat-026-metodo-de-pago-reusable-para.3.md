# fn-23-feat-026-metodo-de-pago-reusable-para.3 PaymentMethodCard componente reusable

## Description

Crear `src/features/billing/components/PaymentMethodCard.tsx`: card que muestra una tarjeta enmascarada con título dinámico y CTA "Gestionar en Stripe".

Depende de la task .1 porque usa `BillingPaymentMethod` del tipo ya migrado.

## Props

```ts
interface PaymentMethodCardProps {
  title: string
  paymentMethod: BillingPaymentMethod | null
  secondaryLabel?: string  // badge inline opcional (ej. "Se usa para suscripción y pagos a creators")
  onManageClick: () => void
}
```

Importar `BillingPaymentMethod` desde `#/shared/api/generated/model`.

## Comportamiento

- Si `paymentMethod` no es null: mostrar `card_brand` (capitalize) + ` •••• ` + `card_last4` como valor principal.
- Si `paymentMethod` es null: mostrar texto `t\`Sin método de pago\``.
- Si `secondaryLabel` existe: mostrar como badge (`Badge` de `#/components/ui/badge`) inline junto al título o debajo del valor.
- Botón "Gestionar en Stripe" llama `onManageClick`; `aria-label` descriptivo que incluya el título (ej. `t\`Gestionar ${title} en Stripe\``).
- Usar `Card`, `CardContent`, `CardHeader`, `CardTitle` de `#/components/ui/card` para la estructura base (igual a `DetailsCard` en `BillingPage.tsx`).

## Archivo a crear

`src/features/billing/components/PaymentMethodCard.tsx`

No crear barrel index ni modificar otros archivos.

## Test a crear

`src/features/billing/components/PaymentMethodCard.test.tsx`:

```ts
// Estructura de los casos requeridos:
// 1. Render con PM seteado: muestra card_brand capitalizado + •••• + card_last4 + título + botón CTA
// 2. Render con secondaryLabel: muestra el badge con el texto
// 3. Render con paymentMethod=null: muestra "Sin método de pago"
// 4. Click en botón: llama onManageClick
// 5. aria-label del botón incluye el título
```

Mock de `@lingui/core/macro` igual al patrón en `BillingPage.test.tsx`.

## Reglas

- Solo archivos nuevos (`.tsx` + `.test.tsx`). No tocar otros archivos.
- Usar `t\`...\`` de `@lingui/core/macro` para todos los strings visibles al usuario.
- No prop `loading` ni lógica de mutación — el componente es puro (recibe `onManageClick`, no sabe de `useCreatePortalSession`).
- No array indexes como keys. No `new Date()` en JSX.
- Accesibilidad: botón con `aria-label` no genérico.

## Verificación

```bash
pnpm typecheck
pnpm vitest run src/features/billing/components/PaymentMethodCard.test.tsx
```

## Acceptance

- `PaymentMethodCard` renderiza brand + last4 cuando `paymentMethod` está seteado.
- Badge visible cuando `secondaryLabel` está presente.
- Texto fallback cuando `paymentMethod` es null.
- `onManageClick` invocado al click del botón.
- Botón tiene `aria-label` que incluye el título.
- `pnpm typecheck` pasa.
- Tests pasan.

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
