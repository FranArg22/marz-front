# fn-24-feat-026-e2e-billing-payment-method.1 Agregar data-testid al bloque combinado de PaymentMethodBlock en BillingPage

## Description

El test E2E de billing necesita localizar el bloque combinado de método de pago (que aparece cuando `same_payment_method=true`) via un `data-testid` estable en lugar de texto visible.

El componente relevante es `PaymentMethodBlock` en `src/features/billing/components/BillingPage.tsx`. Cuando `subscription.same_payment_method === true`, renderiza un único `<PaymentMethodCard>`. Hay que envolver ese card en un `<div data-testid="billing.page.active_subscription_portal">`.

### Archivo a modificar

**`src/features/billing/components/BillingPage.tsx`** — función `PaymentMethodBlock`

Rama actual (líneas ~316-325):

```tsx
if (subscription.same_payment_method) {
  return (
    <PaymentMethodCard
      title={t`Método de pago`}
      paymentMethod={subscription.offers_payment_method}
      secondaryLabel={t`Se usa para suscripción y pagos a creators`}
      onManageClick={handleManageClick}
    />
  )
}
```

Cambio requerido — envolver con `<div data-testid>`:

```tsx
if (subscription.same_payment_method) {
  return (
    <div data-testid="billing.page.active_subscription_portal">
      <PaymentMethodCard
        title={t`Método de pago`}
        paymentMethod={subscription.offers_payment_method}
        secondaryLabel={t`Se usa para suscripción y pagos a creators`}
        onManageClick={handleManageClick}
      />
    </div>
  )
}
```

### Reglas

- NO tocar la rama `same_payment_method === false` ni ningún otro componente.
- NO agregar `data-testid` a `PaymentMethodCard.tsx` — el wrapper va en `BillingPage.tsx`.
- Cambio mínimo: solo el `<div data-testid>` wrapper.

## Verificación

```bash
pnpm typecheck
pnpm vitest run src/features/billing/components/BillingPage.test.tsx
```

Ambos deben pasar sin errores. Adicionalmente verificar que el atributo aparece en el DOM:

```bash
grep -n 'billing.page.active_subscription_portal' src/features/billing/components/BillingPage.tsx
# debe retornar exactamente 1 línea
```

## Acceptance

- [ ] `BillingPage.tsx` tiene exactamente una aparición de `data-testid="billing.page.active_subscription_portal"` en la rama `same_payment_method === true` de `PaymentMethodBlock`.
- [ ] `pnpm typecheck` pasa sin errores.
- [ ] `pnpm vitest run src/features/billing/components/BillingPage.test.tsx` verde.
- [ ] Sin cambios en `PaymentMethodCard.tsx` ni en ningún otro archivo fuera de `BillingPage.tsx`.

## Done summary
Implemented fn-24-feat-026-e2e-billing-payment-method.1; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: