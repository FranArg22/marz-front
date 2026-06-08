---
satisfies: [R10]
---

# fn-27-feat-034-unified-campaign-creation.12 F.12 — Campaign detail: edición inline PATCH (10 campos editables, If-Match)

## Description

Actualizar `src/routes/_brand/campaigns.$campaignId.index.tsx` para soportar edición inline de los 10 campos editables de una Campaign via PATCH con `If-Match: version`. Los 5 campos inmutables deben aparecer sin UI de edición.

**Size:** L

**Archivos a modificar/investigar:**

- `src/routes/_brand/campaigns.$campaignId.index.tsx` — ruta principal del detail
- `src/features/campaigns/detail/` — componentes existentes del Campaign detail

## Approach

**Investigación previa (requerida antes de implementar):**

Leer `src/routes/_brand/campaigns.$campaignId.index.tsx` y los archivos en `src/features/campaigns/detail/` para entender cómo se muestra el Campaign detail actualmente y qué datos se cargan. Adaptar el approach según lo que ya existe.

**Campos editables (10):**

Presentar UI editable inline (click para editar, guardar en blur o con botón explícito "Guardar"):
1. `name` (texto)
2. `description` (textarea)
3. `target_url` (input)
4. `image_s3_key` (reemplazar imagen: dropzone + crop si aplica + presign + upload S3)
5. `interests` (chips multi-select)
6. `min_creator_tier_slug` (chips radio)
7. `compensation_notes` (textarea opcional)
8. `video_reuse_permission_default` (toggle)
9. `content_guidelines` (textarea)
10. `brief_pdf_s3_key` (dropzone PDF, opcional)

**Campos inmutables (5) — solo display, sin UI editable:**

- `content_type`
- `pricing_model`
- `platforms`
- `creator_country`
- `compensation_type`

**Optimistic locking:**

El `If-Match` header debe enviarse con la `version` actual de la campaign. `useUpdateCampaignMutation` ya recibe la version y la inyecta como header (según F.2).

**Manejo de errores:**

- `412 concurrency.version_mismatch`: mostrar banner "El dato cambió desde otra sesión. Recargá la página para ver la versión actualizada." + botón "Recargar" que invalida la campaign detail query.
- `422 campaign.field_immutable`: no debería ocurrir si la UI no permite editar esos campos, pero manejar con banner "Este campo no se puede modificar".
- Otros 422: banner con el mensaje del error.

**On success:** invalidar campaign detail query key para refetch.

## Acceptance

- [ ] Los 10 campos editables tienen UI de edición inline (click para editar).
- [ ] Los 5 campos inmutables solo muestran el valor, sin UI editable.
- [ ] Editar y guardar un campo llama PATCH con `If-Match: <current_version>` y solo el campo modificado.
- [ ] On success: UI se actualiza con el valor nuevo y la versión incrementada.
- [ ] 412 `version_mismatch` → banner "el dato cambió, recargá" + botón Recargar.
- [ ] E2E: editar `name` → PATCH correcto → nombre actualizado en UI.
- [ ] E2E: editar imagen → crop/upload/PATCH → imagen actualizada.
- [ ] E2E: 412 simulado → banner correcto.
- [ ] Tests unit: campos inmutables no renderizan inputs; campo editable llama PATCH; 412 muestra banner.
- [ ] `pnpm typecheck` pasa.

## Done summary
Implemented fn-27-feat-034-unified-campaign-creation.12; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: