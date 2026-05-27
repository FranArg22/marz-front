# fn-26-feat-027-e2e-paid-offer-charge-capture.1 Agregar data-testid a componentes de offer paid (OfferSummaryBlock, OfferSendErrorBanner, SendOfferSidesheet, CheckoutReturnPage)

## Description
Los tests E2E de FEAT-027 necesitan localizadores estables para anclar assertions sin depender de texto visible. Este task agrega `data-testid` a los cuatro puntos de anclaje necesarios. No se crea ningún test aquí; sólo se instrumenta el código de producción.

### Cambios requeridos

#### 1. `src/features/offers/components/OfferSummaryBlock.tsx`

Buscar el JSX raíz que devuelve el componente y agregar `data-testid="offers.send.summary_block"` en el elemento contenedor externo. Si el componente ya tiene un wrapper `<div>` o `<section>`, agregar el atributo ahí. Si retorna un Fragment, envolver con `<div data-testid="offers.send.summary_block">`.

Verificar primero la estructura real del archivo antes de editar.

#### 2. `src/features/offers/components/OfferSendErrorBanner.tsx`

Agregar `data-testid="offers.send.error_banner"` al elemento raíz del componente (el banner/alerta). Si ya tiene un `role="alert"` o similar, agregar el atributo al mismo elemento; no anidar.

Verificar primero la estructura real del archivo antes de editar.

#### 3. `src/features/offers/components/SendOfferSidesheet.tsx`

Agregar `data-testid="offers.send.submit_button"` al botón de submit que dispara el envío ("Send offer" / "Enviar offer"). Buscar el `<Button>` o `<button>` cuyo `onClick` o `type="submit"` dispara la función de envío principal. Verificar que haya exactamente un botón de submit visible (no el de speed bonus ni otros CTA secundarios).

#### 4. `src/routes/_brand/checkout-return.tsx`

El componente ya tiene:
- Un `<div role="status" ...>` para el estado de espera (spinner + "Esperando confirmación…")
- Un `<div role="alert" ...>` para el estado de timeout ("Tardamos más de lo esperado")

Agregar `data-testid="checkout-return.waiting"` al `<div role="status">`.
Agregar `data-testid="checkout-return.timeout_error"` al `<div role="alert">`.

### Reglas

- NO crear tests ni modificar archivos fuera de los 4 listados.
- Cambio mínimo: sólo los atributos `data-testid` indicados.
- Convención de nombres: namespace con puntos + snake_case (igual que `billing.page.active_subscription_portal`).
- Si un archivo tiene estructura diferente a la descrita, adaptar al contenedor semántico correcto y documentarlo en el Done summary.

### Verificación

```bash
grep -n 'offers.send.summary_block' src/features/offers/components/OfferSummaryBlock.tsx
grep -n 'offers.send.error_banner' src/features/offers/components/OfferSendErrorBanner.tsx
grep -n 'offers.send.submit_button' src/features/offers/components/SendOfferSidesheet.tsx
grep -n 'checkout-return.waiting' src/routes/_brand/checkout-return.tsx
grep -n 'checkout-return.timeout_error' src/routes/_brand/checkout-return.tsx
pnpm typecheck
```

Cada grep debe retornar exactamente 1 línea. `pnpm typecheck` sin errores.
## Acceptance
- [ ] `OfferSummaryBlock.tsx` tiene `data-testid="offers.send.summary_block"` exactamente una vez.
- [ ] `OfferSendErrorBanner.tsx` tiene `data-testid="offers.send.error_banner"` exactamente una vez.
- [ ] `SendOfferSidesheet.tsx` tiene `data-testid="offers.send.submit_button"` en el botón de envío exactamente una vez.
- [ ] `checkout-return.tsx` tiene `data-testid="checkout-return.waiting"` en el div `role="status"`.
- [ ] `checkout-return.tsx` tiene `data-testid="checkout-return.timeout_error"` en el div `role="alert"`.
- [ ] Ningún otro archivo fue modificado.
- [ ] `pnpm typecheck` pasa sin errores.
- [ ] `pnpm quality-gates` verde.
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
