# fn-30-feat-038-creator-profile-edit-frontend.3 — CollaborationSection

## Description

**Size:** M

Implementa `CollaborationSection` en `src/features/identity/settings/CollaborationSection.tsx`.

Props: `{ data: CreatorSettingsResponse }`

Contiene un único form (TanStack Form + Zod) con cuatro controles:
1. **`CreatorKindChips`** — selector de `creator_kinds`: valores posibles `'influencer'` | `'ugc'` (máx 2, mín 1). Chips toggle-style. Deseleccionar el último kind bloqueado (el chip queda deshabilitado cuando es el único seleccionado).
2. **`InterestsPicker`** — selector de `niches`: taxonomía de intereses. Los valores disponibles vienen de `GET /api/v1/interests` (hook `useListInterests` si existe, o puede hardcodearse la lista desde el cliente generado si hay un enum). Máx 5, mín 1. El botón de agregar se deshabilita cuando ya hay 5 seleccionados.
3. **`ContentTypesPicker`** — selector de `content_types`: taxonomía de content types. Valores de `GET /api/v1/content-types` (hook correspondiente). Mín 1. Sin máximo.
4. **`BarterToggle`** — toggle booleano para `barter_preference`.

El botón `Guardar` (vía `SectionSaveBar`) llama a `useUpdateMyCreatorProfileCollaboration.mutateAsync`.

### Cómo obtener las taxonomías

Primero verificar si ya existen hooks para intereses y content types en el cliente generado:
```bash
grep -n "useListInterests\|useListContentTypes\|listInterests\|listContentTypes\|getInterests\|getContentTypes" src/shared/api/generated/**/*.ts
```

Si no existen en el cliente generado, buscar cómo se obtienen en el onboarding:
```bash
grep -rn "interests\|content.type" src/features/identity/onboarding/creator/ --include="*.ts" --include="*.tsx"
```

Usar el mismo patrón que el onboarding. Si el onboarding los tiene hardcodeados, hacer lo mismo en settings.

### Form schema (Zod)

```ts
const CollaborationSectionSchema = z.object({
  creator_kinds: z.array(z.enum(['influencer', 'ugc'])).min(1).max(2),
  niches: z.array(z.string()).min(1).max(5),
  content_types: z.array(z.string()).min(1),
  barter_preference: z.boolean(),
})
```

### Guardado

```ts
await useUpdateMyCreatorProfileCollaboration.mutateAsync({
  data: {
    creator_kinds: formValues.creator_kinds,
    niches: formValues.niches,
    content_types: formValues.content_types,
    barter_preference: formValues.barter_preference,
  }
})
await queryClient.invalidateQueries({ queryKey: getGetMyCreatorSettingsQueryKey() })
```

### Manejo del 422

Si la mutation retorna error con `status === 422` e `fields`, mapear los errores al form usando `applyBackendFieldErrors` (importado de `#/shared/ui/form`).

### dirty

El form está dirty si cualquiera de los 4 valores difiere del `data.collaboration` recibido como prop. Comparar arrays con `JSON.stringify` o set equality.

## Acceptance

- [ ] Al montar, los chips/pickers/toggle se inicializan con `data.collaboration`.
- [ ] Deseleccionar el único kind seleccionado → el chip queda deshabilitado con explicación visual (tooltip o texto "Debe seleccionar al menos uno").
- [ ] Intentar agregar un sexto niche → el botón de agregar/selección del sexto ítem está deshabilitado.
- [ ] Deseleccionar el último niche → bloqueado (mín 1).
- [ ] Deseleccionar el último content_type → bloqueado (mín 1).
- [ ] Unit test: formulario con 0 creator_kinds → submit bloqueado con error de validación.
- [ ] Unit test: 6 niches → submit bloqueado con error `max_5`.
- [ ] Unit test: 0 content_types → submit bloqueado con error `min_1`.
- [ ] Guardar con cambios válidos → `useUpdateMyCreatorProfileCollaboration` llamada con el body correcto; query invalidada.
- [ ] Sin cambios → SectionSaveBar en estado no-dirty; Guardar deshabilitado.
- [ ] `pnpm typecheck` verde.

## Done summary
Implemented fn-30-feat-038-creator-profile-edit-frontend.3; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: