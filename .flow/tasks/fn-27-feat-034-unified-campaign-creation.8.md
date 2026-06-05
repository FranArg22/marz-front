---
satisfies: [R6]
---

# fn-27-feat-034-unified-campaign-creation.8 F.8 — Paso 6: Guidelines de contenido + PDF opcional

## Description

Implementar el Paso 6 del wizard: textarea de content guidelines (mínimo 50 chars) y dropzone PDF opcional con upload S3.

**Size:** M

**Archivos a crear:**

- `src/features/campaigns/wizard/WizardStep6Content.tsx`
- `src/features/campaigns/wizard/WizardStep6Content.test.tsx`
- `src/features/campaigns/wizard/BriefPdfDropzone.tsx`
- `src/features/campaigns/wizard/BriefPdfDropzone.test.tsx`

## Approach

**Campos:**

- **Content guidelines** (`content_guidelines`): textarea requerida. Mínimo 50 chars — mostrar contador "N/50 mínimo" mientras sea < 50. Al llegar a 50+, el contador cambia a "N caracteres". Max sin límite estricto (guiar con UX pero no bloquear).
- **PDF del brief** (`brief_pdf_s3_key`): dropzone opcional (`BriefPdfDropzone`).

**BriefPdfDropzone:**

- Solo acepta `application/pdf`. Tamaño máximo: 10 MB. Error inline si no cumple.
- Si el archivo es válido: llamar `usePresignBriefPdfMutation` → obtener `upload_url` y `s3_key` → `uploadToS3(...)` → guardar `s3_key` en `store.step6.briefPdfS3Key`.
- Mostrar nombre del archivo + botón de eliminar mientras hay un PDF cargado.
- Al eliminar: `store.setStep6({ briefPdfFile: null, briefPdfS3Key: null })`.

**Continuar** habilitado cuando `content_guidelines.trim().length >= 50`. El PDF es opcional: si no hay PDF, `briefPdfS3Key` será null y el POST final lo enviará como null.

Al hacer click en Continuar: `store.markStepCompleted(6)`, navegar a `?step=7`.

## Acceptance

- [ ] Textarea con contador: < 50 chars muestra "N/50 mínimo" en color de advertencia; ≥ 50 chars cambia a "N caracteres" en color neutro.
- [ ] "Continuar" disabled cuando `content_guidelines.trim().length < 50`.
- [ ] `BriefPdfDropzone` rechaza archivos no-PDF con error inline.
- [ ] `BriefPdfDropzone` rechaza PDF > 10 MB con error inline.
- [ ] Upload S3 correcto: `briefPdfS3Key` se guarda en store.
- [ ] Botón eliminar PDF limpia store y la UI vuelve al estado vacío.
- [ ] Tests unit: "Continuar" disabled con 49 chars; habilitado con 50+; rechazo de tipo incorrecto; rechazo > 10 MB.
- [ ] E2E: escribir 50+ chars + subir PDF → `?step=7`.
- [ ] Tracking: `campaign_wizard_pdf_rejected` con `reason: 'size' | 'type'` (a integrar en F.13).
- [ ] `pnpm typecheck` pasa.

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
