---
satisfies: [R4]
---

# fn-27-feat-034-unified-campaign-creation.6 F.6 — Paso 4: Audience + Match en vivo (creator-count debounced)

## Description

Implementar el Paso 4 del wizard: selección de audience (plataformas, intereses, país, tier de followers) y bloque "Match en vivo" con conteo de creators debounceado.

**Size:** L

**Archivos a crear:**

- `src/features/campaigns/wizard/WizardStep4Audience.tsx`
- `src/features/campaigns/wizard/WizardStep4Audience.test.tsx`
- `src/features/campaigns/wizard/MatchLiveBlock.tsx`
- `src/features/campaigns/wizard/MatchLiveBlock.test.tsx`
- `src/features/campaigns/wizard/hooks/useDebouncedValue.ts` (o verificar si ya existe en el repo)

## Approach

**Campos de audiencia:**

- **Plataformas** (`platforms`): multi-select chips. Opciones: `tiktok`, `instagram`, `youtube`. Mínimo 1 seleccionado. Chips con icono + label. Toggle al click.
- **Intereses** (`interests`): multi-select chips. Listado de `useInterestsQuery()` (21 slugs activos, ordenados por `sort_order`). Mínimo 1 seleccionado.
- **País** (`creator_country`): dropdown Select de `useCountriesQuery()` (solo `active=true`). Solo `AR` disponible en MVP; selección requerida.
- **Tier mínimo** (`min_creator_tier_slug`): chips tipo radio (solo uno seleccionable). Opciones de `useCreatorTiersQuery()` con sus labels. Selección requerida.

**Store**: actualizar `store.step4` con `setStep4(partial)` en cada cambio.

**MatchLiveBlock:**

```tsx
interface MatchLiveBlockProps {
  platforms: SocialPlatform[]
  interests: string[]
  creator_country: string | null
  min_creator_tier_slug: string | null
}
```

- Internamente aplica debounce de 300ms a los props antes de pasarlos a `useCreatorCountQuery`.
- `useDebouncedValue<T>(value: T, delay: number): T` — hook genérico con `useEffect` + `setTimeout`.
- Si `available=false` o query pendiente: muestra `—` + texto explicativo ("No disponible en este momento").
- Si `available=true`: muestra el número formateado (`Intl.NumberFormat` hoisted a module scope).
- El bloque es informativo: aunque `count=0` o `available=false`, "Continuar" sigue habilitado si los campos requeridos tienen valores.

**Continuar** habilitado cuando: `platforms.length >= 1 && interests.length >= 1 && creator_country !== null && min_creator_tier_slug !== null`.

Al hacer click en Continuar: `store.markStepCompleted(4)`, navegar a `?step=5`.

## Acceptance

- [ ] Chips de plataformas: mínimo 1 requerido para habilitar Continuar; toggle funcional.
- [ ] Chips de intereses: cargados desde `useInterestsQuery`, mínimo 1 requerido.
- [ ] Dropdown de país: cargado desde `useCountriesQuery`; en MVP solo AR activo.
- [ ] Chips de tier: uno seleccionable, cargado desde `useCreatorTiersQuery`.
- [ ] `MatchLiveBlock` muestra `—` cuando `available=false` o durante carga inicial.
- [ ] `MatchLiveBlock` muestra el número cuando `available=true`; usa `Intl.NumberFormat` hoisted.
- [ ] Debounce 300ms: cambiar filtros rápidamente no dispara múltiples queries antes de que pasen 300ms.
- [ ] "Continuar" disabled si algún campo requerido está vacío, habilitado si todos están completos.
- [ ] Tests unit de `useDebouncedValue`: valor no cambia antes de 300ms; cambia después.
- [ ] Tests unit de `WizardStep4Audience`: Continuar disabled con array vacío; habilitado con todos completos.
- [ ] Tests unit de `MatchLiveBlock`: muestra `—` cuando `available=false`; muestra número cuando `available=true`.
- [ ] E2E: seleccionar platform + interest + country + tier → conteo aparece → Continuar → `?step=5`.
- [ ] Tracking: `campaign_wizard_match_count_seen` con `count` y `filters` (a integrar en F.13).
- [ ] `pnpm typecheck` pasa.

## Done summary
Implemented fn-27-feat-034-unified-campaign-creation.6; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: