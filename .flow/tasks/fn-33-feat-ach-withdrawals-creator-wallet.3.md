# fn-33-feat-ach-withdrawals-creator-wallet.3 WithdrawalModal: input bruto + desglose + mutation

## Description

Crear `WithdrawalModal` en `src/features/earnings/components/`. Input de monto bruto, desglose obligatorio (antes del botón Confirmar), mutation que llama `POST /v1/creators/me/withdrawals` con `Idempotency-Key`. Crear hook `useCreateWithdrawalMutation` en `src/features/earnings/hooks/`.

### Modelo de datos relevante

```ts
// Wallet (task 1)
interface Wallet {
  balance: MoneyAmount        // { amount: "152.50", currency: "USD" }
  withdrawal_fee_pct: string  // "2.5"
  min_withdrawal: MoneyAmount // { amount: "10.00", currency: "USD" }
  can_withdraw: boolean
}

// Request
interface CreateWithdrawalRequest { gross_amount: MoneyAmount }
// El hook generado: useCreateWithdrawal({ mutation: { ... } })

// Response
interface CreateWithdrawalResponse {
  id: string; status: string; gross: string; fee: string; net: string; currency: string; requested_at: string
}
```

### Hook `src/features/earnings/hooks/useCreateWithdrawalMutation.ts`

El hook generado `useCreateWithdrawal` acepta `request?: RequestInit` (segundo parámetro de `customFetch`). El header `Idempotency-Key` se pasa por ahí, NO por el segundo argumento de `mutateAsync` (que es `MutateOptions` de TanStack Query y no tiene campo `request`).

```ts
import { useQueryClient } from '@tanstack/react-query'
import { useCreateWithdrawal } from '#/shared/api/generated/creator/creator'
import { getWalletQueryKey } from './useWalletQuery'
import { getWithdrawalsQueryKey } from './useWithdrawalsQuery'  // task 5 provee este key

export function useCreateWithdrawalMutation(idempotencyKey: string) {
  const queryClient = useQueryClient()
  return useCreateWithdrawal({
    request: { headers: { 'Idempotency-Key': idempotencyKey } },
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getWalletQueryKey() })
        void queryClient.invalidateQueries({ queryKey: getWithdrawalsQueryKey() })
      },
    },
  })
}
```

**Idempotency-Key**: Generar con `generateIdempotencyKey()` de `#/shared/api/idempotency` (NO `crypto.randomUUID()` — no disponible en contextos no-seguros como `.test`). Generar al montar el modal con `useState(() => generateIdempotencyKey())`. El modal se desmonta al cerrar → al reabrir se genera un nuevo key. Pasar el key al hook:
```ts
import { generateIdempotencyKey } from '#/shared/api/idempotency'

// Dentro de WithdrawalModal:
const [idempotencyKey] = useState(() => generateIdempotencyKey())
const mutation = useCreateWithdrawalMutation(idempotencyKey)

// Llamar sin segundo argumento:
await mutation.mutateAsync({ data: { gross_amount: { amount: grossStr, currency: 'USD' } } })
```

Nota: el `customFetch` del repo genera idempotency keys automáticamente solo para mutations de configuración de campaña (ver `getConfigurationMutationIdempotencyKey` en `mutator.ts`). Para withdrawals, hay que pasarlo manualmente como se indica arriba.

### Componente `src/features/earnings/components/WithdrawalModal.tsx`

```ts
interface WithdrawalModalProps {
  open: boolean
  wallet: Wallet          // balance + fee_pct + min_withdrawal
  onOpenChange: (open: boolean) => void
  onSuccess: () => void   // llamar tras confirmar (para tracking analytics task 7)
}
```

**Flujo de pasos:**

**Paso 1 — Input**
- Input de monto bruto (texto numérico, `inputMode="decimal"`)
- Placeholder: "0.00"
- Debajo del input, **desglose en tiempo real** mientras el usuario tipea:

```
Retirás                                   USD [gross]
Comisión de procesadora de pagos (2,5%)   − USD [fee]
Vas a recibir                             USD [net]
```

Copy exacto. El desglose se muestra siempre que el monto sea > 0 y válido, aunque sea menor al mínimo.

- **Cálculo del fee client-side** (round half-up, 2 decimales):
```ts
function calcFee(gross: number, feePct: string): number {
  // feePct es porcentaje ("2.5"), no decimal.
  // gross * 2.5 = fee en centésimos → Math.round → /100 da fee en USD con 2 decimales.
  return Math.round(gross * Number(feePct)) / 100
}
function calcNet(gross: number, fee: number): number {
  return Math.round((gross - fee) * 100) / 100
}
```
Formatear siempre con 2 decimales: `amount.toFixed(2)`.

- **Validación** (inline, antes de habilitar "Confirmar"):
  - Monto debe ser número válido > 0
  - `gross >= Number(wallet.min_withdrawal.amount)` → si no: "Mínimo USD 10.00"
  - `gross <= Number(wallet.balance.amount)` → si no: "Saldo insuficiente"

- Botón "Confirmar retiro" deshabilitado mientras validación falla o mientras `isPending`

**Paso 2 — Confirmación (en el mismo modal)**
Tras éxito de la mutation, mostrar:
- Ícono de check / success
- "¡Solicitud enviada! Tu retiro está en cola. Recibirás un aviso cuando se envíe."
- Botón "Cerrar" → `onOpenChange(false)` + `onSuccess()`

**Manejo de errores del backend**:

El `customFetch` del repo lanza `ApiError` (de `#/shared/api/mutator`) con `{ status, code, message, details }`. NO es `ErrorResponse` del modelo generado — el hook tipa `TError = ErrorResponse` pero en runtime el error es `ApiError`.

```ts
import { ApiError } from '#/shared/api/mutator'

// En el catch o en onError del mutateAsync:
try {
  await mutation.mutateAsync({ data: { gross_amount: { amount: grossStr, currency: 'USD' } } })
} catch (error) {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'w8ben_required':
        // Cerrar modal, invalidar wallet (re-verificar elegibilidad)
        void queryClient.invalidateQueries({ queryKey: getWalletQueryKey() })
        onOpenChange(false)
        break
      case 'withdrawal_in_flight':
        setInlineError('Ya tenés un retiro en proceso')
        break
      case 'payout_account_missing':
        setInlineError('Primero cargá una cuenta de cobro')
        break
      case 'below_minimum':
        setInlineError('Mínimo no alcanzado')
        break
      case 'insufficient_balance':
        setInlineError('Saldo insuficiente')
        break
      default:
        setInlineError('Ocurrió un error. Intentá de nuevo.')
    }
  }
}
```

| código backend | acción UI |
|--------|--------|
| `w8ben_required` | Cerrar modal, invalidar wallet |
| `withdrawal_in_flight` | Mensaje inline: "Ya tenés un retiro en proceso" |
| `payout_account_missing` | Mensaje inline: "Primero cargá una cuenta de cobro" |
| `below_minimum` | Validación client-side previene esto; si llega igual: "Mínimo no alcanzado" |
| `insufficient_balance` | "Saldo insuficiente" |
| otros | "Ocurrió un error. Intentá de nuevo." |

**Formatters** (módulo scope, React Doctor):
```ts
const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
```

### Wiring en `EarningsPage.tsx`

```tsx
// Estado ya creado en task 2
const [withdrawOpen, setWithdrawOpen] = useState(false)

// Añadir modal (después del grid):
{walletQuery.data && (
  <WithdrawalModal
    open={withdrawOpen}
    wallet={walletQuery.data}
    onOpenChange={setWithdrawOpen}
    onSuccess={() => { /* analytics task 7 */ }}
  />
)}
```

### `useWithdrawalsQuery` key (interfaz hacia task 5)

Esta task importa `getWithdrawalsQueryKey` desde `src/features/earnings/hooks/useWithdrawalsQuery.ts`. Si task 5 no está hecha, crear el archivo con solo la función:
```ts
import { getListMyWithdrawalsQueryKey } from '#/shared/api/generated/creator/creator'

export function getWithdrawalsQueryKey() {
  return getListMyWithdrawalsQueryKey({})
}
```
Task 5 lo completará con el hook completo.

### Tests

`src/features/earnings/components/__tests__/WithdrawalModal.test.tsx`:
- Input 100 → desglose muestra "USD 100.00 / − USD 2.50 / USD 97.50"
- Input 5 → error "Mínimo USD 10.00"; botón Confirmar deshabilitado
- Input > balance → error "Saldo insuficiente"; botón deshabilitado
- Submit exitoso → paso 2 visible con mensaje de éxito
- Error `withdrawal_in_flight` (simular `ApiError` con `code: 'withdrawal_in_flight'`) → mensaje inline

`src/features/earnings/hooks/__tests__/useCreateWithdrawalMutation.test.ts`:
- onSuccess invalida wallet query y withdrawals query
- El header `Idempotency-Key` se pasa en la request

## Acceptance

- [ ] `WithdrawalModal` muestra input de monto bruto
- [ ] Desglose (Retirás / Comisión / Vas a recibir) visible en tiempo real con montos > 0
- [ ] Copy exacto del desglose respetado
- [ ] Validación: mínimo USD 10.00 bloqueado client-side
- [ ] Validación: monto > balance bloqueado client-side
- [ ] POST `/v1/creators/me/withdrawals` enviado con header `Idempotency-Key` (vía `request` option del hook, usando `generateIdempotencyKey` de `#/shared/api/idempotency`)
- [ ] Tras éxito: paso 2 con mensaje de solicitud en cola
- [ ] Errores backend (`ApiError` de `#/shared/api/mutator`) manejados por `error.code`: `withdrawal_in_flight`, `payout_account_missing` con mensajes inline
- [ ] `onSuccess` de la mutation invalida wallet query y withdrawals query
- [ ] Formatter de moneda hoisteado a módulo (React Doctor)
- [ ] Tests del modal y la mutation pasan
- [ ] `pnpm quality-gates` en verde

## Done summary
Implemented fn-33-feat-ach-withdrawals-creator-wallet.3; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: