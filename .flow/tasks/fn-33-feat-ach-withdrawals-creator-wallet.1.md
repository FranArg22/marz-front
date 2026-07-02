# fn-33-feat-ach-withdrawals-creator-wallet.1 EarningsKpiGrid: 3 KPIs + Balance disponible + línea no-retirable

## Description

Reescribir `EarningsKpiGrid` para pasar de 4 a 3 KPIs + una tarjeta de "Balance disponible" con slot de botón + una línea "Pendiente (no retirable)". Crear el hook `useWalletQuery` en `src/features/earnings/hooks/`. Wiring en `EarningsPage`.

### Estado actual

`src/features/earnings/components/EarningsKpiGrid.tsx` muestra 4 KPIs:
1. Total ganado
2. Ganado en el período
3. Pago pendiente
4. **Próximo pago** ← ELIMINAR

`EarningsPage.tsx` usa `earningsQuery.data.kpis` (tipo `CreatorEarningsKPI`) para alimentar el grid.

### Conflicto de nombre `Wallet`

El archivo actual importa `Wallet` como ícono de lucide-react:
```ts
import { CalendarDays, Hourglass, TrendingUp, Wallet } from 'lucide-react'
```

Al importar el tipo `Wallet` del modelo API se produce una colisión. Renombrar el ícono de lucide a `WalletIcon`:
```ts
import { CalendarDays, Hourglass, TrendingUp, Wallet as WalletIcon } from 'lucide-react'
import type { Wallet } from '#/shared/api/generated/model'
```
Actualizar las referencias al ícono en el componente de `Wallet` → `WalletIcon`.

### Cambios requeridos

**1. Nuevo hook `src/features/earnings/hooks/useWalletQuery.ts`**

```ts
import { useGetMyWallet, getGetMyWalletQueryKey } from '#/shared/api/generated/creator/creator'
import type { Wallet } from '#/shared/api/generated/model'

export function getWalletQueryKey() {
  return getGetMyWalletQueryKey()
}

export function useWalletQuery() {
  return useGetMyWallet({
    query: {
      queryKey: getWalletQueryKey(),
      select: (response): Wallet => {
        if (response.status === 200) return response.data
        throw new Error('Unexpected wallet response')
      },
    },
  })
}
```

**2. `EarningsKpiGrid.tsx` — nuevo contrato**

Props:
```ts
interface EarningsKpiGridProps {
  kpis: CreatorEarningsKPI           // igual que antes
  wallet: Wallet | undefined         // nuevo; undefined mientras carga
  withdrawButton?: ReactNode         // slot para WithdrawButton (task 2)
}
```

Layout nuevo (4 cols en xl, 2 en md):
- Col 1: "Total ganado" (igual)
- Col 2: "Ganado en el período" (igual)
- Col 3: **"Balance disponible"** — valor = `wallet?.balance.amount` formateado en USD (bruto). Tarjeta con `border-primary`. En col 4 (o debajo en mobile): slot `withdrawButton`.
- Col 4: **slot `withdrawButton`** — en desktop se puede integrar en col 3 como footer de la tarjeta, o como tarjeta separada. Elegir lo que quede más limpio sin card wrapper extra. Mientras `wallet` es undefined → skeleton de `h-[118px]`.
- **Eliminar** la KPI "Pago pendiente" y "Próximo pago".

**Línea "Pendiente (no retirable)"** debajo del grid (fuera del `<section>` del grid):
```tsx
{(kpis.pending_payout.amount !== '0' || kpis.next_payout.amount !== '0') && (
  <div className="flex items-center gap-2 text-sm text-muted-foreground">
    <Hourglass className="size-3.5 shrink-0 text-warning" aria-hidden />
    <span>
      <Trans>Pendiente (no retirable):</Trans>{' '}
      <span className="font-medium text-foreground">
        {formatMoney(totalPendingNonWithdrawable(kpis))}
      </span>
    </span>
  </div>
)}
```

`totalPendingNonWithdrawable` = suma de `kpis.pending_payout.amount` + `kpis.next_payout.amount` (plata de marcas free + cola pre-lanzamiento). Calcular como `Number(a) + Number(b)`.

**Formatters** — ya existen en el archivo, quedan en módulo scope (React Doctor):
```ts
const moneyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
```

**3. `EarningsPage.tsx` — wiring**

- Importar `useWalletQuery` y llamarlo junto a `useCreatorEarningsQuery`
- Pasar `wallet={walletQuery.data}` y `withdrawButton={<WithdrawButton />}` al `EarningsKpiGrid`  
  (Para esta task, `withdrawButton` puede ser `undefined` — task 2 lo provee)
- El skeleton de EarningsPage (cuando `isLoading`) debe incluir 4 placeholders de `h-[118px]` (3 KPIs + Balance) → ajustar `EARNINGS_KPI_SKELETON_IDS` a 4 items

**4. `EarningsKpiGrid.test.tsx` / tests existentes**

Crear `src/features/earnings/components/__tests__/EarningsKpiGrid.test.tsx` (o actualizar si ya existe) verificando:
- Renderiza "Total ganado", "Ganado en el período", "Balance disponible"
- NO renderiza "Próximo pago" ni "Pago pendiente"
- Línea "Pendiente (no retirable)" visible cuando `pending_payout.amount !== '0'`
- Línea oculta cuando ambos montos son `'0'`

## Acceptance

- [ ] `EarningsKpiGrid` tiene 3 KPIs (Total ganado, Ganado en el período, Balance disponible) — "Próximo pago" y "Pago pendiente" eliminados
- [ ] "Balance disponible" muestra `wallet.balance.amount` formateado en USD (bruto), con border-primary
- [ ] Mientras `wallet` es undefined, la tarjeta de Balance muestra skeleton `animate-pulse h-[118px]`
- [ ] Línea "Pendiente (no retirable)" visible cuando `pending_payout + next_payout > 0`
- [ ] Slot `withdrawButton` renderizado en la tarjeta de Balance (vacío en esta task)
- [ ] `useWalletQuery` creado en `src/features/earnings/hooks/useWalletQuery.ts`
- [ ] `EarningsPage` llama a `useWalletQuery` y pasa `wallet` al grid
- [ ] Ícono `Wallet` de lucide renombrado a `WalletIcon` para evitar colisión con el tipo `Wallet` del modelo API
- [ ] Tests de `EarningsKpiGrid` pasan con el nuevo layout
- [ ] `pnpm quality-gates` en verde

## Done summary
Implemented fn-33-feat-ach-withdrawals-creator-wallet.1; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: