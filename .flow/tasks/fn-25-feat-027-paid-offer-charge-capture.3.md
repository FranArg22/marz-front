# fn-25-feat-027-paid-offer-charge-capture.3 OfferSendErrorBanner: mapeo de error codes + CTA portal

## Description

Crear `src/features/offers/components/OfferSendErrorBanner.tsx`: banner que aparece en el sidesheet cuando `POST /v1/offers` devuelve `{ status: 'rejected', error: { code, stripe_code } }`. Mapea el `code` a copy Lingui y ofrece un CTA "Gestionar tarjeta en Stripe" que usa `useCreatePortalSession`.

## Tipos disponibles (generados en F.1)

```typescript
import type { OfferSendError } from '#/shared/api/generated/model'
import { OfferSendErrorCode } from '#/shared/api/generated/model'
// OfferSendErrorCode.card_declined | insufficient_funds | expired_card | incorrect_cvc | hold_failed_generic
```

## Componente

**Archivo:** `src/features/offers/components/OfferSendErrorBanner.tsx`

**Props:**
```typescript
interface OfferSendErrorBannerProps {
  error: OfferSendError
}
```

**Render:**
- Banner de error (usar clases de variante destructiva del design system: `bg-destructive/10 border-destructive text-destructive-foreground` o equivalente del repo — verificar tokens existentes en `src/styles.css` o en otros banners de error del repo)
- Copy según `error.code`:
  - `card_declined` → "Tu tarjeta fue declinada. Verificá los datos o usá otra tarjeta."
  - `insufficient_funds` → "Tu tarjeta no tiene fondos suficientes."
  - `expired_card` → "Tu tarjeta está vencida."
  - `incorrect_cvc` → "El código de seguridad de tu tarjeta es incorrecto."
  - `hold_failed_generic` (y cualquier code desconocido) → "No pudimos procesar el pago. Intentá de nuevo o gestioná tu tarjeta."
- Si `error.stripe_code` existe y el code es `hold_failed_generic` o desconocido: mostrar `stripe_code` en un `<abbr title={stripe_code}>` o tooltip para soporte (patrón: texto pequeño `text-muted-foreground text-xs` debajo del mensaje)
- CTA "Gestionar tarjeta en Stripe": `<button>` que invoca `mutation.mutate()` de `useCreatePortalSession()` y en `onSuccess` hace `window.location.href = data.data.url`. Si `mutation.isPending`, deshabilitar el botón y mostrar spinner.

**Hook a reusar:** `src/features/billing/hooks/useCreatePortalSession.ts` — importar directamente, no re-implementar.

**Reglas:**
- Cero strings hardcoded user-facing: usar `t` macro de Lingui
- Los strings Lingui definitivos los agrega F.8; en esta task ponerlos con `t` macro para que la toolchain los detecte
- Sin estado interno más allá del estado de la mutation
- `role="alert"` en el elemento raíz del banner

## Tests (Vitest + Testing Library)

Archivo: `src/features/offers/components/OfferSendErrorBanner.test.tsx`

- Render con `code='card_declined'` → muestra copy correcto (sin portal CTA bloqueado).
- Render con `code='insufficient_funds'` → copy correcto.
- Render con `code='expired_card'` → copy correcto.
- Render con `code='incorrect_cvc'` → copy correcto.
- Render con `code='hold_failed_generic'` → copy genérico.
- Render con `code='hold_failed_generic'` y `stripe_code='do_not_honor'` → muestra `stripe_code` en tooltip/abbr.
- Render con code desconocido (ej. `'unknown_future_code'` as any) → copy genérico.
- Click en CTA → invoca `mutation.mutate()`.
- `mutation.isPending=true` → CTA deshabilitado.
- `role="alert"` presente.

Para mockear `useCreatePortalSession`: usar `vi.mock` del módulo, retornar `{ mutate: vi.fn(), isPending: false }`.

## Acceptance

- Existe `src/features/offers/components/OfferSendErrorBanner.tsx`.
- Todos los 5 codes (+ fallback) testeados con copy distinto.
- `role="alert"` presente y testeado.
- CTA usa `useCreatePortalSession` de `src/features/billing/hooks/` (no re-implementado).
- Cero strings hardcoded sin Lingui macro.
- Tests pasan.
- Verify: `pnpm vitest run src/features/offers/components/OfferSendErrorBanner && pnpm lint && pnpm typecheck`

## Done summary
Implemented fn-25-feat-027-paid-offer-charge-capture.3; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: