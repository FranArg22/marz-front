---
satisfies: [R5]
---

# fn-27-feat-034-unified-campaign-creation.7 F.7 — Paso 5: Compensación (tipo, notas, video reuse)

## Description

Implementar el Paso 5 del wizard: tipo de compensación, notas y toggle de reutilización de video.

**Size:** S

**Archivos a crear:**

- `src/features/campaigns/wizard/WizardStep5Compensation.tsx`
- `src/features/campaigns/wizard/WizardStep5Compensation.test.tsx`

## Approach

**Campos:**

- **Tipo de compensación** (`compensation_type`): radio group con 3 opciones:
  - `payment` — "Pago monetario" — **habilitada**.
  - `product_trade` — "Canje de producto" — **disabled** con badge "Próximamente".
  - `payment_plus_product` — "Pago + canje" — **disabled** con badge "Próximamente".
  - Solo una seleccionable; MVP auto-selecciona `payment` al montar si el store está vacío.
- **Notas de compensación** (`compensation_notes`): textarea opcional (no requerida para habilitar Continuar). Guardar en `store.step5.compensation_notes`.
- **Reutilización de video** (`video_reuse_permission_default`): toggle/switch boolean. Default `false`. Guardar en `store.step5.video_reuse_permission_default`.

**Continuar** habilitado cuando `compensation_type !== null` (siempre en MVP porque `payment` está auto-seleccionada).

Al hacer click en Continuar: `store.markStepCompleted(5)`, navegar a `?step=6`.

## Acceptance

- [ ] `compensation_type = 'payment'` se selecciona al montar si el store está vacío.
- [ ] Las opciones `product_trade` y `payment_plus_product` están visualmente disabled (pointer-events-none + apariencia atenuada).
- [ ] `compensation_notes` textarea actualiza el store; es opcional (puede estar vacío).
- [ ] Toggle `video_reuse_permission_default` refleja el estado del store y lo actualiza al toggle.
- [ ] "Continuar" habilitado cuando `compensation_type !== null`.
- [ ] Tests unit: disabled options no disparan `setStep5`; toggle actualiza el store; Continuar habilitado en estado default.
- [ ] `pnpm typecheck` pasa.

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
