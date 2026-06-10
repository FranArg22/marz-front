# fn-29-feat-035-creator-network-discovery.10 — Inbox del creator: render connection_request_received

## Description

El backend puede emitir InboxItems con kind `connection_request_received` (cuando un brand envía una ConnectionRequest al creator). Esta task adapta el inbox del creator para renderizar ese nuevo kind: muestra nombre del brand, nota, y botones Aceptar / Rechazar. Aceptar navega al chat vía `conversation_id` del response. Rechazar cierra el item silenciosamente.

**Size:** S

## Verificación del kind

El `InboxItemKind` del cliente generado puede no tener todavía el valor `connection_request_received`. Verificar en `src/shared/api/generated/model/inboxItemKind.ts`. Si no está, es porque el backend lo agrega junto con el epicBK (ya deployado). Puede que el api:sync ya lo haya incluido. En todo caso, el kind puede llegar como string en runtime — manejar como string literal en el código si el enum no lo tiene.

El `InboxItem.metadata` es un objeto JSON dinámico. Para items de tipo `connection_request_received`, el metadata contiene `{ connection_request_id: string }`.

## Archivos a modificar

### `src/features/inbox/InboxItemRow.tsx`

Identificar dónde se renderiza el popover de acciones (actualmente `InboxInlineActionPopover`). Agregar manejo del kind `connection_request_received`:

```tsx
// Antes del return del componente InboxItemRow, agregar:
const isConnectionRequest = item.kind === 'connection_request_received'

// En el JSX, renderizar condicionalmente el panel de connection request
// en lugar del flujo normal de popover/navegación
if (isConnectionRequest) {
  return <ConnectionRequestInboxItem accountKind={accountKind} item={item} />
}
```

### Nuevo componente: `src/features/inbox/ConnectionRequestInboxItem.tsx`

```tsx
import { t } from '@lingui/core/macro'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Check, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { Button } from '#/components/ui/button'
import {
  useAcceptDiscoveryConnectionRequest,
  useRejectDiscoveryConnectionRequest,
} from '#/shared/api/generated/creator/creator'
import { useGetDiscoveryConnectionRequest } from '#/shared/api/generated/discovery/discovery'
import { ApiError } from '#/shared/api/mutator'

import type { InboxItem, InboxResponse } from './api/inbox'
import { inboxQueryKey, markInboxItemRead } from './api/inbox'

interface ConnectionRequestInboxItemProps {
  accountKind: InboxResponse['account_kind']
  item: InboxItem
}

export function ConnectionRequestInboxItem({ item }: ConnectionRequestInboxItemProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const connectionRequestId = (item.metadata as { connection_request_id?: string })?.connection_request_id

  // Query para detalle de la request (brand name, nota)
  const detailQuery = useGetDiscoveryConnectionRequest(connectionRequestId ?? '', {
    query: { enabled: Boolean(connectionRequestId) },
  })

  const accept = useAcceptDiscoveryConnectionRequest({
    mutation: {
      onSuccess: async (data) => {
        await queryClient.invalidateQueries({ queryKey: inboxQueryKey })
        if (data.status === 200 && data.data.conversation_id) {
          void navigate({
            to: '/workspace/conversations/$conversationId',
            params: { conversationId: data.data.conversation_id },
          })
        }
      },
      onError: (error) => {
        if (error instanceof ApiError && error.status === 410) {
          toast.error(t`Esta invitación ya venció.`)
          void queryClient.invalidateQueries({ queryKey: inboxQueryKey })
        } else {
          toast.error(t`Algo salió mal. Intentá de nuevo.`)
        }
      },
    },
  })

  const reject = useRejectDiscoveryConnectionRequest({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: inboxQueryKey })
      },
      onError: () => {
        toast.error(t`Algo salió mal. Intentá de nuevo.`)
      },
    },
  })

  const isPending = accept.isPending || reject.isPending

  if (!connectionRequestId) return null

  const brandName = detailQuery.data?.status === 200
    ? detailQuery.data.data.brand_workspace.name
    : item.meta?.primary ?? t`Un brand`

  const note = detailQuery.data?.status === 200
    ? detailQuery.data.data.note
    : null

  return (
    <div className="flex items-start gap-4 p-4 border-b border-border">
      <Avatar className="size-10 shrink-0">
        {detailQuery.data?.status === 200 && (
          <AvatarImage
            src={detailQuery.data.data.brand_workspace.logo_url ?? undefined}
            alt={brandName}
          />
        )}
        <AvatarFallback>{brandName.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">
          {t`${brandName} quiere conectar con vos`}
        </p>
        {note && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-3">{note}</p>
        )}

        <div className="mt-3 flex gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => accept.mutate({ id: connectionRequestId })}
            disabled={isPending}
          >
            {accept.isPending ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <Check className="size-3.5" aria-hidden />
            )}
            {t`Aceptar`}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => reject.mutate({ id: connectionRequestId })}
            disabled={isPending}
          >
            {reject.isPending ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <X className="size-3.5" aria-hidden />
            )}
            {t`Rechazar`}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

**Nota importante sobre imports**: `useAcceptDiscoveryConnectionRequest` y `useRejectDiscoveryConnectionRequest` están en `creator/creator.ts`. `useGetDiscoveryConnectionRequest` está en `discovery/discovery.ts` (NO en `creator/creator.ts`). Son módulos distintos del cliente generado.

### Notas de implementación

- `useAcceptDiscoveryConnectionRequest` y `useRejectDiscoveryConnectionRequest` están en `creator.ts` (no `brand.ts`). Verificar los parámetros exactos del hook — Orval puede generar `({ id })` como variable de la mutation.
- `ConnectionRequestDetailResponse.brand_workspace` tiene `{ id, name, logo_url }`. El campo `logo_url` puede ser nullable — usar `?? undefined` para el `AvatarImage.src`.
- El inbox usa `item.meta.primary` como fallback de nombre. Si el backend ya setea `meta.primary` = brand name, usar eso directamente sin hacer el request de detalle. El query de detalle es solo para mostrar la nota.
- Si `connectionRequestId` no está en `item.metadata`, no renderizar el componente (return null).

## Acceptance

- [ ] InboxItem con kind `connection_request_received` renderiza el nuevo componente.
- [ ] Nombre del brand aparece (desde metadata o desde el query de detalle).
- [ ] Nota del brand aparece (si existe).
- [ ] Aceptar llama `useAcceptDiscoveryConnectionRequest` y navega al chat.
- [ ] Rechazar llama `useRejectDiscoveryConnectionRequest` y cierra el item (invalida inbox).
- [ ] Error 410 (expirado) → toast de error claro.
- [ ] `pnpm typecheck` verde.
- [ ] Los otros kinds de inbox siguen funcionando sin cambios.

## Done summary
Implemented fn-29-feat-035-creator-network-discovery.10; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: