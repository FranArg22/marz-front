# fn-29-feat-035-creator-network-discovery.6 — CreatorCard con mini-tabla por plataforma

## Description

Componente `CreatorCard` que renderiza la info de un `DiscoveryCreatorCard`. Incluye: foto/avatar, nombre, badge de país + edad, hasta 3 tags + "+N", mini-tabla de 4 columnas (Alcance / ER / CPM / Precio mínimo) por cada plataforma conectada, indicador visual del `pair_state.kind`, y botón "Invitar" con estado según el pair state.

**Size:** M

## Tipos de referencia

```ts
// DiscoveryCreatorCard (generado)
{
  account_id: string
  display_name: string
  avatar_url: string
  country: string        // ISO2
  age: number
  tags: string[]         // frontend corta a 3 + "+N más"
  platforms: DiscoveryCreatorPlatformStats[]
  pair_state: DiscoveryCreatorPairState
}

// DiscoveryCreatorPlatformStats (generado)
{
  platform: string       // 'instagram' | 'tiktok' | 'youtube'
  handle: string
  followers: number
  engagement_rate: number   // 0..1, ej: 0.035 = 3.5%
  cpm_amount: string
  cpm_currency: string
  min_price_amount: string
  price_currency: string
}

// DiscoveryCreatorPairState (generado)
{
  kind: DiscoveryCreatePairKindEnum
  conversation_id: string | null
  last_connection_request_id: string | null
}
```

## Lógica de `pair_state.kind` → UI

| `kind` | Botón "Invitar" | CTA secundario |
|--------|----------------|----------------|
| `no_contact` | Habilitado, label "Invitar" | — |
| `connection_pending` | Deshabilitado, label "Invitación enviada" | — |
| `connection_rejected` | Habilitado con advertencia, label "Invitar de nuevo" | — |
| `connection_expired` | Habilitado con advertencia, label "Invitar de nuevo" | — |
| `open_conversation` | Deshabilitado, label "Conversación abierta" | "Ir al chat" → navega a `/workspace/conversations/{conversation_id}` |
| `active_collaboration` | Deshabilitado, label "Colaborando" | "Ir al chat" → navega a `/workspace/conversations/{conversation_id}` |

Para `connection_rejected` y `connection_expired`, el botón habilitado debe mostrar un tooltip o badge de advertencia antes de abrir el modal ("Ya hubo una invitación antes"). El modal (`InviteSingleModal`, task .7) recibe `pairState` y puede mostrar la advertencia internamente.

## Archivo: `src/features/discovery/network/components/CreatorCard.tsx`

```tsx
import { t } from '@lingui/core/macro'
import { useNavigate } from '@tanstack/react-router'
import { MapPin } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import type {
  DiscoveryCreatorCard,
  DiscoveryCreatorPlatformStats,
  DiscoveryCreatorPairState,
} from '#/shared/api/generated/model'
import { DiscoveryCreatePairKindEnum } from '#/shared/api/generated/model'

const Intl_NumberFormat_compact = new Intl.NumberFormat('es-AR', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const Intl_NumberFormat_pct = new Intl.NumberFormat('es-AR', {
  style: 'percent',
  maximumFractionDigits: 1,
})

interface CreatorCardProps {
  card: DiscoveryCreatorCard
  onInvite: (card: DiscoveryCreatorCard) => void
  // true cuando la card está seleccionada (modo bulk, task .8)
  selected?: boolean
  selectionMode?: boolean
  onToggleSelect?: (accountId: string) => void
}

export function CreatorCard({
  card,
  onInvite,
  selected = false,
  selectionMode = false,
  onToggleSelect,
}: CreatorCardProps) {
  const navigate = useNavigate()
  const { kind, conversation_id } = card.pair_state
  const visibleTags = card.tags.slice(0, 3)
  const hiddenTagCount = card.tags.length - visibleTags.length

  const canInvite =
    kind === DiscoveryCreatePairKindEnum.no_contact ||
    kind === DiscoveryCreatePairKindEnum.connection_rejected ||
    kind === DiscoveryCreatePairKindEnum.connection_expired

  const hasCta =
    kind === DiscoveryCreatePairKindEnum.open_conversation ||
    kind === DiscoveryCreatePairKindEnum.active_collaboration

  const inviteLabel = getInviteLabel(kind)

  function handleGoToChat() {
    if (conversation_id) {
      void navigate({ to: '/workspace/conversations/$conversationId', params: { conversationId: conversation_id } })
    }
  }

  return (
    <div
      className={`relative rounded-2xl border bg-card p-4 space-y-3 ${selected ? 'ring-2 ring-primary' : 'border-border'}`}
    >
      {/* Selection checkbox — visible only in selection mode */}
      {selectionMode && (
        <input
          type="checkbox"
          className="absolute right-3 top-3 size-4"
          checked={selected}
          disabled={!canInvite && !selected}
          onChange={() => onToggleSelect?.(card.account_id)}
          aria-label={t`Seleccionar ${card.display_name}`}
        />
      )}

      {/* Header: avatar + nombre + país + edad */}
      <div className="flex items-center gap-3">
        <Avatar className="size-10 shrink-0">
          <AvatarImage src={card.avatar_url} alt={card.display_name} />
          <AvatarFallback>{card.display_name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{card.display_name}</p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" aria-hidden />
            <span>{card.country}</span>
            <span>·</span>
            <span>{card.age} años</span>
          </div>
        </div>
      </div>

      {/* Tags */}
      {visibleTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {visibleTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {hiddenTagCount > 0 && (
            <Badge variant="outline" className="text-xs">
              +{hiddenTagCount}
            </Badge>
          )}
        </div>
      )}

      {/* Mini-tabla por plataforma */}
      {card.platforms.map((platform) => (
        <PlatformStats key={platform.platform} stats={platform} />
      ))}

      {/* Pair state indicator */}
      <PairStateIndicator kind={kind} />

      {/* CTAs */}
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          className="flex-1"
          disabled={!canInvite || selectionMode}
          onClick={() => { if (canInvite) onInvite(card) }}
          variant={canInvite ? 'default' : 'secondary'}
        >
          {inviteLabel}
        </Button>
        {hasCta && conversation_id && (
          <Button type="button" size="sm" variant="outline" onClick={handleGoToChat}>
            {t`Ir al chat`}
          </Button>
        )}
      </div>
    </div>
  )
}

function PlatformStats({ stats }: { stats: DiscoveryCreatorPlatformStats }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium capitalize text-muted-foreground">{stats.platform} · @{stats.handle}</p>
      <div className="grid grid-cols-4 gap-1 text-xs">
        <div>
          <p className="text-muted-foreground">{t`Alcance`}</p>
          <p className="font-medium">{Intl_NumberFormat_compact.format(stats.followers)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{t`ER`}</p>
          <p className="font-medium">{Intl_NumberFormat_pct.format(stats.engagement_rate)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{t`CPM`}</p>
          <p className="font-medium">{stats.cpm_currency} {stats.cpm_amount}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{t`Precio`}</p>
          <p className="font-medium">{stats.price_currency} {stats.min_price_amount}</p>
        </div>
      </div>
    </div>
  )
}

function PairStateIndicator({ kind }: { kind: DiscoveryCreatePairKindEnum }) {
  if (kind === DiscoveryCreatePairKindEnum.no_contact) return null

  const labels: Partial<Record<DiscoveryCreatePairKindEnum, string>> = {
    connection_pending: t`Invitación enviada`,
    connection_rejected: t`Invitación rechazada`,
    connection_expired: t`Invitación vencida`,
    open_conversation: t`Conversación abierta`,
    active_collaboration: t`Colaborando`,
  }

  const label = labels[kind]
  if (!label) return null

  return (
    <p className="text-xs text-muted-foreground">{label}</p>
  )
}

function getInviteLabel(kind: DiscoveryCreatePairKindEnum): string {
  switch (kind) {
    case DiscoveryCreatePairKindEnum.no_contact:
      return t`Invitar`
    case DiscoveryCreatePairKindEnum.connection_pending:
      return t`Invitación enviada`
    case DiscoveryCreatePairKindEnum.connection_rejected:
    case DiscoveryCreatePairKindEnum.connection_expired:
      return t`Invitar de nuevo`
    case DiscoveryCreatePairKindEnum.open_conversation:
      return t`Conversación abierta`
    case DiscoveryCreatePairKindEnum.active_collaboration:
      return t`Colaborando`
  }
}
```

**Nota sobre Intl**: `Intl_NumberFormat_compact` y `Intl_NumberFormat_pct` deben ser instancias de módulo (fuera del componente), no dentro del render. Esto sigue la regla de React Doctor del CLAUDE.md.

## Integrar en el grid

En `src/routes/_brand/discovery.tsx`, actualizar el `renderCard` prop del `DiscoveryGrid`:

```tsx
renderCard={(card) => (
  <CreatorCard
    card={card}
    onInvite={(card) => { setSelectedCard(card); setInviteModalOpen(true) }}
  />
)}
```

Agregar estado local `selectedCard` y `inviteModalOpen` (se usan en task .7).

## Acceptance

- [ ] Card muestra avatar, nombre, país, edad.
- [ ] Tags cortados a 3 + "+N más" cuando hay más de 3.
- [ ] Mini-tabla renderiza 4 columnas para cada plataforma conectada.
- [ ] `pair_state.kind = 'no_contact'` → botón "Invitar" habilitado.
- [ ] `pair_state.kind = 'connection_pending'` → botón "Invitación enviada" deshabilitado.
- [ ] `pair_state.kind = 'open_conversation'` → botón deshabilitado + CTA "Ir al chat".
- [ ] `pair_state.kind = 'active_collaboration'` → botón deshabilitado + CTA "Ir al chat" navega a conversación.
- [ ] `Intl.NumberFormat` instanciado a nivel de módulo (no dentro del render).
- [ ] `pnpm typecheck` verde.

## Done summary
Implemented fn-29-feat-035-creator-network-discovery.6; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: