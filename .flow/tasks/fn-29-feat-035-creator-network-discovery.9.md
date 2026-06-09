# fn-29-feat-035-creator-network-discovery.9 — DiscoveryUpsell (plan free) + item Discovery en sidebar

## Description

Pantalla de upsell renderizada cuando `allows_discovery = false` en el plan del workspace. El render condicional vive en la ruta `/_brand/discovery`. También agrega el ítem "Discovery" al sidebar de brand, con un ícono de candado (lock) cuando el plan no incluye la capability.

**Size:** S

## Leer capabilities

Las capabilities del plan se exponen en el response de `GET /v1/accounts/me` (hook `useMe`). El campo `brand_plan_capabilities.allows_discovery` indica si el brand tiene acceso. Verificar la forma exacta en el tipo generado `meResponse`:

```ts
// En src/shared/api/generated/accounts/accounts.ts — buscar tipo de me response
// El campo debería ser algo como:
// me.brand_workspace?.plan_capabilities?.allows_discovery
// o
// me.brand_plan_capabilities?.allows_discovery
```

Verificar con `grep -rn "allows_discovery\|plan_capabilities" src/shared/api/generated/model/` para encontrar el campo exacto.

## Componente: `src/features/discovery/network/components/DiscoveryUpsell.tsx`

```tsx
import { t } from '@lingui/core/macro'
import { Lock, Sparkles } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { Link } from '@tanstack/react-router'

export function DiscoveryUpsell() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-12 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted">
        <Lock className="size-8 text-muted-foreground" aria-hidden />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          {t`Descubrí creators de tu nicho`}
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {t`Con Discovery podés explorar nuestra red de creators, filtrar por plataforma, engagement, precio y más. Actualizá tu plan para acceder.`}
        </p>
      </div>
      <Button asChild>
        <Link to="/billing">
          <Sparkles className="size-4" aria-hidden />
          {t`Actualizar plan`}
        </Link>
      </Button>
    </div>
  )
}
```

## Render condicional en la ruta

En `src/routes/_brand/discovery.tsx`:

```tsx
import { useMe } from '#/shared/api/generated/accounts/accounts'
import { DiscoveryUpsell } from '#/features/discovery/network/components/DiscoveryUpsell'

function DiscoveryRoute() {
  const meQuery = useMe()
  useRouteTopbar({ breadcrumb: [{ icon: Compass, label: t`Discovery` }] })

  // Determinar la capability — ajustar path según el tipo real del response
  const allowsDiscovery =
    meQuery.data?.status === 200
      ? Boolean(meQuery.data.data?.brand_workspace?.plan_capabilities?.allows_discovery)
      : true // mientras carga, no flashear el upsell

  if (meQuery.isPending) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="size-6 animate-spin" /></div>
  }

  if (!allowsDiscovery) {
    return <DiscoveryUpsell />
  }

  // ... resto de la ruta (grid, filtros)
}
```

**Importante**: verificar el path exacto de `allows_discovery` en el tipo del response de `useMe`. Puede ser `data.data.brand_workspace.plan_capabilities.allows_discovery` u otro path. Corroborar con `pnpm typecheck`.

## Item Discovery en sidebar

**Archivo**: `src/features/identity/app-shell/navigation.ts`

Agregar el ítem `discovery` al array `brand` después de `creators`:

```ts
{
  id: 'discovery',
  label: () => t`Discovery`,
  icon: 'compass',
  href: '/discovery',
},
```

El ícono `'compass'` debe estar mapeado en `AppSidebarItem.tsx`. Si no existe, verificar qué ícono de Lucide está disponible y agregarlo al mapa.

Para el candado en el sidebar (plan free), el componente `AppSidebarItem.tsx` ya puede tener soporte para `disabled`/`disabledReason`. Sin embargo, la spec indica que el candado es visual (no deshabilita la navegación — el gating lo hace la ruta). Verificar cómo otros ítems deshabilitados están implementados en `AppSidebarItem.tsx` y replicar el patrón. Si el sidebar no tiene soporte para capability-based locks, implementar solo el ítem de navegación sin lock visual en MVP y anotar el gap.

## Acceptance

- [ ] Brand con `allows_discovery = false` ve el upsell en `/discovery`.
- [ ] Brand con `allows_discovery = true` ve el grid (no el upsell).
- [ ] Sidebar de brand tiene ítem "Discovery" con ícono compass.
- [ ] El ítem navega a `/discovery`.
- [ ] `pnpm typecheck` verde.

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
