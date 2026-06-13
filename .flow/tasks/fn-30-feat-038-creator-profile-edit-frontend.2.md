# fn-30-feat-038-creator-profile-edit-frontend.2 — GeneralSection: contacto + avatar con guardado unificado

## Description

**Size:** L

Implementa `GeneralSection` en `src/features/identity/settings/GeneralSection.tsx`.

Esta sección tiene un único form (TanStack Form + Zod) que cubre:
- `AvatarField` — preview de la foto actual, input de archivo, subida pendiente en memoria hasta guardar.
- `ContactFields` — nombre completo, teléfono (E.164), fecha de nacimiento (edad ≥ 18), país (ISO2), ciudad, dirección de envío.
- Email — input deshabilitado (solo lectura), no forma parte del form state.

El botón `Guardar` (vía `SectionSaveBar`) orquesta en orden:
1. Si el usuario seleccionó una foto nueva: presign (`usePresignCreatorAvatar`) → PUT S3 → `useSetMyCreatorAvatar`.
2. Si hay campos de contacto modificados: `useUpdateMyCreatorProfileContact`.

Si el paso del avatar falla, el PATCH de contacto **no se ejecuta**; el form queda dirty para reintentar. Si el avatar ya se subió a S3 pero `PUT /v1/creators/me/avatar` falla, idem — el form queda dirty.

### Props

```ts
interface GeneralSectionProps {
  data: CreatorSettingsResponse
}
```

### Form schema (Zod)

```ts
const GeneralSectionSchema = z.object({
  full_name: z.string().min(1).max(200),
  phone_e164: z.string().regex(/^\+[1-9]\d{1,14}$/).optional().or(z.literal('')),
  birthday: z.string().optional(),   // 'YYYY-MM-DD'; validar age >= 18 en submit (no en onChange para no irritar al usuario mientras tipea)
  country: z.string().length(2).optional().or(z.literal('')),
  city: z.string().max(200).optional(),
  shipping_address: z.string().max(500).optional(),
  // pendingAvatarFile: File | null — NO va en el Zod schema; se maneja con useState local
})
```

La validación de `birthday` (edad ≥ 18) se hace en `onSubmit` antes de ejecutar las mutations; si falla se muestra error en el campo y se corta el submit.

### Avatar

El manejo del archivo de foto es local al componente (useState, no TanStack Form ni Zustand):
```ts
const [pendingFile, setPendingFile] = useState<File | null>(null)
const [avatarPreview, setAvatarPreview] = useState<string>(data.avatar_url)
```

`ACCEPTED_TYPES`: `{ 'image/jpeg': 'image/jpeg', 'image/png': 'image/png', 'image/webp': 'image/webp' }` (igual que C17AvatarScreen en onboarding).
`MAX_BYTES`: 5 * 1024 * 1024.

Al seleccionar archivo: validar tipo + tamaño → si válido, crear dataUrl con `FileReader` → setAvatarPreview + setPendingFile. Si inválido → toast.error + no cambiar state.

### Orquestación del guardado

```ts
async function handleSave() {
  // 1. Validar form con Zod antes de hacer cualquier request
  // 2. Validar birthday age >= 18 si viene
  // 3. Si pendingFile !== null:
  //    a. presign (usePresignCreatorAvatar.mutateAsync)
  //    b. PUT S3 con fetch nativo (igual que C17AvatarScreen)
  //    c. useSetMyCreatorAvatar.mutateAsync({ data: { s3_key: result.s3_key } })
  //    d. invalidar getGetMyCreatorSettingsQueryKey() en queryClient
  //    e. Si cualquier paso falla → setSaveError(message) y return (no continuar)
  // 4. Si hay campos de contacto modificados (comparar con data.contact):
  //    a. useUpdateMyCreatorProfileContact.mutateAsync({ data: { ...changedFields } })
  //    b. invalidar getGetMyCreatorSettingsQueryKey()
  //    c. Si falla → setSaveError(message)
}
```

Solo se envían al PATCH los campos que efectivamente cambiaron (comparar con `data.contact`). Si nada cambió en contacto, no se hace el PATCH.

`dirty`: el form está dirty si `pendingFile !== null` O si algún campo del form tiene un valor distinto al cargado de `data.contact`.

### Hooks importados

```ts
import { useGetMyCreatorSettings, useSetMyCreatorAvatar, useUpdateMyCreatorProfileContact } from '#/shared/api/generated/creator/creator'
import { getGetMyCreatorSettingsQueryKey } from '#/shared/api/generated/creator/creator'
import { usePresignCreatorAvatar } from '#/shared/api/generated/onboarding/onboarding'
```

### Invalidación de query tras mutación exitosa

```ts
await queryClient.invalidateQueries({ queryKey: getGetMyCreatorSettingsQueryKey() })
```

### Ejemplo de estructura JSX

```tsx
<form onSubmit={...}>
  {/* Avatar */}
  <AvatarField
    preview={avatarPreview}
    onFileSelected={handleFile}
    onRemove={/* no hay remove: la foto se reemplaza, nunca elimina */}
  />

  {/* Email solo lectura */}
  <div>
    <label>Email</label>
    <input value={data.contact.email} disabled aria-label="Email" />
  </div>

  {/* Campos de contacto — usando useAppForm o useForm directo */}
  {/* full_name, phone_e164, birthday (3 selects o date input), country, city, shipping_address */}

  <SectionSaveBar
    isDirty={isDirty}
    isSubmitting={isSubmitting}
    error={saveError}
    onSave={handleSave}
  />
</form>
```

## Acceptance

- [ ] Al montar la sección, los campos se inicializan con `data.contact` y el avatar con `data.avatar_url`.
- [ ] Seleccionar un archivo JPEG/PNG/WebP: preview actualizado en UI; `pendingFile` setteado; SectionSaveBar pasa a dirty.
- [ ] Seleccionar archivo >5MB → `toast.error`, preview sin cambiar, `pendingFile` null.
- [ ] Seleccionar archivo no-imagen → `toast.error`, sin cambios.
- [ ] Guardar con foto nueva: orden verificado en tests — presign → PUT S3 → PUT avatar → PATCH contact. En E2E: ambos datos persistidos.
- [ ] Guardar con foto nueva: si `usePresignCreatorAvatar` falla → PATCH contact NO se llama; form permanece dirty; `SectionSaveBar` muestra error.
- [ ] Email renderizado como `<input disabled>` (o equivalente); no figura en el form state; no se envía en el PATCH.
- [ ] Unit test: birthday con edad < 18 en submit → error de validación en el campo birthday; mutations no se llaman.
- [ ] Unit test: E.164 inválido (ej. `'1234'`) → error de validación en phone_e164; mutations no se llaman.
- [ ] Unit test: solo avatar cambió (no contacto) → solo se ejecutan los 3 pasos del avatar; `useUpdateMyCreatorProfileContact` no se llama.
- [ ] Unit test: solo contacto cambió → solo se ejecuta `useUpdateMyCreatorProfileContact`; no se ejecuta presign.
- [ ] `pnpm typecheck` verde.

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
