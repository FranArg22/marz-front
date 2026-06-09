---
satisfies: [R1]
---

# fn-28-feat-036-extract-creators-bc-frontend.1 — F.1 Commit api:sync + fix CampaignInlineEditor sin version

## Description

Committear el diff de `pnpm api:sync` generado contra el backend FEAT-036 y corregir el breaking change que introdujo en `CampaignInlineEditor`.

**Size:** S

## Estado inicial

El diff ya está aplicado en el working tree. Son exactamente 3 archivos:

| Archivo | Cambio |
|---------|--------|
| `openapi/spec.json` | `version` eliminado de `CampaignDetailResponse.required[]` y de sus `properties` |
| `src/shared/api/generated/model/campaignDetailResponse.ts` | Línea `version: number;` eliminada |
| `src/shared/api/generated/zod/campaigns/campaigns.ts` | Línea `"version": zod.number(),` eliminada de `GetCampaignDetailResponse` |

`pnpm typecheck` pasa limpio con este diff. No hay errores TypeScript.

## Breaking change identificado

`CampaignDetailResponse` ya no tiene el campo `version`. El endpoint `GET /v1/campaigns/{id}/detail` no lo devuelve más.

`CampaignInlineEditor` (en `src/features/campaigns/detail/overview/CampaignInlineEditor.tsx`) usa `campaign.version` para construir el header `If-Match` en cada edición:

```ts
// líneas 84-92 (CampaignInlineEditor.tsx)
const saveField = async (field, value) => {
  const version = currentCampaign.version
  if (typeof version !== 'number') {
    setBanner({ kind: 'error', message: 'No pudimos guardar porque falta la versión actual...' })
    return false  // ← BLOQUEA TODO SAVE en producción después de FEAT-036
  }
  await updateCampaign.mutateAsync({
    campaignId,
    data: { [field]: value },
    ifMatch: String(version),
  })
}
```

Después de FEAT-036, `version` es siempre `undefined` cuando se carga la página desde `GET /detail`. El editor queda completamente bloqueado: ningún campo se puede editar.

**Tipo**: `EditableCampaign = CampaignDetailResponse & Partial<Omit<Campaign, keyof CampaignDetailResponse>>`. Después del cambio en `CampaignDetailResponse`, `version` viene del lado `Partial<Campaign>` → `version?: number`. TypeScript no falla, pero el runtime sí.

**Fuente alternativa de `version`**: el response de `PATCH /v1/campaigns/{id}` (tipo `Campaign`, que sí tiene `version`) ya se mergea en `currentCampaign` (línea 111 de `CampaignInlineEditor.tsx`). El segundo save ya tendría version. El problema es solo el PRIMERO.

**No hay GET que devuelva `Campaign.version`**: solo `PATCH` (update) y `POST` (create) devuelven `Campaign`. No existe `GET /v1/campaigns/{id}` en el spec actual.

## Approach

### 1. Commit los 3 archivos del api:sync

```bash
git add openapi/spec.json \
  src/shared/api/generated/model/campaignDetailResponse.ts \
  src/shared/api/generated/zod/campaigns/campaigns.ts
```

Mensaje de commit: `chore: api:sync FEAT-036 — drop version from CampaignDetailResponse`.

### 2. Corregir `CampaignInlineEditor.saveField`

**Archivo**: `src/features/campaigns/detail/overview/CampaignInlineEditor.tsx`

Reemplazar el bloque `saveField` actual (líneas 84-125) por la siguiente implementación. Los cambios son:
- Eliminar el guard `if (typeof version !== 'number') { setBanner(error); return false }`
- Calcular `ifMatch = typeof version === 'number' ? String(version) : '*'`
- Mover `setBanner(null)` al inicio

```ts
const saveField = async (field: EditableField, value: unknown) => {
  setBanner(null)
  // version proviene del PATCH response (Campaign.version) una vez que el user editó por primera vez.
  // En el primer save post-FEAT-036, no hay version en CampaignDetailResponse; se usa wildcard.
  const version = currentCampaign.version
  const ifMatch = typeof version === 'number' ? String(version) : '*'

  const response = await updateCampaign
    .mutateAsync({
      campaignId,
      data: { [field]: value } as UpdateCampaignRequest,
      ifMatch,
    })
    .catch((error: unknown) => {
      setBanner(buildBannerFromError(error))
      return null
    })

  if (!response) {
    return false
  }

  const updatedCampaign = response.data as EditableCampaign
  setCurrentCampaign((previous) => ({ ...previous, ...updatedCampaign }))
  queryClient.setQueryData<EditableCampaign>(
    campaignDetailQueryKey(campaignId),
    (previous) => (previous ? { ...previous, ...updatedCampaign } : previous),
  )
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: campaignDetailQueryKey(campaignId),
    }),
    queryClient.invalidateQueries({
      queryKey: campaignOverviewQueryKey(campaignId),
    }),
  ])
  return true
}
```

El badge `{typeof currentCampaign.version === 'number' ? <Badge>Versión {version}</Badge> : null}` (línea 145) ya es condicional — no tocar.

### 3. Actualizar tests unitarios

**Archivo**: `src/features/campaigns/detail/overview/CampaignInlineEditor.test.tsx`

El test existente `'saves an editable name with only that field and current If-Match version'` sigue pasando sin cambios (usa `makeCampaign({ version: 7 })` → `ifMatch: '7'`).

Agregar nuevo test después del existente:

```ts
it('saves with If-Match wildcard when version is absent from the campaign prop', async () => {
  const user = userEvent.setup()
  mutateUpdateCampaign.mockResolvedValue({
    status: 200,
    data: makeCampaign({ name: 'Nueva campaña', version: 1 }),
    headers: new Headers(),
  })
  const campaignWithoutVersion: TestCampaign = { ...makeCampaign(), version: undefined }
  renderEditor(campaignWithoutVersion)

  await user.click(screen.getByRole('button', { name: /nombre/i }))
  const input = screen.getByRole('textbox', { name: /^nombre$/i })
  await user.clear(input)
  await user.type(input, 'Nueva campaña')
  await user.click(screen.getByRole('button', { name: /^guardar$/i }))

  expect(mutateUpdateCampaign).toHaveBeenCalledWith({
    campaignId: 'campaign-1',
    data: { name: 'Nueva campaña' },
    ifMatch: '*',
  })
})
```

Verificar que ningún test existente espere el mensaje `'No pudimos guardar porque falta la versión actual de la campaña.'` — si hay alguno, eliminarlo.

`TestCampaign = CampaignDetailResponse & Partial<Omit<Campaign, keyof CampaignDetailResponse>>`. Después del cambio, `version` es `version?: number`. `{ ...makeCampaign(), version: undefined }` es type-safe.

### 4. Actualizar E2E test

**Archivo**: `src/test/e2e/suites/campaigns/campaign-inline-edit.spec.ts`

**Contexto**: El mock actual en `**/v1/campaigns/${campaignId}` (sin `/detail`) intercepta el PATCH pero NO el `GET /v1/campaigns/{id}/detail` que es el que realmente carga la página (URL: `**/v1/campaigns/${campaignId}/detail`). El detail data viene del backend real → después de FEAT-036, no tiene `version`.

**Cambio a)** Eliminar `version` de `makeCampaignDetail` — el campo ya no existe en `CampaignDetailResponse`:

```ts
function makeCampaignDetail(
  overrides: Partial<{
    name: string
    image_s3_key: string
    // eliminar `version` del Partial
  }> = {},
) {
  return {
    campaign_id: campaignId,
    id: campaignId,
    brand_workspace_id: brandWorkspaceId,
    // ... resto de campos de CampaignDetailResponse
    // SIN campo version
  }
}
```

**Cambio b)** Agregar mock del detail endpoint en `mockCampaignReadModels` para que el E2E sea determinístico y no dependa del backend real:

```ts
async function mockCampaignReadModels(
  page: Page,
  getCampaign: () => CampaignDetail,
) {
  await page.route(`**/v1/campaigns/${campaignId}/detail`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(getCampaign()),
    })
  })

  await page.route(`**/v1/campaigns/${campaignId}/overview**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(makeCampaignOverview(getCampaign())),
    })
  })
}
```

**Cambio c)** El PATCH handler devuelve `Campaign` (con version), no `makeCampaignDetail`. Construir el objeto manualmente con todos los campos de `Campaign`:

```ts
// Dentro del handler PATCH
const updatedCampaign = {
  id: campaignId,
  brand_workspace_id: brandWorkspaceId,
  status: 'active',
  version: 8,
  name: 'Campaña inline actualizada',
  // ... campos completos de Campaign
}
await route.fulfill({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify(updatedCampaign),
})
```

**Cambio d)** Actualizar `expect(ifMatch).toBe('7')` por `expect(ifMatch).toBe('*')` en todos los tests que esperaban `'7'` (primer save cuando no hay version en el detail).

### 5. Ejecutar quality gates

```bash
pnpm work:post
```

**Failures pre-existentes conocidos** (no son scope de esta task, fallan en main también):
- `src/features/deliverables/analytics.test.ts` (link analytics tracking)
- `src/features/deliverables/components/SubmitLinkSidesheet.test.tsx`
- `src/features/deliverables/components/__tests__/LinkSubmittedCard.test.tsx`
- `src/features/deliverables/components/__tests__/LinkChangesRequestedCard.test.tsx`
- `src/features/deliverables/components/__tests__/RequestChangesCard.test.tsx` (snapshot TZ mismatch)
- `src/features/deliverables/components/LinkPreviewBlock.test.tsx`
- `src/routes/topbar-routes.test.tsx` (campaigns topbar)

No tocar estos. No introducir nuevos failures.

## Acceptance

- [ ] Los 3 archivos de api:sync commiteados con mensaje de commit apropiado.
- [ ] `CampaignInlineEditor.saveField` no bloquea el save cuando `version === undefined`; usa `If-Match: '*'`.
- [ ] Nuevo unit test: save con `version: undefined` → `ifMatch: '*'`.
- [ ] E2E `campaign-inline-edit.spec.ts`: `makeCampaignDetail` sin `version`, mock de `/detail` agregado, `expect(ifMatch).toBe('*')` en primer save.
- [ ] `pnpm typecheck` verde.
- [ ] `pnpm test` verde excepto los failures pre-existentes listados arriba (sin nuevos failures).
- [ ] `pnpm test:e2e --grep "campaign detail inline edit"` verde.
- [ ] Smoke manual: abrir campaign detail, editar nombre, guardar sin error "falta la versión".
- [ ] Smoke manual: abrir el wizard de creación de campaign, verificar que carga y funciona sin errores.
- [ ] Smoke manual: abrir el listado de creators existente (Discovery grid), verificar que renderiza sin errores.

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs: