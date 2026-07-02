# fn-33: FEAT-ACH-WITHDRAWALS — Creator Wallet & Withdrawals UI (Frontend)

## Overview

UI de retiros de balance ACH por Mercury en la pantalla Earnings del creador. El backend ya está vivo en dev y el cliente API ya fue regenerado. Este epic solo toca el frontend.

## Scope

- Pantalla: `src/features/earnings/` — ruta existente, sin rutas nuevas (modales)
- No hay cambios de contrato de API ni regeneración de cliente en este epic

## Approach

El cliente generado está en `src/shared/api/generated/creator/creator.ts`. Hooks disponibles: `useGetMyWallet`, `useCreateWithdrawal`, `useListMyWithdrawals`, `useGetMyWithdrawal`, `useCancelMyWithdrawal`, `useUpsertMyPayoutAccount`.

`PayoutAccountModal` ya existe en `src/features/payments/settings/PayoutAccountModal.tsx` — solo se le añade checksum ABA y se invalida también la wallet key.

Patrón WS: `src/shared/ws/useWebSocket.ts` + factory `createWsHandlers` en `src/shared/ws/handlers.ts`.

Reglas React Doctor (`CLAUDE.md §5`): invalidar queries en mutaciones, sin `new Date()` en render, `Intl.*` hoisteado a módulo, no índices como keys, `font-semibold` en headings, `size-N` shorthand.

## Contratos de API

```
GET  /v1/creators/me/wallet           → Wallet
POST /v1/creators/me/withdrawals      → CreateWithdrawalResponse  (header: Idempotency-Key)
GET  /v1/creators/me/withdrawals      → ListMyWithdrawals200
GET  /v1/creators/me/withdrawals/{id} → Withdrawal
POST /v1/creators/me/withdrawals/{id}/cancel → CancelMyWithdrawal200
PUT  /v1/creators/me/payout-account   → ya existía
WS   withdrawal.updated               → { id, status, net }
```

Modelos generados: `Wallet`, `WithdrawalEligibility`, `MoneyAmount`, `Withdrawal`, `WithdrawalListItem`, `ListMyWithdrawals200`, `CreateWithdrawalRequest`, `CreateWithdrawalResponse`.

## Quick commands

- `pnpm quality-gates` — lint + typecheck + react-doctor + test + test:e2e + knip
- `pnpm work:post` — format + i18n + quality-gates (correr antes de commit)

## Acceptance

- [ ] EarningsKpiGrid muestra 3 KPIs + Balance disponible (bruto) + línea "Pendiente (no retirable)"
- [ ] "Próximo pago" eliminado del grid
- [ ] WithdrawButton refleja 3 estados: habilitado / in-flight / gating W-8BEN
- [ ] WithdrawalModal muestra desglose bruto/comisión/neto antes del botón Confirmar
- [ ] POST withdrawal envía `Idempotency-Key` header único por intento
- [ ] PayoutAccountModal valida checksum ABA (algoritmo 3-7-1) antes de enviar
- [ ] Después de guardar payout account, la wallet query se invalida
- [ ] WithdrawalsHistory lista retiros con montos netos y estado
- [ ] Retiros en estado "En cola" (requested) muestran acción "Cancelar" que invoca POST cancel
- [ ] Cancelación devuelve saldo al balance (confirmado por invalidación de wallet query)
- [ ] Detalle de retiro muestra bruto / comisión / neto / estado / fechas
- [ ] WS `withdrawal.updated` invalida wallet + historial
- [ ] Eventos de analytics rastreados: `withdrawal_requested`, `withdrawal_state_changed`, `withdrawal_cancelled`, `w8ben_redirect_clicked`
- [ ] `pnpm quality-gates` pasa en verde (incluyendo react-doctor ≥95)
- [ ] E2E: happy path creador retira, ve historial, ve estado "En cola", cancela retiro

## References

- `src/features/earnings/` — pantalla destino
- `src/features/payments/settings/PayoutAccountModal.tsx` — modal de cuenta de cobro existente
- `src/shared/ws/handlers.ts` — factory de handlers WS existente
- `src/shared/api/generated/creator/creator.ts` — cliente generado
- `src/shared/analytics/track.ts` — registro de eventos de analytics
- `src/shared/api/idempotency.ts` — helpers de idempotency key (`generateIdempotencyKey`, `useIdempotencyKey`, `withIdempotencyKey`)
- `src/shared/api/mutator.ts` — `ApiError` class (error real lanzado por mutations, no `ErrorResponse` del modelo generado)