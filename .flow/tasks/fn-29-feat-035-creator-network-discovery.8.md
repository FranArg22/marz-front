# fn-29-feat-035-creator-network-discovery.8 — Modo Seleccionar + InviteBulkModal

## Description

Toggle "Seleccionar" que activa checkboxes en las cards (solo las que pueden recibir invite). Store de selección con `Set<string>` (account_ids). Botón flotante "Invitar (N)" abre el `InviteBulkModal`. La nota es única para todos los seleccionados. El mensaje de éxito muestra N enviadas / M omitidas según el response de `CreateConnectionRequestsBulkResponse`.

**Size:** M

## Store: selección en `discoveryFiltersStore`

Agregar a `src/features/discovery/network/store/discoveryFiltersStore.ts`:

```ts
// Agregar al estado del store existente:
selectedAccountIds: Set<string>
selectionMode: boolean

// Agregar acciones:
toggleSelectionMode: () => void
toggleSelect: (accountId: string) => void
clearSelection: () => void
```

```ts
selectedAccountIds: new Set<string>(),
selectionMode: false,
toggleSelectionMode: () => set((state) => ({
  selectionMode: !state.selectionMode,
  selectedAccountIds: new Set(), // limpiar selección al cambiar de modo
})),
toggleSelect: (accountId) => set((state) => {
  const next = new Set(state.selectedAccountIds)
  if (next.has(accountId)) {
    next.delete(accountId)
  } else {
    next.add(accountId)
  }
  return { selectedAccountIds: next }
}),
clearSelection: () => set({ selectedAccountIds: new Set() }),
```

**Nota**: `Set` en Zustand no es reactivo por reference equality. Al hacer `set({ selectedAccountIds: new Set(state.selectedAccountIds) })`, se crea una nueva instancia y React re-renderiza correctamente. Asegurar siempre crear un `new Set()` en las acciones que modifican el set.

## Botón "Seleccionar" en la ruta

En `src/routes/_brand/discovery.tsx`:

```tsx
const { selectionMode, toggleSelectionMode, selectedAccountIds } = useDiscoveryFiltersStore()

// Botón toggle sobre el grid (al lado del botón Filtros):
<Button
  type="button"
  variant={selectionMode ? 'secondary' : 'outline'}
  size="sm"
  onClick={toggleSelectionMode}
>
  {selectionMode ? t`Cancelar selección` : t`Seleccionar`}
</Button>

// Botón flotante cuando hay selección:
{selectionMode && selectedAccountIds.size > 0 && (
  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
    <Button type="button" onClick={() => setBulkModalOpen(true)}>
      {t`Invitar (${selectedAccountIds.size})`}
    </Button>
  </div>
)}
```

## Props de CreatorCard (actualizar task .6)

En `src/features/discovery/network/components/CreatorCard.tsx`, las props `selected`, `selectionMode` y `onToggleSelect` ya están previstas desde la task .6. Conectarlas al store en la ruta:

```tsx
renderCard={(card) => (
  <CreatorCard
    card={card}
    onInvite={(card) => { setSelectedCard(card); setInviteModalOpen(true) }}
    selected={selectedAccountIds.has(card.account_id)}
    selectionMode={selectionMode}
    onToggleSelect={toggleSelect}
  />
)}
```

Cuando `selectionMode=true`, el checkbox de la card está habilitado solo si `canInvite` (pair_state = no_contact, connection_rejected, connection_expired). Las cards con pair_state activo tienen checkbox deshabilitado.

## Componente: `src/features/discovery/network/components/InviteBulkModal.tsx`

```tsx
interface InviteBulkModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accountIds: string[]
}
```

### Estructura

```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>{t`Invitar a ${accountIds.length} creators`}</DialogTitle>
    </DialogHeader>

    <p className="text-sm text-muted-foreground">
      {t`Se enviará la misma nota a todos los creators seleccionados.`}
    </p>

    <div className="space-y-2">
      <label className="text-sm font-medium">{t`Nota (opcional)`}</label>
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={1000}
        placeholder={t`Contale por qué querés trabajar con estos creators...`}
        rows={4}
      />
      <p className="text-xs text-muted-foreground text-right">{note.length}/1000</p>
    </div>

    <DialogFooter>
      <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
        {t`Cancelar`}
      </Button>
      <Button type="button" onClick={handleSubmit} disabled={mutation.isPending}>
        {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        {t`Enviar invitaciones`}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Mutation

Usar `useCreateDiscoveryConnectionRequestsBulk` de `brand.ts` (mutation generada por Orval). Wrapearlo con idempotency:

```ts
// En handleSubmit:
const idempotencyKey = generateIdempotencyKey()
mutation.mutate(
  { creator_account_ids: accountIds, note: note.trim() || null },
  {
    headers: { 'Idempotency-Key': idempotencyKey }
  }
)
```

O usar `useIdempotencyKey` con fingerprint basado en `accountIds.join(',')`.

### Mensaje de éxito

El response es `CreateConnectionRequestsBulkResponse`:
```ts
{
  created: CreatedItem[]        // los que se enviaron
  skipped: SkippedItem[]        // los omitidos con reason
  summary: { created_count, skipped_count }
}
```

En `onSuccess`:
```ts
const { created_count, skipped_count } = data.summary
if (skipped_count === 0) {
  toast.success(t`Se enviaron ${created_count} invitaciones.`)
} else {
  toast.success(
    t`Se enviaron ${created_count} invitaciones. ${skipped_count} creators fueron omitidos porque ya tienen una invitación pendiente, conversación activa u oferta activa.`
  )
}
// Invalidar grid + limpiar selección
await queryClient.invalidateQueries({ queryKey: ['discovery', 'creators'] })
clearSelection()
toggleSelectionMode()
onOpenChange(false)
```

## Acceptance

- [ ] Toggle "Seleccionar" activa checkboxes en las cards.
- [ ] Cards con `pair_state ≠ no_contact/rejected/expired` tienen checkbox deshabilitado.
- [ ] Selección persiste al hacer scroll / cargar más páginas.
- [ ] Selección se resetea al desactivar el modo de selección.
- [ ] Botón flotante "Invitar (N)" muestra conteo y abre modal.
- [ ] Modal muestra nota única y CTA "Enviar invitaciones".
- [ ] En éxito: toast con "N enviadas. M omitidas..." + grid invalidado + selección limpiada.
- [ ] `pnpm typecheck` verde.

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
