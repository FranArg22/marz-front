# fn-30-feat-038-creator-profile-edit-frontend.5 — PortfolioSection

## Description

**Size:** S

Implementa `PortfolioSection` en `src/features/identity/settings/PortfolioSection.tsx`.

Props: `{ data: CreatorSettingsResponse }`

Contiene un único form con `SampleVideoSlots`: exactamente 3 slots siempre visibles (el número de slots no varía). Cada slot puede estar vacío (estado "Pendiente") o tener una URL.

- Slot con URL → muestra la URL + botón `Quitar link`.
- Slot vacío → input de texto para ingresar una URL + label "Pendiente" o similar.

El orden de los slots es el orden visual (slot 0, 1, 2). Si el creator tiene menos de 3 videos, los slots restantes están vacíos.

El botón `Guardar` (vía `SectionSaveBar`) llama a `useReplaceMyCreatorSampleVideos.mutateAsync`. El body es un replace completo: se envían solo los slots con URL, en orden. Un slot vacío = ese ítem ausente del array.

### Tipos relevantes

```ts
// De src/shared/api/generated/model/
CreatorSampleVideo: { url: string }
UpdateSampleVideosRequest: { videos: { url: string }[] }   // 0..3
ReplaceMyCreatorSampleVideos200: { sample_videos: CreatorSampleVideo[] }
```

### Form state

```ts
// Array de 3 posiciones; string vacío = slot vacío
type SlotsState = [string, string, string]
```

Inicialización:
```ts
const initial: SlotsState = ['', '', '']
data.sample_videos.forEach((v, i) => {
  if (i < 3) initial[i] = v.url
})
```

### Validaciones

- URL no vacía debe ser una URL válida HTTP/HTTPS (usar `z.string().url()` o regex `/^https?:\/\/.+/`).
- Máx 3 slots con URL (garantizado por la UI, pero validar en submit).
- Un slot con URL inválida bloquea el guardado de toda la sección (mostrar error en ese slot).

### Body de la mutation

```ts
const videos = slots
  .filter(url => url.trim() !== '')
  .map(url => ({ url: url.trim() }))
// videos.length: 0..3
await useReplaceMyCreatorSampleVideos.mutateAsync({ data: { videos } })
```

### Invalidación

```ts
await queryClient.invalidateQueries({ queryKey: getGetMyCreatorSettingsQueryKey() })
```

### dirty

Hay cambios si el estado actual de los slots difiere de la inicialización. Comparar el array de URLs no-vacías con `data.sample_videos.map(v => v.url)`.

## Acceptance

- [ ] Al montar, los 3 slots siempre son visibles; los que tienen URL de `data.sample_videos` muestran la URL + botón "Quitar link"; los vacíos muestran input.
- [ ] Botón "Quitar link" en un slot con URL → slot pasa a vacío; form dirty.
- [ ] Ingresar URL válida en slot vacío → form dirty.
- [ ] Ingresar URL inválida → error visible en ese slot; botón Guardar bloqueado.
- [ ] Guardar: body contiene solo los slots con URL no vacía, en orden; slots vacíos NO aparecen en el array.
- [ ] Unit test: URL inválida (ej. `'not-a-url'`) → error de validación; mutation no se llama.
- [ ] Unit test: 3 slots vacíos → body `{ videos: [] }`; mutation llamada.
- [ ] Unit test: quitar slot 1 de 3 con URL → body tiene slots 0 y 2 en ese orden.
- [ ] `pnpm typecheck` verde.

## Done summary
Implemented fn-30-feat-038-creator-profile-edit-frontend.5; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: