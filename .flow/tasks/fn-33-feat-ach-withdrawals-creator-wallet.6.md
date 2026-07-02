# fn-33-feat-ach-withdrawals-creator-wallet.6 WS withdrawal.updated: handler + hook + invalidación

## Description

Añadir soporte del evento WebSocket `withdrawal.updated` para que la UI se actualice automáticamente cuando cambia el estado de un retiro (sin que el usuario tenga que recargar). El evento llega del servidor cuando el retiro pasa de `requested` a `sent` o a `failed`.

### Patrón existente

El sistema WS está en:
- `src/shared/ws/useWebSocket.ts` — hook base (acepta `handlers` map + `enabled`)
- `src/shared/ws/handlers.ts` — factory `createWsHandlers(queryClient)` que retorna `Record<string, EventHandler>`
- `src/shared/ws/events.ts` — tipos `DomainEventEnvelope<T>`, `EventHandler`
- `src/features/chat/ws/useChatWsListeners.ts` — consumer que llama `createWsHandlers` + agrega handlers de chat; usa `useWebSocket` directamente

### Payload del evento WS

```ts
interface WithdrawalUpdatedPayload {
  id: string
  status: string  // 'sent' | 'failed'
  net: { amount: string; currency: string }
}
```

El evento `event_type` es `withdrawal.updated`.

### Cambios en `src/shared/ws/handlers.ts`

Añadir el handler en `createWsHandlers`:

```ts
import { getGetMyWalletQueryKey, getListMyWithdrawalsQueryKey, getGetMyWithdrawalQueryKey } from '#/shared/api/generated/creator/creator'

// Dentro del return de createWsHandlers, añadir:
'withdrawal.updated': (envelope) => {
  const payload = (envelope as DomainEventEnvelope<{ id: string; status: string; net: { amount: string; currency: string } }>).payload

  // Invalidar wallet (balance puede haber cambiado si falló y se revirtió)
  void queryClient.invalidateQueries({ queryKey: getGetMyWalletQueryKey() })

  // Invalidar historial de retiros
  void queryClient.invalidateQueries({ queryKey: getListMyWithdrawalsQueryKey({}) })

  // Invalidar detalle del retiro específico (si está en cache)
  void queryClient.invalidateQueries({ queryKey: getGetMyWithdrawalQueryKey(payload.id) })
},
```

Usar los helpers generados `getGetMyWithdrawalQueryKey(id)` para el detalle (NO hardcodear `['my-withdrawal', payload.id]`).

### Hook `src/features/earnings/hooks/useWithdrawalWsListener.ts`

**Decisión resuelta**: `EarningsPage` se monta en `/_creator/earnings` (ver `src/routes/_creator/earnings.tsx`), que está **fuera** del `WorkspaceLayout` (que vive en `src/routes/workspace.tsx`). El WS de chat (`useChatWsListeners`) solo está activo dentro del workspace. Por lo tanto, **el hook separado ES necesario** para que la earnings page reciba eventos WS.

```ts
import { useWebSocket } from '#/shared/ws/useWebSocket'
import { useQueryClient } from '@tanstack/react-query'
import { getGetMyWalletQueryKey, getListMyWithdrawalsQueryKey, getGetMyWithdrawalQueryKey } from '#/shared/api/generated/creator/creator'
import type { DomainEventEnvelope } from '#/shared/ws/events'

interface WithdrawalUpdatedPayload {
  id: string
  status: string
  net: { amount: string; currency: string }
}

export function useWithdrawalWsListener() {
  const queryClient = useQueryClient()

  useWebSocket({
    enabled: true,
    handlers: {
      'withdrawal.updated': (envelope) => {
        const payload = (envelope as DomainEventEnvelope<WithdrawalUpdatedPayload>).payload

        void queryClient.invalidateQueries({ queryKey: getGetMyWalletQueryKey() })
        void queryClient.invalidateQueries({ queryKey: getListMyWithdrawalsQueryKey({}) })
        void queryClient.invalidateQueries({ queryKey: getGetMyWithdrawalQueryKey(payload.id) })
      },
    },
  })
}
```

El handler duplica la lógica de invalidación de `createWsHandlers` intencionalmente: si el WS de chat también está abierto (porque el usuario navega entre workspace y earnings), el evento se procesa dos veces pero `invalidateQueries` es idempotente.

### Wiring en `EarningsPage.tsx`

```tsx
import { useWithdrawalWsListener } from '../hooks/useWithdrawalWsListener'

// Dentro de EarningsPage:
useWithdrawalWsListener()
```

### Tests

`src/shared/ws/__tests__/handlers.test.ts` (el archivo ya existe con ese nombre — actualizar):
```ts
describe('withdrawal.updated handler', () => {
  it('invalida wallet query cuando llega el evento', () => {
    const queryClient = createTestQueryClient()
    const handlers = createWsHandlers(queryClient)
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    handlers['withdrawal.updated']?.({
      event_type: 'withdrawal.updated',
      payload: { id: 'w-1', status: 'sent', net: { amount: '97.50', currency: 'USD' } },
      occurred_at: new Date().toISOString(),
      actor_account_id: null,
    })

    expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: getGetMyWalletQueryKey() }))
    expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: getListMyWithdrawalsQueryKey({}) }))
    expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: getGetMyWithdrawalQueryKey('w-1') }))
  })
})
```

`src/features/earnings/hooks/__tests__/useWithdrawalWsListener.test.ts`:
- Hook llama `useWebSocket` con handler `withdrawal.updated`
- Handler invalida wallet, historial y detalle

## Acceptance

- [ ] Handler `withdrawal.updated` añadido en `createWsHandlers` en `src/shared/ws/handlers.ts`
- [ ] Handler invalida `getGetMyWalletQueryKey()` al recibir el evento
- [ ] Handler invalida `getListMyWithdrawalsQueryKey({})` al recibir el evento
- [ ] Handler invalida `getGetMyWithdrawalQueryKey(payload.id)` al recibir el evento (usando helper generado, no key hardcodeada)
- [ ] Hook `useWithdrawalWsListener` creado en `src/features/earnings/hooks/useWithdrawalWsListener.ts`
- [ ] Hook conectado en `EarningsPage` (necesario porque `/_creator/earnings` está fuera del `WorkspaceLayout`)
- [ ] Tests del handler en `handlers.test.ts` verifican las 3 invalidaciones
- [ ] `pnpm quality-gates` en verde

## Done summary
Implemented fn-33-feat-ach-withdrawals-creator-wallet.6; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: