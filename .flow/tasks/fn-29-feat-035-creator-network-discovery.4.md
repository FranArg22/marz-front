# fn-29-feat-035-creator-network-discovery.4 — DiscoveryFilterPanel

## Description

Panel lateral de filtros con dos secciones: "Creador" y "Performance". Los cambios en el panel actualizan `pendingFilters` del store. Solo al hacer click en "Aplicar" se mueven a `appliedFilters`. "Limpiar filtros" resetea pending. "Cerrar sin aplicar" llama a `resetPendingFilters()`.

**Size:** M

## Archivo: `src/features/discovery/network/components/DiscoveryFilterPanel.tsx`

### Sección "Creador" — controles

| Control | Campo | Tipo de input |
|---------|-------|---------------|
| Plataformas | `platforms` | Checkboxes múltiples: Instagram, TikTok, YouTube |
| Tipo de creator | `creator_type` | Radio/Select: `all` = Todos, `influencer` = Influencer, `ugc` = UGC (deshabilitado con label "Próximamente") |
| País | `countries` | Multi-select de ISO2 (text input + lista) — MVP: al menos Argentina (AR), Colombia (CO), México (MX), España (ES), Chile (CL) |
| Género | `gender` | Radio: Masculino / Femenino / No binario |
| Edad | `age_buckets` | Checkboxes: 18-24, 25-34, 35-44, 45-54, 55+ |
| Intereses | `interests` | Multi-select de tags (texto libre por ahora, MVP) |

### Sección "Performance" — controles

| Control | Campo | Tipo de input |
|---------|-------|---------------|
| Seguidores | `followers_min` + `followers_max` | Dos number inputs en fila "De — Hasta" |
| Tasa de engagement mínima | `engagement_rate_min` | Select: — / ≥1% / ≥3% / ≥5% |
| Promedio de vistas | `avg_views_min` + `avg_views_max` | Dos number inputs en fila |
| CPM | `cpm_min` + `cpm_max` | Dos text inputs (decimales) |
| Precio | `price_min` + `price_max` | Dos text inputs (decimales) |

### Validaciones

- Si `followers_min > followers_max` → mostrar error inline y deshabilitar "Aplicar".
- Si `avg_views_min > avg_views_max` → mismo comportamiento.
- Si `cpm_min > cpm_max` (parseFloat) → mismo.
- Si `price_min > price_max` (parseFloat) → mismo.

### Props

```ts
interface DiscoveryFilterPanelProps {
  open: boolean
  onClose: () => void
}
```

El panel lee `pendingFilters` del store y escribe via `setPendingFilters`. El botón "Aplicar" llama `applyFilters()` y `onClose()`. El botón "Cerrar" llama `resetPendingFilters()` y `onClose()`. El botón "Limpiar filtros" llama `clearFilters()`.

### Estructura del panel

```tsx
<Sheet open={open} onOpenChange={(open) => { if (!open) { resetPendingFilters(); onClose() } }}>
  <SheetContent side="right" className="w-[400px] overflow-y-auto">
    <SheetHeader>
      <SheetTitle>{t`Filtros`}</SheetTitle>
    </SheetHeader>
    
    <div className="space-y-6 py-4">
      {/* Sección Creador */}
      <FilterSection title={t`Creador`}>
        {/* controles */}
      </FilterSection>
      
      {/* Sección Performance */}
      <FilterSection title={t`Performance`}>
        {/* controles */}
      </FilterSection>
    </div>
    
    <SheetFooter className="flex-col gap-2">
      <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
        {t`Limpiar filtros`}
      </Button>
      <Button type="button" onClick={handleApply} disabled={hasValidationError}>
        {t`Aplicar`}
      </Button>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

Usar el componente `Sheet` de `#/components/ui/sheet` (shadcn/ui). Si no existe todavía en el repo, verificar `src/components/ui/sheet.tsx`; si no hay, instalar con `pnpm dlx shadcn@latest add sheet` o crear el stub manualmente con Radix Dialog/Sheet.

### Botón trigger en la ruta

En `src/routes/_brand/discovery.tsx`, agregar:
- Estado local `const [filterPanelOpen, setFilterPanelOpen] = useState(false)`
- Botón `<Button onClick={() => setFilterPanelOpen(true)}><SlidersHorizontal /> {t`Filtros`}</Button>` sobre el grid
- `<DiscoveryFilterPanel open={filterPanelOpen} onClose={() => setFilterPanelOpen(false)} />`

## Acceptance

- [ ] Panel se abre al hacer click en "Filtros".
- [ ] Cambios en el panel actualizan `pendingFilters` del store sin afectar `appliedFilters`.
- [ ] "Aplicar" mueve pending a applied, cierra el panel, recarga el grid.
- [ ] "Limpiar filtros" resetea todos los campos del panel a vacío.
- [ ] Cerrar el panel sin aplicar (X o clic fuera) llama `resetPendingFilters()`.
- [ ] Validación de rangos: `followers_min > followers_max` bloquea el botón Aplicar con indicador visual.
- [ ] Tipo de creator "UGC" aparece deshabilitado con label "Próximamente".
- [ ] `pnpm typecheck` verde.

## Done summary
Implemented fn-29-feat-035-creator-network-discovery.4; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: