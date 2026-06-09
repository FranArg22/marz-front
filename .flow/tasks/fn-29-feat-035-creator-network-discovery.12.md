# fn-29-feat-035-creator-network-discovery.12 — Botón "Find creator" en /creators → /discovery

## Description

Agregar un botón/CTA en la página `/creators` que navega a `/discovery`. La página `/creators` muestra creators que ya están en campañas del brand; el CTA apunta a Discovery para encontrar creators nuevos. No tiene lógica de gating local — si el brand no tiene `allows_discovery`, verá el upsell de `/discovery` al llegar.

**Size:** XS

## Contexto actual

`src/routes/_brand/creators.tsx` ya tiene un `onFindCreators` callback que va a `'/campaigns'`:

```tsx
const goToCampaigns = useCallback(() => {
  void navigate({ to: '/campaigns' })
}, [navigate])

// ...
<CampaignCreatorsTable
  // ...
  onFindCreators={goToCampaigns}
/>
```

Este callback se pasa a `CampaignCreatorsTable` que probablemente lo usa en el empty state del listado.

## Cambio

En `src/routes/_brand/creators.tsx`, reemplazar la implementación de `goToCampaigns` (o agregar un nuevo callback `goToDiscovery`) para navegar a `/discovery`:

```tsx
const goToDiscovery = useCallback(() => {
  void navigate({ to: '/discovery' })
}, [navigate])
```

Si `onFindCreators` ya apunta a campaigns y hay otra UI que sí quiere ir a campaigns, evaluar si el prop se reutiliza o se crea uno nuevo. Lo importante es que haya un path claro hacia `/discovery` desde `/creators`.

Adicionalmente, agregar un botón explícito en el encabezado de la página:

```tsx
// En el encabezado de BrandCreatorsRoute, al lado del título:
<Button type="button" variant="outline" size="sm" asChild>
  <Link to="/discovery">
    <Compass className="size-4" aria-hidden />
    {t`Descubrir creators`}
  </Link>
</Button>
```

Verificar que el ícono `Compass` esté disponible en Lucide (ya se usa en `navigation.ts` como string 'compass' pero el componente puede importar `Compass` directamente).

## Acceptance

- [ ] Existe al menos un CTA en `/creators` que navega a `/discovery`.
- [ ] La navegación funciona sin error de router (la ruta `/discovery` existe después de task .2).
- [ ] `pnpm typecheck` verde.

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
