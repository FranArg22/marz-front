# fn-33-feat-ach-withdrawals-creator-wallet.7 Analytics: eventos de retiro y W-8BEN

## Description

Añadir los eventos de analytics de retiros y W-8BEN a `src/shared/analytics/track.ts`, crear las funciones de tracking en `src/features/earnings/analytics.ts`, y cablearlas en los componentes/mutations de tasks anteriores.

### Eventos a añadir en `src/shared/analytics/track.ts`

El tipo `AnalyticsEvent` es una union de strings literales. Añadir al final (el archivo actualmente tiene ~60 eventos):

```ts
| 'withdrawal_requested'      // usuario confirma retiro exitosamente
| 'withdrawal_cancelled'      // usuario cancela retiro (si se implementa cancelación en UI)
| 'withdrawal_state_changed'  // WS notifica cambio de estado (sent/failed)
| 'w8ben_redirect_clicked'    // usuario clickea "Completar formulario W-8BEN"
```

### Funciones en `src/features/earnings/analytics.ts`

Añadir al final del archivo existente (que ya tiene `trackEarningsViewed`, `trackEarningsPeriodChanged`, etc.):

```ts
export type WithdrawalRequestedPayload = Record<string, unknown> & {
  gross_amount: string
  fee_amount: string
  net_amount: string
  currency: string
}

export type WithdrawalStateChangedPayload = Record<string, unknown> & {
  withdrawal_id: string
  new_status: string
}

export type WithdrawalCancelledPayload = Record<string, unknown> & {
  withdrawal_id: string
}

export function trackWithdrawalRequested(
  payload: WithdrawalRequestedPayload,
): void {
  track('withdrawal_requested', payload)
}

export function trackWithdrawalStateChanged(
  payload: WithdrawalStateChangedPayload,
): void {
  track('withdrawal_state_changed', payload)
}

export function trackWithdrawalCancelled(
  payload: WithdrawalCancelledPayload,
): void {
  track('withdrawal_cancelled', payload)
}

export function trackW8benRedirectClicked(): void {
  track('w8ben_redirect_clicked')
}
```

### Wiring en componentes

**`WithdrawButton.tsx` (task 2)** — en el botón W-8BEN:
```tsx
<Button onClick={() => {
  trackW8benRedirectClicked()
  setW8benOpen(true)
}}>
```

O bien dentro del `W8benGateModal` cuando el usuario hace click en "Completar formulario":
```tsx
<Button onClick={() => {
  trackW8benRedirectClicked()
  if (redirectUrl) window.open(redirectUrl, '_blank')
}}>
```

**`WithdrawalModal.tsx` (task 3)** — en `onSuccess` de la mutation:
```tsx
onSuccess: () => {
  trackWithdrawalRequested({
    gross_amount: grossStr,
    fee_amount: feeStr,
    net_amount: netStr,
    currency: 'USD',
  })
  void queryClient.invalidateQueries({ queryKey: getWalletQueryKey() })
  void queryClient.invalidateQueries({ queryKey: getWithdrawalsQueryKey() })
},
```

**WS handler (task 6)** — en el handler `withdrawal.updated`:
```ts
// En handlers.ts
import { track } from '#/shared/analytics/track'

'withdrawal.updated': (envelope) => {
  const payload = ...
  track('withdrawal_state_changed', {
    withdrawal_id: payload.id,
    new_status: payload.status,
  })
  // invalidaciones...
}
```

**Nota sobre arquitectura**: `handlers.ts` actualmente no importa nada de analytics. Si se quiere mantener el archivo limpio de dependencias de features, se puede: (a) pasar un callback `onWithdrawalStateChanged` a `createWsHandlers`, o (b) importar `track` directamente (es una función shared, no feature-specific). Preferir (b) por simplicidad.

### Tests en `src/features/earnings/analytics.test.ts`

El archivo `analytics.test.ts` ya existe. Añadir tests para las nuevas funciones:

```ts
describe('withdrawal analytics', () => {
  it('trackWithdrawalRequested calls track with correct event name', () => {
    // usar el patrón existente del archivo
    trackWithdrawalRequested({ gross_amount: '100.00', fee_amount: '2.50', net_amount: '97.50', currency: 'USD' })
    expect(capturedEvents).toContainEqual(
      expect.objectContaining({ event: 'withdrawal_requested' })
    )
  })

  it('trackW8benRedirectClicked calls track with correct event name', () => {
    trackW8benRedirectClicked()
    expect(capturedEvents).toContainEqual(
      expect.objectContaining({ event: 'w8ben_redirect_clicked' })
    )
  })
})
```

Ver el patrón de test del archivo existente para saber cómo capturar eventos (puede usar `vi.spyOn` sobre `track` o un mock).

## Acceptance

- [ ] Eventos `withdrawal_requested`, `withdrawal_cancelled`, `withdrawal_state_changed`, `w8ben_redirect_clicked` añadidos al tipo `AnalyticsEvent` en `track.ts`
- [ ] Funciones `trackWithdrawalRequested`, `trackWithdrawalStateChanged`, `trackWithdrawalCancelled`, `trackW8benRedirectClicked` creadas en `src/features/earnings/analytics.ts`
- [ ] `trackWithdrawalRequested` llamada en `onSuccess` de `useCreateWithdrawalMutation` (o en `WithdrawalModal`)
- [ ] `trackW8benRedirectClicked` llamada cuando usuario hace click en "Completar formulario W-8BEN"
- [ ] `trackWithdrawalStateChanged` llamada en el handler WS `withdrawal.updated`
- [ ] Tests de analytics pasan
- [ ] `pnpm quality-gates` en verde (incluyendo `check:i18n-standards` para verificar que no quedan strings sin traducir en los nuevos componentes)

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
