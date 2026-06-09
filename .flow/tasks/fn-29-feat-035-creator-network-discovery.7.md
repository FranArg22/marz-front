# fn-29-feat-035-creator-network-discovery.7 — InviteSingleModal + mutation useCreateConnectionRequest

## Description

Modal de invitación single que muestra info del creator, un textarea opcional para la nota (máx 1000 chars), y CTA "Enviar invitación". Usa `useCreateDiscoveryConnectionRequest` del cliente generado. En éxito: toast + invalidate del grid para refrescar el `pair_state` de la card. Manejo de errores tipados (409 already_pending, has_conversation, has_active_offer).

**Size:** M

## Hook: `src/features/discovery/network/hooks/useCreateConnectionRequestMutation.ts`

```ts
import { t } from '@lingui/core/macro'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useCreateDiscoveryConnectionRequest } from '#/shared/api/generated/brand/brand'
import type { CreateConnectionRequestRequest } from '#/shared/api/generated/model'
import { ApiError } from '#/shared/api/mutator'
import { useIdempotencyKey, withIdempotencyKey } from '#/shared/api/idempotency'

import { getDiscoveryCreatorsQueryKey } from './useDiscoveryCreatorsInfiniteQuery'

export function useCreateConnectionRequestMutation(
  appliedParams: Parameters<typeof getDiscoveryCreatorsQueryKey>[0],
) {
  const queryClient = useQueryClient()
  const idempotency = useIdempotencyKey<CreateConnectionRequestRequest>(
    (data) => data.creator_account_id,
  )

  return useCreateDiscoveryConnectionRequest({
    mutation: {
      mutationFn: async (data: CreateConnectionRequestRequest) => {
        const response = await (
          await import('#/shared/api/generated/brand/brand')
        ).createDiscoveryConnectionRequest(data, withIdempotencyKey(idempotency.get(data)))
        if (response.status !== 201) {
          throw new ApiError(response.status, 'create_connection_request_error', 'Create connection request failed')
        }
        return response.data
      },
      onSuccess: async () => {
        idempotency.reset()
        toast.success(t`Invitación enviada`)
        await queryClient.invalidateQueries({
          queryKey: ['discovery', 'creators'],
        })
      },
      onError: (error) => {
        if (error instanceof ApiError && error.status === 409) {
          const code = (error.details as { code?: string } | null)?.code
          if (code === 'already_pending') {
            toast.info(t`Ya enviaste una invitación a este creator.`)
            return
          }
          if (code === 'has_conversation') {
            toast.info(t`Ya tenés una conversación con este creator.`)
            return
          }
          if (code === 'has_active_offer') {
            toast.info(t`Ya tenés una oferta activa con este creator.`)
            return
          }
        }
        toast.error(t`Algo salió mal. Intentá de nuevo.`)
      },
    },
  })
}
```

**Nota**: `useCreateDiscoveryConnectionRequest` de `brand.ts` es una mutation de Orval. Revisar la firma exacta del hook generado antes de wrapearlo. Si el hook generado no acepta `mutationFn` override, usar `useMutation` directamente con `createDiscoveryConnectionRequest` como `mutationFn`.

## Componente: `src/features/discovery/network/components/InviteSingleModal.tsx`

```tsx
interface InviteSingleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  card: DiscoveryCreatorCard | null
  // params actuales del grid para invalidar correctamente
  appliedParams: Omit<GetDiscoveryCreatorsParams, 'cursor' | 'limit'>
}
```

### Estructura del modal

```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>{t`Invitar a ${card?.display_name}`}</DialogTitle>
    </DialogHeader>

    {/* Advertencia si pair_state indica invitación previa rechazada/vencida */}
    {(pairState?.kind === 'connection_rejected' || pairState?.kind === 'connection_expired') && (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        {pairState.kind === 'connection_rejected'
          ? t`Este creator rechazó una invitación anterior. Podés volver a intentarlo.`
          : t`Una invitación anterior venció. Podés volver a intentarlo.`}
      </div>
    )}

    {/* Avatar + nombre del creator */}
    {/* ... */}

    {/* Textarea nota */}
    <div className="space-y-2">
      <label className="text-sm font-medium">{t`Nota (opcional)`}</label>
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={1000}
        placeholder={t`Contale por qué querés trabajar con este creator...`}
        rows={4}
      />
      <p className="text-xs text-muted-foreground text-right">{note.length}/1000</p>
    </div>

    <DialogFooter>
      <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
        {t`Cancelar`}
      </Button>
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        {t`Enviar invitación`}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

En `handleSubmit`:
```ts
mutation.mutate({
  creator_account_id: card.account_id,
  note: note.trim() || null,
})
// Cerrar modal en onSuccess (via useEffect watching mutation.isSuccess)
```

### Estado local

```ts
const [note, setNote] = useState('')

// Reset al abrir modal
useEffect(() => {
  if (open) setNote('')
}, [open])

// Cerrar en éxito
useEffect(() => {
  if (mutation.isSuccess) {
    onOpenChange(false)
  }
}, [mutation.isSuccess, onOpenChange])
```

## Acceptance

- [ ] Modal se abre con nombre y avatar del creator.
- [ ] Advertencia visible cuando `pair_state.kind` es `connection_rejected` o `connection_expired`.
- [ ] Textarea acepta hasta 1000 chars con contador.
- [ ] "Enviar invitación" llama la mutation con `Idempotency-Key`.
- [ ] En éxito: toast "Invitación enviada" + modal se cierra + grid se invalida (card actualiza `pair_state` a `connection_pending`).
- [ ] Error 409 `already_pending` → toast informativo, no error.
- [ ] Error 409 `has_conversation` → toast informativo.
- [ ] Doble click no envía dos requests (idempotency key estable por creator).
- [ ] `pnpm typecheck` verde.

## Done summary
Implemented fn-29-feat-035-creator-network-discovery.7; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: