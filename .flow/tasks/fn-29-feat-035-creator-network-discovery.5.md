# fn-29-feat-035-creator-network-discovery.5 — DiscoveryFilterChips

## Description

Barra de chips que aparece sobre el grid mostrando los filtros activos. Cada dimensión de filtro muestra un chip. También hay un chip `Filtros (N)` que abre el panel, y un botón `Limpiar` que resetea todos. Cerrar un chip individual elimina esa dimensión de `appliedFilters`.

**Size:** S

## Archivo: `src/features/discovery/network/components/DiscoveryFilterChips.tsx`

### Lógica de chips

Cada campo de `appliedFilters` que tenga valor genera un chip. Reglas:

| Campo | Label del chip |
|-------|----------------|
| `platforms` (array) | "Plataformas: Instagram, TikTok" (listar valores) |
| `gender` | "Género: Femenino" |
| `countries` (array) | "Países: AR, ES" |
| `age_buckets` (array) | "Edad: 18-24, 25-34" |
| `interests` (array) | "Intereses: Moda, Tecnología" |
| `content_types` (array) | "Contenido: Reels, Reviews" |
| `followers_min` y/o `followers_max` | "Seguidores: 10k–50k" (mostrar rango) |
| `engagement_rate_min` | "ER: ≥3%" |
| `avg_views_min` y/o `avg_views_max` | "Vistas: 5k–20k" |
| `cpm_min` y/o `cpm_max` | "CPM: $5–$20" |
| `price_min` y/o `price_max` | "Precio: $100–$500" |

Los campos de rango (`followers_min`/`followers_max`, `avg_views_min`/`avg_views_max`, `cpm_min`/`cpm_max`, `price_min`/`price_max`) se agrupan en un único chip por dimensión.

### Props

```ts
interface DiscoveryFilterChipsProps {
  onOpenFilterPanel: () => void
}
```

Lee `appliedFilters` del store. Cuando se cierra un chip, actualiza `appliedFilters` del store (elimina la clave o la dimensión de rango) y también sincroniza `pendingFilters` (llamar `setPendingFilters(nuevoApplied)` para que el panel refleje el estado correcto si se reabre).

### Layout

```tsx
<div className="flex flex-wrap items-center gap-2">
  {/* Chip de filtros: siempre visible si hay filtros activos */}
  {activeCount > 0 && (
    <button
      type="button"
      onClick={onOpenFilterPanel}
      className="..."
    >
      <SlidersHorizontal className="size-3.5" />
      {t`Filtros (${activeCount})`}
    </button>
  )}
  
  {/* Un chip por dimensión activa */}
  {chips.map((chip) => (
    <FilterChip key={chip.key} label={chip.label} onRemove={() => removeChip(chip.key)} />
  ))}
  
  {/* Botón limpiar todo */}
  {activeCount > 0 && (
    <button type="button" onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground">
      {t`Limpiar`}
    </button>
  )}
</div>
```

`activeCount` se calcula con `countActiveFilters(appliedFilters)` del store.

### Integrar en la ruta

En `src/routes/_brand/discovery.tsx`, montar `<DiscoveryFilterChips onOpenFilterPanel={() => setFilterPanelOpen(true)} />` entre el encabezado y el grid.

## Acceptance

- [ ] Aplicar 3 filtros → aparecen 3 chips + chip `Filtros (3)`.
- [ ] Cerrar un chip individual remueve solo esa dimensión y recarga el grid.
- [ ] Botón `Limpiar` elimina todos los filtros y los chips desaparecen.
- [ ] Chip `Filtros (N)` al hacer click abre el panel de filtros.
- [ ] Los campos de rango (`followers_min` + `followers_max`) se agrupan en un chip "Seguidores: X–Y".
- [ ] `pnpm typecheck` verde.

## Done summary
Implemented fn-29-feat-035-creator-network-discovery.5; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: