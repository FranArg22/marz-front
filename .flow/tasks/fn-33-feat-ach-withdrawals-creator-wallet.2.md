# fn-33-feat-ach-withdrawals-creator-wallet.2 WithdrawButton + W8benGateModal

## Description

Crear `WithdrawButton` y `W8benGateModal` en `src/features/earnings/components/`. El botón recibe los datos de elegibilidad del wallet (de task 1) y renderiza el estado correcto. El modal W-8BEN es un interstitial que redirige al usuario a `pagos.go-marz.com`.

### Dependencia de task 1

Task 1 provee `wallet: Wallet | undefined` en `EarningsPage`. Este botón se pasa como `withdrawButton` prop al grid. La prop `wallet` llega directamente al `WithdrawButton`.

### `src/features/earnings/components/WithdrawButton.tsx`

```ts
interface WithdrawButtonProps {
  wallet: Wallet | undefined     // undefined = loading
  onWithdraw: () => void         // abre WithdrawalModal (task 3)
}
```

**Estados del botón:**

1. **Loading** (`wallet === undefined`): `<Skeleton className="h-9 w-32" />` (o botón deshabilitado con skeleton)

2. **Gating W-8BEN** (`wallet.eligibility.requires_w8ben === true && !wallet.can_withdraw` cuando la razón es w8ben):
   - Botón primario: "Completar formulario W-8BEN"
   - Click → abre `W8benGateModal` (pasa `w8ben_redirect_url`)

3. **Sin cuenta de cobro** (`!wallet.eligibility.has_payout_account && !wallet.eligibility.requires_w8ben`):
   - Botón: "Agregar cuenta de cobro" — click abre `PayoutAccountModal` (el existente en `src/features/payments/settings/PayoutAccountModal.tsx`)
   - Importar `PayoutAccountModal` y renderizarlo aquí, pasando `account={null}` y `open/onOpenChange`

4. **In-flight** (`wallet.eligibility.has_inflight_withdrawal`):
   - Botón deshabilitado, texto "Retiro en proceso"
   - `title` / `aria-label` describiendo el estado

5. **Habilitado** (`wallet.can_withdraw === true`):
   - Botón primario: "Retirar"
   - Click → `onWithdraw()` (abre WithdrawalModal — task 3)

6. **Balance insuficiente / debajo del mínimo** (`!wallet.can_withdraw && wallet.balance.amount === '0.00'` o monto < mínimo):
   - Botón deshabilitado, texto "Retirar" (sin explicación en el botón; el balance de $0 es obvio)

**Prioridad de estados** (cuando varios aplican): W-8BEN > sin cuenta > in-flight > balance insuficiente > habilitado.

**Implementación**:
```tsx
export function WithdrawButton({ wallet, onWithdraw }: WithdrawButtonProps) {
  const [w8benOpen, setW8benOpen] = useState(false)
  const [payoutOpen, setPayoutOpen] = useState(false)

  if (!wallet) {
    return <Skeleton className="h-9 w-32" />
  }

  const { eligibility, can_withdraw } = wallet

  if (eligibility.requires_w8ben) {
    return (
      <>
        <Button onClick={() => setW8benOpen(true)}>
          <Trans>Completar formulario W-8BEN</Trans>
        </Button>
        <W8benGateModal
          open={w8benOpen}
          redirectUrl={eligibility.w8ben_redirect_url}
          onOpenChange={setW8benOpen}
        />
      </>
    )
  }

  if (!eligibility.has_payout_account) {
    return (
      <>
        <Button onClick={() => setPayoutOpen(true)}>
          <Trans>Agregar cuenta de cobro</Trans>
        </Button>
        <PayoutAccountModal open={payoutOpen} account={null} onOpenChange={setPayoutOpen} />
      </>
    )
  }

  if (eligibility.has_inflight_withdrawal) {
    return (
      <Button disabled title={t`Tenés un retiro en proceso`}>
        <Trans>Retiro en proceso</Trans>
      </Button>
    )
  }

  return (
    <Button onClick={onWithdraw} disabled={!can_withdraw}>
      <Trans>Retirar</Trans>
    </Button>
  )
}
```

### `src/features/earnings/components/W8benGateModal.tsx`

Modal interstitial que explica el formulario W-8BEN y tiene un botón para ir a `pagos.go-marz.com`.

```ts
interface W8benGateModalProps {
  open: boolean
  redirectUrl: string | null
  onOpenChange: (open: boolean) => void
}
```

Contenido:
- Título: "Formulario W-8BEN requerido"
- Descripción: "Para recibir pagos en USD desde Estados Unidos, necesitás completar el formulario W-8BEN. Es un trámite rápido (5-10 minutos)."
- Botón primario: "Completar formulario" → `window.open(redirectUrl, '_blank')` si `redirectUrl` no es null; si es null, botón deshabilitado
- Botón secundario: "Cancelar" → `onOpenChange(false)`

Usar `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter` de `#/components/ui/dialog`.

### Wiring en `EarningsPage.tsx`

```tsx
// En EarningsPage, agregar estado para el modal de retiro
const [withdrawOpen, setWithdrawOpen] = useState(false)

// Pasar al grid:
<EarningsKpiGrid
  kpis={earningsQuery.data.kpis}
  wallet={walletQuery.data}
  withdrawButton={
    <WithdrawButton
      wallet={walletQuery.data}
      onWithdraw={() => setWithdrawOpen(true)}
    />
  }
/>
// WithdrawalModal se añade en task 3
```

### Tests

`src/features/earnings/components/__tests__/WithdrawButton.test.tsx`:
- Estado loading (wallet=undefined) → renderiza skeleton
- Estado W-8BEN requerido → botón "Completar formulario W-8BEN" visible; click abre modal
- Estado sin cuenta → botón "Agregar cuenta de cobro" visible
- Estado in-flight → botón deshabilitado con texto "Retiro en proceso"
- Estado habilitado → botón "Retirar" activo; click llama `onWithdraw`
- Estado balance $0 → botón "Retirar" deshabilitado

## Acceptance

- [ ] `WithdrawButton` renderiza estado loading (skeleton) cuando `wallet` es undefined
- [ ] Estado W-8BEN: botón "Completar formulario W-8BEN"; click abre `W8benGateModal`
- [ ] Estado sin cuenta: botón "Agregar cuenta de cobro"; click abre `PayoutAccountModal` existente con `account={null}`
- [ ] Estado in-flight: botón deshabilitado "Retiro en proceso"
- [ ] Estado habilitado: botón "Retirar" activo; click llama `onWithdraw`
- [ ] `W8benGateModal`: título, descripción, botón "Completar formulario" que abre redirectUrl en nueva pestaña
- [ ] `W8benGateModal`: botón deshabilitado cuando `redirectUrl` es null
- [ ] `WithdrawButton` conectado en `EarningsPage` vía prop `withdrawButton` del grid
- [ ] Tests del `WithdrawButton` verifican todos los estados
- [ ] `pnpm quality-gates` en verde

## Done summary
Implemented fn-33-feat-ach-withdrawals-creator-wallet.2; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: