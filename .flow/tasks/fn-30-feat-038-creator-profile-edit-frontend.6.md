# fn-30-feat-038-creator-profile-edit-frontend.6 — WalletSection + modal

## Description

**Size:** M

Implementa la sección Billetera en `src/features/payments/settings/`.

Archivos:
- `src/features/payments/settings/WalletSection.tsx` — importado en `CreatorSettingsPage` como el componente de la sección "billetera".
- `src/features/payments/settings/PayoutAccountCard.tsx` — muestra el estado de la cuenta o empty state.
- `src/features/payments/settings/PayoutAccountModal.tsx` — modal para alta/edición.

Esta sección tiene su **propio query** (`useGetMyPayoutAccount`) y NO recibe `data: CreatorSettingsResponse` como prop (es un BC separado).

**`WalletSection`** NO usa `SectionSaveBar`. El guardado es exclusivo del modal.

### WalletSection

```tsx
function WalletSection() {
  const [modalOpen, setModalOpen] = useState(false)
  const { data, isPending } = useGetMyPayoutAccount()

  const account = data?.status === 200 ? data.data.account : null

  return (
    <>
      <PayoutAccountCard
        account={account}
        isLoading={isPending}
        onEdit={() => setModalOpen(true)}
      />
      <PayoutAccountModal
        open={modalOpen}
        account={account}  // null = alta; non-null = edición
        onOpenChange={setModalOpen}
      />
    </>
  )
}
```

### PayoutAccountCard

Props: `{ account: PayoutAccount | null, isLoading: boolean, onEdit: () => void }`

- `isLoading`: skeleton.
- `account === null`: empty state + botón "Agregar cuenta de cobro" → `onEdit()`.
- `account !== null`: resumen de la cuenta (`account_type`, `holder_name`, `provider_name`, `identifier` parcialmente enmascarado, `country`) + badge "Activa" + botón "Editar" → `onEdit()`.

### PayoutAccountModal

Props: `{ open: boolean, account: PayoutAccount | null, onOpenChange: (open: boolean) => void }`

Form con TanStack Form + Zod:

```ts
const PayoutAccountSchema = z.object({
  account_type: z.enum(['bank', 'external_app']),
  holder_name: z.string().min(1).max(200),
  provider_name: z.string().min(1).max(200),
  identifier: z.string().min(1).max(200),
  country: z.string().length(2),
})
```

Campos del form (4 + selector de tipo):
1. Selector `account_type`: "Banco" (`bank`) / "Aplicación o billetera virtual" (`external_app`). Radio buttons o select.
2. `holder_name`: "Titular de la cuenta"
3. `provider_name`: "Banco o proveedor" (label cambia según `account_type` seleccionado: "Banco" si `bank`, "Proveedor" si `external_app`)
4. `identifier`: "Identificador (CBU, IBAN, email, alias…)"
5. `country`: "País" — mismo componente de país del resto de la app o select de ISO2.

Nota fija (no editable) dentro del modal: **"Marz transfiere en USD. Tu banco o proveedor se encarga de la conversión a moneda local si aplica."**

Botones:
- "Cancelar" → `onOpenChange(false)` sin guardar.
- "Guardar" → `useUpsertMyPayoutAccount.mutateAsync({ data: formValues })`.

Tras guardado exitoso: invalidar `getGetMyPayoutAccountQueryKey()`, cerrar modal.

### Hooks importados

```ts
import {
  useGetMyPayoutAccount,
  useUpsertMyPayoutAccount,
  getGetMyPayoutAccountQueryKey,
} from '#/shared/api/generated/creator/creator'
```

### Accesibilidad del modal

- Focus trap dentro del modal mientras está abierto.
- Cerrar con Escape → equivalente a cancelar.
- El modal usa el componente `Dialog` del design system (`#/components/ui/dialog`), que ya implementa focus trap + Esc.

## Acceptance

- [ ] Al montar sin cuenta: empty state visible + botón "Agregar cuenta de cobro".
- [ ] Click "Agregar cuenta de cobro" → abre modal en blanco.
- [ ] Modal: los 4 campos requeridos (titular, proveedor, identificador, país) + selector de tipo; enviar con alguno vacío → error de validación; mutation no se llama.
- [ ] Modal: "Marz transfiere en USD…" visible como texto fijo.
- [ ] Modal cancelar → modal cierra; query NO se invalida; cuenta sin cambios.
- [ ] Guardar alta exitosa → modal cierra; `PayoutAccountCard` muestra resumen con badge "Activa".
- [ ] Guardar edición (bank → external_app) exitosa → card muestra el nuevo tipo.
- [ ] Unit test schema: los 4 campos requeridos; titular de 201 chars → error; country de 1 char → error; country de 3 chars → error.
- [ ] Focus trap: Tab al último elemento del modal → foco vuelve al primero (comportamiento del componente Dialog existente; no requiere implementación custom).
- [ ] `pnpm typecheck` verde.

## Done summary
Implemented fn-30-feat-038-creator-profile-edit-frontend.6; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: