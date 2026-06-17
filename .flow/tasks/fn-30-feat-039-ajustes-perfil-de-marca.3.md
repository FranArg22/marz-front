# fn-30-feat-039-ajustes-perfil-de-marca.3 GeneralSection + ProfileCard + BrandCard + LogoUploader

## Description

> ESTA TAREA REQUIERE MIRAR EL DISEÑO — node_ids: `uroNq`, `Jcs6P`, `qSorw`

Implementar la pantalla General de Ajustes: formulario único con dos cards (Perfil y Marca) y un único botón Guardar al fondo. Incluye `LogoUploader` con presign S3.

Antes de implementar, leer el diseño:
```
pencil interactive --in marz-docs/features/FEAT-039-ajustes-perfil-marca/FEAT-039.pen --out /tmp/marz-FEAT-039-read.pen
pencil > batch_get({ nodeIds: ["uroNq","Jcs6P","qSorw"], readDepth: 3, resolveVariables: true })
pencil > export_nodes({ nodeIds: ["uroNq","Jcs6P","qSorw"], outputDir: "/tmp", format: "png" })
```

## Archivos a crear

### `src/features/identity/settings/GeneralSection.tsx`

Form único con TanStack Form + Zod. Un único botón Guardar al fondo.

Flujo:
1. Cargar con `useGetBrandSettings()` de `src/shared/api/generated/identity/identity.ts`.
2. Inicializar el form con los valores del response. Campos:
   - **Perfil**: `full_name` (string, requerido), `email` (read-only), `phone_e164` (string | null, opcional).
   - **Marca**: `name` (string, requerido), `website_url` (string, requerido https), `logo_s3_key` (string | null, manejado por `LogoUploader`).
3. Al Guardar: si el logo cambió, `logo_s3_key` ya está en S3 (ver `LogoUploader`). Enviar solo los campos modificados via `usePatchBrandSettings()`.
4. On success: invalidar query key de `getBrandSettings` para refetch. Toast de éxito.
5. On error 422: mapear `error.data.fields` a errores inline por campo (ver forma del error en `src/shared/api/generated/identity/identity.ts` → `patchBrandSettingsResponse422`).

Schema Zod para validación client-side:
```ts
const schema = z.object({
  full_name: z.string().min(1).max(200),
  phone_e164: z.string().regex(/^\+[1-9]\d{1,14}$/).nullable().optional(),
  name: z.string().min(1).max(200),
  website_url: z.string().url().refine(u => u.startsWith('https://'), 'Must be https'),
  logo_s3_key: z.string().nullable().optional(),
})
```

El email NO forma parte del form (read-only, solo display).

### `src/features/identity/settings/ProfileCard.tsx`

Card con campos:
- `full_name` — input de texto, label `Nombre`, requerido.
- `email` — input de texto deshabilitado (read-only), label `Email`. Sin error state.
- `phone_e164` — input de texto opcional. Label `Teléfono`. Placeholder formato E.164 (`+54911...`). Permite vaciar a null.

Corresponde al nodo `Jcs6P` del `.pen`.

### `src/features/identity/settings/BrandCard.tsx`

Card con campos:
- Logo — `LogoUploader` (ver abajo).
- `name` — input de texto, label `Nombre de marca`, requerido.
- `website_url` — input de texto, label `Sitio web`, requerido. Placeholder `https://`.

Corresponde al nodo `qSorw` del `.pen`.

### `src/features/identity/settings/LogoUploader.tsx`

Componente de upload de logo de marca. Recibe:
- `currentLogoUrl: string | null` — URL actual del logo (para preview).
- `onKeyChange: (key: string | null) => void` — callback cuando el logo cambia exitosamente en S3 (recibe la `s3_key` para ponerla en el form).

Flujo interno:
1. Mostrar preview del logo actual (o avatar con iniciales de marca si `null`).
2. Botón para seleccionar archivo (image/png, image/jpeg, image/webp; max según backend).
3. Al seleccionar: llamar `usePresignBrandLogo()` con `{ content_type, content_length }`.
4. Con la presign response: hacer PUT directo al `upload_url` con el archivo y los `required_headers` del response.
5. Si PUT falla: mostrar error inline "Error al subir la imagen. Intentá de nuevo." NO llamar `onKeyChange`. El logo en el form queda con el valor anterior.
6. Si PUT OK: llamar `onKeyChange(s3_key)` y mostrar preview del archivo local (URL.createObjectURL).
7. Botón "Quitar logo" (si hay logo): llama `onKeyChange(null)`, limpia preview.

`usePresignBrandLogo` viene de `src/shared/api/generated/identity/identity.ts`.

La `s3_key` del presign tiene formato `brand-logos/{workspace_id}/{uuid}.{ext}`.

## Importaciones clave

```ts
import { useGetBrandSettings, usePatchBrandSettings, usePresignBrandLogo } from '#/shared/api/generated/identity/identity'
import { getGetBrandSettingsQueryKey } from '#/shared/api/generated/identity/identity'
import { useQueryClient } from '@tanstack/react-query'
```

## Reglas

- Un único botón Guardar para todo el form (Perfil + Marca juntos). No hay guardado automático por campo (divergencia confirmada con spec original).
- Email NO editable: renderizar como `<input disabled>` o `<p>`. Sin lógica de magic link.
- `phone_e164` vacío → enviar `null` en el PATCH (no enviar `""`).
- Si ningún campo cambió y el logo tampoco → no llamar al PATCH (noop en el onSubmit).
- Headings con `font-semibold` (regla del repo).
- `Intl.DateTimeFormat` / `Intl.NumberFormat` al scope de módulo si se usan (no los usan estos componentes, pero respetar la regla).
- No usar index como React key si se renderizan listas.

## Tests (Vitest)

`src/features/identity/settings/GeneralSection.test.tsx`:
- Submit con todos los campos válidos → llama `patchBrandSettings` con los diffs.
- `phone_e164` vacío → envía `null`.
- Error 422 con `fields.website_url: 'invalid_url'` → error inline visible bajo website_url, resto del form intacto.
- Logo cambiado (LogoUploader llama onKeyChange con key) → PATCH incluye `logo_s3_key`.
- PUT S3 falla → PATCH no se llama, form sigue dirty.

`src/features/identity/settings/LogoUploader.test.tsx`:
- Presign OK + PUT OK → `onKeyChange` llamado con la key.
- PUT S3 falla (status !== 2xx) → `onKeyChange` no llamado, error visible.

## Acceptance
- [ ] `GeneralSection` carga datos de `useGetBrandSettings` y muestra email read-only.
- [ ] Un único botón Guardar llama `usePatchBrandSettings` con solo los campos modificados.
- [ ] `LogoUploader`: presign → PUT S3 → preview local. PUT falla → no PATCH.
- [ ] Error 422 del backend mapea a errores inline por campo (no toast de error genérico).
- [ ] Invalidación de query key tras éxito del PATCH.
- [ ] Visual ≥95% match con nodos `uroNq`, `Jcs6P`, `qSorw` del `.pen`.
- [ ] `pnpm typecheck && pnpm vitest run src/features/identity/settings` pasan.
- Verify: `pnpm typecheck && pnpm vitest run src/features/identity/settings`

## Done summary
Implemented fn-30-feat-039-ajustes-perfil-de-marca.3; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: