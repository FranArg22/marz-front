# fn-25-feat-027-paid-offer-charge-capture.7 Conversation + Inbox: manejar ?send_offer_result (toast + limpiar param)

## Description

Extender las rutas de conversación e inbox para leer el query param `?send_offer_result` que llega de `CheckoutReturnPage` (F.5), mostrar el toast correspondiente y limpiar el param del URL.

## Rutas a modificar

### `src/routes/workspace.conversations.$conversationId.tsx`

**Search schema existente:**
```typescript
export const conversationSearchSchema = z.object({
  // ... campos existentes
})
```

Agregar `send_offer_result: z.enum(['success', 'cancelled', 'failed']).optional()` al schema existente.

**En el componente**, leer el param y mostrar toast:
```typescript
const search = Route.useSearch()
const navigate = useNavigate()

useEffect(() => {
  if (!search.send_offer_result) return

  if (search.send_offer_result === 'success') {
    toast.success(t`Offer enviada`)
  } else if (search.send_offer_result === 'cancelled') {
    toast(t`Volviste sin enviar la offer`)  // neutral
  } else if (search.send_offer_result === 'failed') {
    toast.error(t`No pudimos procesar tu tarjeta. Probá de nuevo o gestioná tu tarjeta.`)
  }

  // limpiar el param del URL
  void navigate({
    search: (prev) => {
      const { send_offer_result: _, ...rest } = prev
      return rest
    },
    replace: true,
  })
}, [search.send_offer_result, navigate])
```

**Nota:** el `useEffect` debe depender de `search.send_offer_result`. Limpiar el param inmediatamente después de mostrar el toast para no re-mostrar en navegaciones futuras.

### `src/routes/inbox.tsx`

**Search schema existente:** importa `inboxSearchSchema` de `src/features/inbox/inboxSearchSchema.ts`.

Agregar `send_offer_result: z.enum(['success', 'cancelled', 'failed']).optional()` al schema en `src/features/inbox/inboxSearchSchema.ts`.

**En el componente**, misma lógica que la conversación (leer param, toast, limpiar).

## Tests

### `src/routes/workspace.conversations.$conversationId.test.ts` (ya existe — agregar casos)

- Render con `search.send_offer_result='success'` → toast de éxito visible + `navigate` llamado con `replace:true` sin `send_offer_result`.
- Render con `search.send_offer_result='cancelled'` → toast neutro visible + limpieza.
- Render con `search.send_offer_result='failed'` → toast de error visible + limpieza.
- Render sin `send_offer_result` → ningún toast extra.

### `src/routes/inbox.test.ts` (ya existe — agregar casos)

- Mismos 4 casos.

**Patrón de test existente:** leer `src/routes/workspace.conversations.$conversationId.test.ts` para ver cómo se construye el `RouterProvider` en tests de ruta y cómo se mockea el toast.

## Acceptance

- `inboxSearchSchema` y el schema de conversación incluyen `send_offer_result` opcional.
- Al recibir el param, se muestra el toast correcto y se limpia el param (navegación con `replace: true`).
- Los 3 valores (`success`, `cancelled`, `failed`) y el caso sin param están cubiertos por tests.
- Cero strings hardcoded sin Lingui macro.
- Tests pasan.
- Verify: `pnpm vitest run src/routes/workspace.conversations && pnpm vitest run src/routes/inbox && pnpm lint && pnpm typecheck`

## Done summary
Implemented fn-25-feat-027-paid-offer-charge-capture.7; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: