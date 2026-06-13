# fn-30-feat-038-creator-profile-edit-frontend.1 — Commit api:sync + ruta + layout + sidebar + SectionSaveBar

## Description

**Size:** M

Esta task hace cinco cosas:
1. Limpia código del onboarding y offers que el api:sync rompió (BestVideo sin `kind`, formatos reducidos).
2. Commitea el diff de `pnpm api:sync` + las limpiezas juntos.
3. Crea la ruta `/_creator/settings` con `validateSearch`.
4. Agrega "Ajustes" al nav del creator shell.
5. Construye el layout (`CreatorSettingsPage` + `SettingsSidebar` + `SectionSaveBar`) con las 5 secciones vacías cargando datos del query principal.

### 0. Limpieza de código roto por api:sync

El api:sync eliminó `BestVideoKind` (archivo `src/shared/api/generated/model/bestVideoKind.ts` borrado) y cambió `BestVideo` a `{ url: string }` (sin `kind`). También redujo el enum de formatos a `ig_reel | tiktok_video | yt_short`. Hay código en el repo que referencia los valores eliminados y no compilará. Arreglar ANTES de commitear:

**`src/features/identity/onboarding/creator/types.ts`**:
- Eliminar `import type { BestVideoKind } from '#/shared/api/generated/model/bestVideoKind'` (línea 1).
- En la interfaz `BestVideo` (línea 19-22): eliminar `kind: BestVideoKind`. La interfaz queda `{ url: string }`. Alternativamente, eliminar la interfaz local `BestVideo` y reexportar la generada de `'#/shared/api/generated/model/bestVideo'` si otros archivos la importan desde `./types`.

**`src/features/identity/onboarding/creator/screens/C10BestVideosScreen.tsx`**:
- `DEFAULT_VIDEOS` (líneas 9-13): quitar `kind: 'organic'` de cada objeto. Quedan como `{ url: '' }`.
- Si el import de `BestVideo` viene del generado (`#/shared/api/generated/model/bestVideo`), ya tiene el shape correcto.

**`src/features/identity/onboarding/creator/schema.test.ts`**:
- Quitar `kind: 'organic'` y `kind: 'branded'` de todos los objetos `best_videos` en los test fixtures (líneas ~30-32, ~103-104, ~120-123).

**`src/features/identity/onboarding/creator/useSubmitCreatorOnboarding.test.ts`**:
- Quitar `kind: 'organic'` y `kind: 'branded'` de los objetos `best_videos` en el test fixture (líneas ~76-78).

**`src/features/offers/utils/formatOffer.ts`**:
- En `formatLabels` (líneas 18-26): eliminar las entradas de formatos que ya no existen: `yt_long`, `ig_story`, `ig_post`, `tiktok_post`. Dejar solo `yt_short`, `ig_reel`, `tiktok_video`.

Verificar con `pnpm typecheck` que no quedan referencias rotas.

### 1. Commit del api:sync + limpiezas

Stagear todos los archivos de:
- `openapi/spec.json`
- `src/shared/api/generated/` (todos los archivos modificados/creados/borrados)
- Los archivos limpiados en el paso 0

Mensaje de commit: `chore: api:sync FEAT-038 — creator profile edit endpoints + cleanup best_videos kind + format enum`

### 2. Entry "Ajustes" en el nav creator

**Archivo**: `src/features/identity/app-shell/navigation.ts`

Agregar al array `creator` (entre `earnings` y `analytics`):

```ts
{
  id: 'settings',
  label: () => t`Ajustes`,
  icon: 'settings',
  href: '/settings',
},
```

### 3. Ruta `/_creator/settings`

**Archivo nuevo**: `src/routes/_creator/settings.tsx`

```tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { CreatorSettingsPage } from '#/features/identity/settings/CreatorSettingsPage'

const settingsSectionSchema = z
  .enum(['general', 'colaboraciones', 'redes-tarifas', 'portfolio', 'billetera'])
  .default('general')

const settingsSearchSchema = z.object({
  section: settingsSectionSchema,
})

export type SettingsSection = z.infer<typeof settingsSectionSchema>

export const Route = createFileRoute('/_creator/settings')({
  validateSearch: settingsSearchSchema,
  component: SettingsRoute,
})

function SettingsRoute() {
  const { section } = Route.useSearch()
  const navigate = useNavigate()

  function handleSectionChange(next: SettingsSection) {
    void navigate({ to: '/settings', search: { section: next }, replace: true })
  }

  return (
    <CreatorSettingsPage activeSection={section} onSectionChange={handleSectionChange} />
  )
}
```

### 4. Componentes de layout

**Directorio**: `src/features/identity/settings/`

**`CreatorSettingsPage.tsx`**

Props: `{ activeSection: SettingsSection, onSectionChange: (s: SettingsSection) => void }`

Layout: sidebar fijo + área de contenido scrollable. La query `useGetMyCreatorSettings()` se dispara aquí y se pasa como prop a cada sección. Mientras carga → skeleton. Si falla → error banner.

Secciones mapeadas al componente correspondiente (cada uno recibe `data: CreatorSettingsResponse`):
- `general` → `<GeneralSection data={data} />` (stub vacío en esta task)
- `colaboraciones` → `<CollaborationSection data={data} />` (stub)
- `redes-tarifas` → `<RatesSection data={data} />` (stub)
- `portfolio` → `<PortfolioSection data={data} />` (stub)
- `billetera` → `<WalletSection />` (stub; esta sección tiene su propio query, no necesita `data`)

**`SettingsSidebar.tsx`**

Props: `{ activeSection: SettingsSection, onSectionChange: (s: SettingsSection) => void }`

5 items: `general` / `colaboraciones` / `redes-tarifas` / `portfolio` / `billetera`. El item activo tiene estado visual diferenciado. Cada item es un `<button>` que llama `onSectionChange`. Accesible con teclado (role implícito de botón, navegación por tab).

Labels en español:
- `general` → "General"
- `colaboraciones` → "Colaboraciones"
- `redes-tarifas` → "Redes y tarifas"
- `portfolio` → "Portfolio"
- `billetera` → "Billetera"

**`SectionSaveBar.tsx`**

Props:
```ts
interface SectionSaveBarProps {
  isDirty: boolean
  isSubmitting: boolean
  error: string | null
  onSave: () => void
  onReset?: () => void
}
```

Comportamiento:
- Botón "Guardar" deshabilitado cuando `!isDirty || isSubmitting`.
- Cuando `isSubmitting` → label "Guardando…" + spinner (o `disabled` + opacity).
- Cuando `error !== null` → muestra mensaje de error inline debajo del botón con opción de reintentar (el propio botón Guardar sirve para reintentar).
- Cuando `isDirty === false && !isSubmitting && !error` → puede mostrarse en estado "guardado" o simplemente deshabilitado.
- El bar está al fondo de la sección (sticky bottom o al final del scroll del contenido).

Los stubs de secciones pueden renderizar `<SectionSaveBar isDirty={false} isSubmitting={false} error={null} onSave={() => {}} />` para validar que el componente funciona.

### Tipos

`SettingsSection` se exporta desde `src/routes/_creator/settings.tsx` y se importa en los componentes del feature.

## Acceptance

- [ ] No quedan referencias a `BestVideoKind`, `kind: 'organic'`, `kind: 'branded'` en código de producción ni tests (excepto dentro de `src/shared/api/generated/`).
- [ ] `formatOffer.ts` solo tiene labels para `yt_short`, `ig_reel`, `tiktok_video` (sin `ig_story`, `ig_post`, `yt_long`, `tiktok_post`).
- [ ] `git log` muestra un commit con el diff de `pnpm api:sync` + las limpiezas.
- [ ] Navegar a `/_creator/settings` renderiza la pantalla con sidebar de 5 items.
- [ ] `?section=colaboraciones` activa el item Colaboraciones en el sidebar; `?section=invalido` muestra la sección `general` (default del schema Zod).
- [ ] Click en cada item del sidebar actualiza `?section=` en la URL sin recarga.
- [ ] "Ajustes" aparece en el sidebar del creator shell (entre Earnings y Analytics).
- [ ] `useGetMyCreatorSettings` se dispara al cargar la pantalla; mientras está en `pending` se muestra skeleton; en `error` se muestra banner.
- [ ] `SectionSaveBar` con `isDirty=true` habilita el botón Guardar; con `isDirty=false` lo deshabilita.
- [ ] `SectionSaveBar` con `error="mensaje"` muestra el error debajo del botón.
- [ ] `pnpm typecheck` verde.
- [ ] `pnpm test` verde (los tests de onboarding actualizados pasan sin `kind`).
- [ ] Unit test de `validateSearch`: `section` inválido → `'general'`; sin `section` → `'general'`; `section='billetera'` → `'billetera'`.

## Done summary
Implemented fn-30-feat-038-creator-profile-edit-frontend.1; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: