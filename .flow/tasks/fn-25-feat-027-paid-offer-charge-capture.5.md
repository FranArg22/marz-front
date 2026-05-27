# fn-25-feat-027-paid-offer-charge-capture.5 CheckoutReturnPage + useDraftStatus (ruta /_brand/checkout-return)

## Description

Crear el hook `useDraftStatus` y la ruta `/_brand/checkout-return` con `CheckoutReturnPage`. Esta página se muestra mientras el usuario vuelve de Stripe Checkout (SCA); polea `GET /v1/offers/draft-status/:offer_draft_id` hasta resolver y luego navega al destino original.

## Hook `useDraftStatus`

**Archivo:** `src/features/payments/hooks/useDraftStatus.ts`

Wrappea `useGetOfferDraftStatus` de `src/shared/api/generated/offers/offers.ts`.

```typescript
interface UseDraftStatusOptions {
  offerDraftId: string
  enabled?: boolean
}

export function useDraftStatus({ offerDraftId, enabled = true }: UseDraftStatusOptions) {
  // ...
}
```

**Lógica:**
- `refetchInterval`: 2000ms mientras el status no sea terminal.
- Status terminales: `'sent'`, `'failed'`, `'canceled'` (detener polling).
- Status no-terminales: `'pending'`, `'requires_capture'`, `'requires_action'` (seguir polea).
- Timeout 30s: usar `useState(false)` + `useEffect` con `setTimeout(30_000)` que setea `timedOut=true`. Cuando `timedOut=true`, forzar `refetchInterval=false`.
- Devolver: `{ data, status, isTerminal, timedOut, isLoading }`.

**Patrón de referencia:** `src/routes/onboarding/brand.billing-callback.tsx` (mismo patrón de polling + timeout).

## Ruta `CheckoutReturnPage`

**Archivo de ruta:** `src/routes/_brand/checkout-return.tsx`

**Search params:** La URL de retorno de Stripe Checkout incluye params construidos por el backend en `success_url`/`cancel_url`. La ruta necesita leer `offer_draft_id` y `return_to_kind` + `return_to_id` de los query params. El backend los incluye en la URL.

Schema de search:
```typescript
const searchSchema = z.object({
  offer_draft_id: z.string(),
  return_to_kind: z.enum(['conversation', 'inbox']),
  return_to_id: z.string().optional(),
  checkout: z.enum(['success', 'cancel']).optional(),
})
```

**Lógica del componente `CheckoutReturnPage`:**

1. Si `checkout === 'cancel'` → navegar inmediatamente a `return_to` con `?send_offer_result=cancelled` (sin polling).
2. Si `checkout === 'success'` → iniciar polling con `useDraftStatus({ offerDraftId: search.offer_draft_id })`.
3. Cuando el status es terminal:
   - `sent` → navegar a destino con `?send_offer_result=success`
   - `failed` o `canceled` → navegar a destino con `?send_offer_result=failed`
4. Cuando `timedOut && !isTerminal` → mostrar mensaje de error + CTA "Reintentar" (que reinicia el timeout y continúa polleando).

**Navegación al destino (`return_to`):**
```typescript
function navigateToReturnTo(navigate, search, result: 'success' | 'cancelled' | 'failed') {
  if (search.return_to_kind === 'conversation') {
    void navigate({
      to: '/workspace/conversations/$conversationId',
      params: { conversationId: search.return_to_id! },
      search: { send_offer_result: result },
      replace: true,
    })
  } else {
    void navigate({
      to: '/inbox',
      search: (prev) => ({ ...prev, send_offer_result: result }),
      replace: true,
    })
  }
}
```

**Render principal (spinner):**
```tsx
<main className="flex min-h-screen items-center justify-center bg-background p-6">
  <div role="status" aria-live="polite" className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 text-center">
    <div className="size-10 animate-spin rounded-full border-2 border-muted border-t-primary" aria-hidden="true" />
    <h1 className="text-lg font-semibold text-foreground">{t`Esperando confirmación…`}</h1>
    <p className="text-sm text-muted-foreground">{t`Estamos confirmando el pago con Stripe.`}</p>
  </div>
</main>
```

**Render timeout:**
```tsx
<main className="flex min-h-screen items-center justify-center bg-background p-6">
  <div role="alert" className="...">
    <h1 className="...">{t`Tardamos más de lo esperado`}</h1>
    <p className="...">{t`Tu pago puede estar procesándose. Podés volver a intentar o revisar el estado luego.`}</p>
    <button onClick={handleRetry}>{t`Reintentar`}</button>
  </div>
</main>
```

**Nota sobre `routeTree.gen.ts`:** Al crear la ruta nueva, TanStack Router regenera `src/routeTree.gen.ts` automáticamente al correr el dev server o `pnpm build`. El archivo generado está committeado en el repo; incluirlo en el commit de esta task.

## Tests

**Archivo de ruta:** `src/routes/_brand/checkout-return.test.tsx` (o `.test.ts` si no hay UI que testear aislada).

- `checkout='cancel'` → `navigate` llamado inmediatamente con `send_offer_result=cancelled`.
- `checkout='success'` + `useDraftStatus` retorna `{ status: 'sent' }` → `navigate` llamado con `send_offer_result=success`.
- `checkout='success'` + `useDraftStatus` retorna `{ status: 'failed' }` → `navigate` llamado con `send_offer_result=failed`.
- `checkout='success'` + `useDraftStatus` retorna `{ status: 'canceled' }` → `navigate` llamado con `send_offer_result=failed`.
- Timeout → muestra estado de error, no navega.
- Retry → reinicia timeout state, polling continúa.

**Hook tests:** `src/features/payments/hooks/useDraftStatus.test.ts`

- Status `sent` → `isTerminal=true`, `refetchInterval=false`.
- Status `pending` → `isTerminal=false`, `refetchInterval=2000`.
- `timedOut=true` → `refetchInterval=false` independientemente del status.

## Acceptance

- Existe `src/routes/_brand/checkout-return.tsx` con ruta registrada en `routeTree.gen.ts`.
- Existe `src/features/payments/hooks/useDraftStatus.ts`.
- Polling se detiene en status terminales (`sent`, `failed`, `canceled`).
- Timeout 30s → muestra estado de error + CTA reintentar.
- `navigate` usa `replace: true` para no manchar el historial.
- Cero strings hardcoded sin Lingui macro.
- Tests pasan.
- Verify: `pnpm vitest run src/features/payments/hooks/useDraftStatus && pnpm vitest run src/routes/_brand/checkout-return && pnpm typecheck`

## Done summary

## Evidence
- Commits:
- Tests:
- PRs:
