# fn-25-feat-027-paid-offer-charge-capture.6 useOfferActions: manejar 402 capture_failed con toast tipado

## Description

Extender `src/features/offers/hooks/useOfferActions.ts` para manejar el nuevo error 402 que devuelve `POST /v1/offers/:id/accept` cuando el capture de Stripe falla.

## Tipos disponibles (generados en F.1)

```typescript
import type { AcceptOffer402 } from '#/shared/api/generated/model'
import { OfferAcceptErrorCode } from '#/shared/api/generated/model'
// AcceptOffer402 = { error: { code: OfferAcceptErrorCode, stripe_code?: string | null } }
// OfferAcceptErrorCode = 'hold_expired' | 'card_declined' | 'capture_failed_generic'
```

El hook generado `useAcceptOffer` tiene `TError = Error | AcceptOffer402`, pero `useOfferActions` no usa ese hook — llama a la función plana `acceptOffer` y wrappea con su propio `useMutation<..., Error, ...>`. Como `ApiError extends Error`, el 402 se captura en `onError`.

Cuando el backend devuelve 402, el mutator (`src/shared/api/mutator.ts`) lanza `ApiError`. El cuerpo crudo del response queda en **`error.body`** (propiedad `body` de `ApiError`), NO en `error.data`. Castear `error.body as AcceptOffer402` para acceder a `error.code` / `stripe_code`.

## Cambios en `useOfferActions.ts`

En el `acceptMutation`, el `onError` actual solo maneja `ApiError` con status 409. Extenderlo para manejar el status 402:

```typescript
onError: (error, _vars, context) => {
  // rollback optimistic update
  if (context?.snapshot !== undefined) {
    queryClient.setQueryData(offersQueryKey, context.snapshot)
  }

  // 402: capture failed
  if (error instanceof ApiError && error.status === 402) {
    const body = error.body as AcceptOffer402
    const code = body?.error?.code
    if (code === OfferAcceptErrorCode.hold_expired) {
      toast.error(t`Los fondos reservados expiraron`)
    } else if (code === OfferAcceptErrorCode.card_declined) {
      toast.error(t`El brand necesita actualizar su tarjeta`)
    } else {
      // capture_failed_generic + cualquier code desconocido
      toast.error(t`No se pudo procesar el pago`)
    }
    void queryClient.invalidateQueries({ queryKey: offersQueryKey })
    return
  }

  // 409: offer no longer actionable (ya existente)
  if (error instanceof ApiError && error.status === 409) {
    toast.error(t`Offer expired`)
    void queryClient.invalidateQueries({ queryKey: offersQueryKey })
    return
  }

  toast.error(t`Something went wrong. Try again.`)
},
```

**Patrón confirmado en el repo:** `src/features/campaigns/configuration/ReviewStep.tsx:105` usa `error.body` para leer cuerpos custom de `ApiError`. El campo se llama `body` (5to arg del constructor de `ApiError` en `src/shared/api/mutator.ts`), NO `data`.

**Importante:** la mutación optimista debe hacer rollback en 402 (la offer queda en `sent`, no en `accepted`). El rollback ya está implementado vía `context.snapshot`; solo hay que asegurarse de que no se omite para el caso 402.

## Tests (Vitest + Testing Library)

Archivo: `src/features/offers/hooks/useOfferActions.test.ts` (ya existe — agregar casos).

- `acceptOffer` lanza `ApiError({ status: 402, body: { error: { code: 'hold_expired' } } })` → toast con copy "Los fondos reservados expiraron" + rollback del optimistic update.
- `acceptOffer` lanza `ApiError({ status: 402, body: { error: { code: 'card_declined' } } })` → toast "El brand necesita actualizar su tarjeta".
- `acceptOffer` lanza `ApiError({ status: 402, body: { error: { code: 'capture_failed_generic' } } })` → toast "No se pudo procesar el pago".
- Caso existente 409 sigue funcionando.

**Cómo construir el ApiError para tests:** ver la firma del constructor en `src/shared/api/mutator.ts`:
```typescript
new ApiError(402, 'unknown', 'Payment Required', undefined, { error: { code: 'hold_expired' } })
//           status  code     message              details   body (= AcceptOffer402)
```

## Acceptance

- `useOfferActions.ts` maneja 402 con rollback + toast tipado por código.
- Los 3 codes de `OfferAcceptErrorCode` están cubiertos por tests.
- Rollback del estado optimista testeado para el caso 402.
- Acceso al código de error usa `error.body` (no `error.data`) — verificar con grep.
- Cero strings hardcoded sin Lingui macro.
- Tests pasan.
- Verify: `pnpm vitest run src/features/offers/hooks/useOfferActions && pnpm lint && pnpm typecheck`

## Done summary
Implemented fn-25-feat-027-paid-offer-charge-capture.6; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: