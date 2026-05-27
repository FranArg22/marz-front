# fn-25-feat-027-paid-offer-charge-capture.4 SendOfferSidesheet: integrar paid flow (offer_draft_id + return_to + discriminated response)

## Description

Extender `src/features/offers/components/SendOfferSidesheet.tsx` y `src/features/offers/hooks/useCreateOfferMutation.ts` para soportar el nuevo response discriminado de `POST /v1/offers` y el contexto paid.

El cambio de tipado en F.1 rompió el código existente que asumía `OfferDetailDTO` directo en el response 201. Esta task lo arregla y añade la lógica de branching.

## Contexto del archivo existente

- `src/features/offers/components/SendOfferSidesheet.tsx` — sidesheet con form para enviar offer. Ya usa `useCreateOfferMutation`. Tiene prop `creatorAccountId`.
- `src/features/offers/hooks/useCreateOfferMutation.ts` — wrappea `createOffer` de Orval. Actualmente el `onSuccess` asume que el response tiene `data.data` de tipo `OfferDetailDTO`. Eso rompió en F.1.

## Cambios en `useCreateOfferMutation.ts`

1. El tipo de response de `createOffer` 201 es ahora `OfferSendSent | OfferSendRequiresAction | OfferSendRejected` (discriminated union por `status`).
2. El hook **no debe** manejar la ramificación de `status` — eso es responsabilidad del componente que llama al hook. El hook solo retorna la mutation con el tipo correcto.
3. Actualizar el tipado: la mutation `data` es el response 201 discriminated union. Eliminar cualquier asunción sobre `OfferDetailDTO` en `onSuccess`.
4. `onSuccess` en el hook: **no** invalidar queries ni hacer navigación — eso lo hace el componente según el `status`. Solo puede quedar lógica genérica de cleanup si es necesario.
5. El request builder `toCreateOfferRequest` debe aceptar dos nuevos campos opcionales:
   - `offer_draft_id?: string`
   - `return_to?: { kind: 'conversation' | 'inbox', id?: string }`
   Y mapearlos al `CreateOfferRequest` tipado (ya tiene esos campos desde F.1).

## Cambios en `SendOfferSidesheet.tsx`

### 1. Generación de `offer_draft_id`

Al montar el sidesheet (con `useState` inicializado con `crypto.randomUUID()` o un `useRef` inicializado una sola vez), generar un UUID v4 que persiste por toda la vida del sidesheet abierto:

```typescript
const [offerDraftId] = useState(() => crypto.randomUUID())
```

### 2. `return_to`

El sidesheet necesita saber desde qué contexto se abrió para construir el `return_to`. Agregar una prop:

```typescript
interface SendOfferSidesheetProps {
  creatorName: string
  creatorAccountId: string
  conversationId?: string   // si viene → return_to = { kind: 'conversation', id: conversationId }
                            // si no viene → return_to = { kind: 'inbox' }
}
```

Verificar cómo se llama `SendOfferSidesheet` en el repo (`grep -r "SendOfferSidesheet" src/`) y pasar `conversationId` donde corresponda.

### 3. Submit handler — branching por `response.status`

Después de `mutation.mutateAsync(...)`, ramificar:

```typescript
const result = await sendOfferMutation.mutateAsync(variables)

if (result.status === 201) {
  const data = result.data  // OfferSendSent | OfferSendRequiresAction | OfferSendRejected

  if (data.status === 'sent') {
    // cerrar sidesheet
    // toast "Offer enviada" (string Lingui — F.8 lo traduce)
    // invalidar queries de offers del conversationId si aplica
  } else if (data.status === 'requires_action') {
    // redirigir a Stripe Checkout: window.location.href = data.checkout_url
    // NO cerrar el sidesheet (el usuario se va, el sidesheet queda en segundo plano)
  } else if (data.status === 'rejected') {
    // guardar el error en state local: setSendError(data.error)
    // NO cerrar el sidesheet — el banner lo muestra
  }
}
```

**Importante para `requires_action`:** wrappear la asignación de `window.location.href` en una función de utilidad testeable:
```typescript
// src/features/offers/utils/redirectToCheckout.ts
export function redirectToCheckout(url: string) {
  window.location.href = url
}
```
Así el test puede mockear el módulo y verificar que se llamó con la URL correcta.

### 4. Estado de error local

Agregar `const [sendError, setSendError] = useState<OfferSendError | null>(null)`.
- Limpiar `sendError` al hacer submit de nuevo.
- Renderizar `<OfferSendErrorBanner error={sendError} />` cuando `sendError !== null`.

### 5. `OfferSummaryBlock`

Incorporar `<OfferSummaryBlock amount={...} bonusTerms={...} plan={plan} />` en el sidesheet. Determinar el `plan` del workspace desde el estado existente del usuario (verificar si hay un hook `useWorkspace` o similar — buscar en `src/features/identity/` o `src/features/billing/`).

### 6. Manejo de 502 stripe_unavailable

Si el error es un `ApiError` con `status=502` y `data.error.code === 'stripe_unavailable'`, mostrar `OfferSendErrorBanner` con un error genérico de tipo "Reintentá en un momento" (no es un `OfferSendError` tipado, así que construir un objeto compatible).

## Tests (Vitest + Testing Library)

Archivo: `src/features/offers/components/SendOfferSidesheet.test.tsx` (ya existe — actualizar/agregar casos).

- Submit exitoso con response `{ status: 'sent', offer: {...} }` → `onClose` llamado + toast visible.
- Submit con response `{ status: 'requires_action', checkout_url: 'https://checkout.stripe.com/...', offer_draft_id: '...' }` → `redirectToCheckout` llamado con la URL (mockear el módulo `redirectToCheckout`).
- Submit con response `{ status: 'rejected', error: { code: 'card_declined', stripe_code: null } }` → `OfferSendErrorBanner` renderizado + sidesheet sigue abierto.
- Submit con error 502 → banner genérico visible + sidesheet sigue abierto.
- `offer_draft_id` se mantiene igual entre renders (no cambia en re-renders).
- `return_to` construido correctamente según `conversationId` prop.

## Acceptance

- `pnpm typecheck` pasa sin errores en `SendOfferSidesheet.tsx` ni `useCreateOfferMutation.ts`.
- Existe `src/features/offers/utils/redirectToCheckout.ts` con la función wrappera.
- `SendOfferSidesheet` genera `offer_draft_id` una sola vez al montar (no cambia en re-renders).
- Los 3 casos de response (`sent` / `requires_action` / `rejected`) y el caso 502 están cubiertos por tests.
- `OfferSummaryBlock` renderizado en el sidesheet.
- Cero strings hardcoded sin Lingui macro (F.8 los traduce, pero los macros deben existir).
- Verify: `pnpm vitest run src/features/offers/components/SendOfferSidesheet && pnpm lint && pnpm typecheck`

## Done summary

## Evidence
- Commits:
- Tests:
- PRs:
