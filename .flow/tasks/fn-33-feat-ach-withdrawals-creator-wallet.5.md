# fn-33-feat-ach-withdrawals-creator-wallet.5 WithdrawalsHistory: lista + detalle/comprobante + cancelación

## Description

Crear `WithdrawalsHistory` (lista paginada de retiros con montos netos + estado) y `WithdrawalDetail` (modal de comprobante con bruto/comisión/neto/fechas). Crear hooks `useWithdrawalsQuery`, `useWithdrawalDetailQuery`, y `useCancelWithdrawalMutation`. Integrar en `EarningsPage` debajo de la tabla de pagos existente. Los retiros en estado `requested` ("En cola") deben tener un botón/acción de cancelar.

### Modelos relevantes

```ts
// Item de lista (generado en src/shared/api/generated/model/withdrawalListItem.ts)
interface WithdrawalListItem {
  id: string
  status: string          // 'requested' | 'sent' | 'failed' | 'cancelled'
  net: MoneyAmount        // { amount: "97.50", currency: "USD" }
  requested_at: string
  sent_at?: string | null
  failed_at?: string | null
}

// ListMyWithdrawals200
type ListMyWithdrawals200 = {
  items: WithdrawalListItem[]
  total: number
  page: number
  per_page: number
}

// Withdrawal (detalle/comprobante, generado en src/shared/api/generated/model/withdrawal.ts)
// Nota: gross, fee, net son MoneyAmount (no string plano)
interface Withdrawal {
  id: string
  status: string
  gross: MoneyAmount; fee: MoneyAmount; net: MoneyAmount
  mercury_transaction_id?: string | null
  failure_reason?: string | null; failure_category?: string | null
  requested_at: string; sent_at?: string | null; failed_at?: string | null; cancelled_at?: string | null
}

// CancelMyWithdrawal200
type CancelMyWithdrawal200 = { id: string; status: 'cancelled' }
```

### Hooks en `src/features/earnings/hooks/`

**`useWithdrawalsQuery.ts`**:
```ts
import { useListMyWithdrawals, getListMyWithdrawalsQueryKey } from '#/shared/api/generated/creator/creator'
import type { ListMyWithdrawals200 } from '#/shared/api/generated/model'

export function getWithdrawalsQueryKey(params?: { page?: number; per_page?: number }) {
  return getListMyWithdrawalsQueryKey(params ?? {})
}

export function useWithdrawalsQuery(params?: { page?: number; per_page?: number }) {
  return useListMyWithdrawals(params ?? {}, {
    query: {
      queryKey: getWithdrawalsQueryKey(params),
      select: (response): ListMyWithdrawals200 => {
        if (response.status === 200) return response.data
        throw new Error('Unexpected withdrawals response')
      },
    },
  })
}
```

**`useWithdrawalDetailQuery.ts`**:
```ts
import { useGetMyWithdrawal } from '#/shared/api/generated/creator/creator'
import type { Withdrawal } from '#/shared/api/generated/model'

export function useWithdrawalDetailQuery(id: string, options?: { enabled?: boolean }) {
  return useGetMyWithdrawal(id, {
    query: {
      enabled: options?.enabled ?? true,
      select: (response): Withdrawal => {
        if (response.status === 200) return response.data
        throw new Error('Unexpected withdrawal response')
      },
    },
  })
}
```

**`useCancelWithdrawalMutation.ts`**:
```ts
import { useQueryClient } from '@tanstack/react-query'
import { useCancelMyWithdrawal } from '#/shared/api/generated/creator/creator'
import { getWalletQueryKey } from './useWalletQuery'
import { getWithdrawalsQueryKey } from './useWithdrawalsQuery'

export function useCancelWithdrawalMutation() {
  const queryClient = useQueryClient()
  return useCancelMyWithdrawal({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getWalletQueryKey() })
        void queryClient.invalidateQueries({ queryKey: getWithdrawalsQueryKey() })
      },
    },
  })
}
```

Cancel restaura el balance (reversal), por eso se invalida wallet además de historial.

### Componentes

**`src/features/earnings/components/WithdrawalsHistory.tsx`**

Estructura:
- Heading "Historial de retiros" (`text-lg font-semibold`)
- Si `isLoading`: skeleton (3 filas de `h-12 animate-pulse`)
- Si lista vacía: "Todavía no realizaste ningún retiro."
- Lista de ítems: tabla o lista de cards con columnas:
  - Fecha (de `requested_at`, formateada: `MMM d, yyyy`)
  - Monto neto: `net.amount` formateado en USD
  - Estado: badge coloreado (ver abajo)
  - Si `status === 'requested'`: botón/link "Cancelar" que invoca `useCancelWithdrawalMutation`
  - Botón "Ver detalle" → abre `WithdrawalDetail` con ese `id`

**Badges de estado**:
```
requested → "En cola"    → badge gris
sent      → "Enviado ✓" → badge verde
failed    → "Falló"      → badge rojo
cancelled → "Cancelado"  → badge gris
```
Usar clases Tailwind directas o `variant` del componente `Badge` si existe.

**Cancelación inline**: para ítems con status `requested`, mostrar un botón "Cancelar" (variant `ghost` o `outline`, tamaño `sm`). Al hacer click:
1. Confirmation dialog ("¿Cancelar este retiro? El monto se devolverá a tu balance.") — usar `AlertDialog` de shadcn o un confirm simple.
2. Llamar `cancelMutation.mutateAsync({ id: withdrawal.id })`.
3. `onSuccess` invalida wallet + historial (ya definido en el hook).
4. Error `withdrawal_not_cancelable` (409): mostrar toast "El retiro ya no puede cancelarse" (ya fue enviado a Mercury).

Importar `ApiError` de `#/shared/api/mutator` para el error handling (mismo patrón que task 3).

**Paginación**: usar `page` y `per_page` (default 10). Si `total > per_page`, mostrar botones "Anterior" / "Siguiente". Estado de paginación local con `useState`.

**`WithdrawalDetail`** (modal, dentro del mismo archivo o separado en `WithdrawalDetail.tsx`):

Props:
```ts
interface WithdrawalDetailProps {
  id: string
  open: boolean
  onOpenChange: (open: boolean) => void
}
```

Contenido (comprobante):
- Título: "Comprobante de retiro"
- Usa `useWithdrawalDetailQuery(id, { enabled: open })`
- Mientras carga: skeleton
- Contenido:
  ```
  Estado:        [badge]
  Retiraste:     USD [gross.amount]
  Comisión:      − USD [fee.amount]
  Recibiste:     USD [net.amount]
  Solicitado el: [requested_at formateado]
  Enviado el:    [sent_at formateado] (si presente)
  Falló el:      [failed_at formateado] (si presente)
  ```
  Si status = `sent`: mostrar "mercury_transaction_id" si presente como referencia de transacción (label: "Referencia Mercury").
  Si status = `requested`: botón "Cancelar retiro" (misma lógica que la cancelación inline del historial).

Nota: `gross`, `fee`, `net` en el tipo `Withdrawal` son `MoneyAmount` (`{amount, currency}`), no strings planos. Acceder con `.amount`.

**Formatters** (módulo scope):
```ts
const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
```
No usar `new Date()` directamente en JSX — formatear con los `Intl` hoisteados, pasando el string ISO.

### Wiring en `EarningsPage.tsx`

Añadir `WithdrawalsHistory` después de `EarningsPaymentsTable`:
```tsx
<WithdrawalsHistory />
```

### Tests

`src/features/earnings/components/__tests__/WithdrawalsHistory.test.tsx`:
- Estado loading: renderiza skeletons
- Lista vacía: "Todavía no realizaste ningún retiro."
- Lista con ítems: muestra fecha, monto neto, badge de estado
- Status `sent` → badge "Enviado ✓"
- Status `failed` → badge "Falló"
- Status `requested` → badge "En cola" + botón "Cancelar" visible
- Status `sent` → botón "Cancelar" NO visible
- Click "Cancelar" → llama mutation cancel
- Click "Ver detalle" → abre modal de detalle

`src/features/earnings/hooks/__tests__/useWithdrawalsQuery.test.ts`:
- Llama a `listMyWithdrawals` con parámetros correctos

`src/features/earnings/hooks/__tests__/useCancelWithdrawalMutation.test.ts`:
- onSuccess invalida wallet query y withdrawals query

## Acceptance

- [ ] `useWithdrawalsQuery` hook creado con `getWithdrawalsQueryKey` exportado
- [ ] `useWithdrawalDetailQuery` hook creado
- [ ] `useCancelWithdrawalMutation` hook creado — invalida wallet + historial en onSuccess
- [ ] `WithdrawalsHistory` lista retiros con fecha, monto neto, badge de estado
- [ ] Badge correcto por estado: "En cola" / "Enviado ✓" / "Falló" / "Cancelado"
- [ ] Retiros en estado `requested` muestran botón/acción "Cancelar"
- [ ] Cancelación pide confirmación antes de ejecutar
- [ ] Error `withdrawal_not_cancelable` (409) manejado con mensaje al usuario
- [ ] Lista vacía muestra mensaje explicativo
- [ ] Paginación funcional si hay más de 10 retiros
- [ ] Click "Ver detalle" abre `WithdrawalDetail` modal
- [ ] `WithdrawalDetail` muestra bruto / comisión / neto (como `MoneyAmount.amount`) / fecha solicitud / fecha envío
- [ ] `WithdrawalDetail` para retiros `requested` muestra botón "Cancelar retiro"
- [ ] Formatters `Intl.*` hoisteados a módulo scope (React Doctor)
- [ ] `WithdrawalsHistory` integrado en `EarningsPage`
- [ ] Tests de la lista, hooks y cancelación pasan
- [ ] `pnpm quality-gates` en verde

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs: