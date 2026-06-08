---
satisfies: [R8]
---

# fn-27-feat-034-unified-campaign-creation.10 F.10 — Cancelar wizard (modal Salir/Seguir + reset store)

## Description

Implementar el flujo de cancelación del wizard: botón "Cancelar" en el header del wizard con comportamiento diferenciado según si hay datos ingresados o no.

**Size:** S

**Archivos a crear:**

- `src/features/campaigns/wizard/CancelWizardModal.tsx`
- `src/features/campaigns/wizard/CancelWizardModal.test.tsx`

**Archivos a modificar:**

- `src/features/campaigns/wizard/WizardLayout.tsx` (integrar botón Cancelar y la lógica del modal)

## Approach

**Lógica de `isDirty`:**

El store ya tiene `isDirty: boolean`. Es `true` si algún campo de cualquier step fue modificado respecto al estado inicial. Se actualiza automáticamente en cualquier `setStepN()`.

**Flujo al click Cancelar:**

- Si `store.isDirty === false`: navegar directamente a `/campaigns` sin modal (el store ya está limpio).
- Si `store.isDirty === true`: abrir `CancelWizardModal`.

**CancelWizardModal:**

Dialog con dos acciones:
- **Salir** (destructivo): llama `store.reset()` → navegar a `/campaigns`.
- **Seguir editando**: cierra el modal, vuelve al wizard en el step actual.

`store.reset()` revoca `imageBlobUrl` si existe (ya implementado en F.1).

**Integración en WizardLayout:**

Añadir el botón "Cancelar" al header (o usar el botón "Cancelar" existente de `WizardTopbar` que ya está en `campaigns.new.tsx`). Conectar su `onClick` a la lógica descrita.

## Acceptance

- [ ] Con `isDirty=false`, click Cancelar navega a `/campaigns` sin abrir modal.
- [ ] Con `isDirty=true`, click Cancelar abre el `CancelWizardModal`.
- [ ] "Salir" en el modal llama `store.reset()` y navega a `/campaigns`.
- [ ] "Seguir editando" cierra el modal, el wizard permanece en el step actual.
- [ ] `store.reset()` en el flow de cancelación revoca el `imageBlobUrl` (verificar con spy en `URL.revokeObjectURL`).
- [ ] Tests unit: isDirty=false → sin modal; isDirty=true → modal aparece; "Salir" → reset + navigate; "Seguir" → modal cerrado.
- [ ] E2E path 1: abrir wizard → cancelar sin editar → vuelve al listado sin modal.
- [ ] E2E path 2: abrir wizard → llenar paso 1 → cancelar → modal → Salir → listado.
- [ ] Tracking: `campaign_wizard_cancelled` con `step_number_at_cancel` y `had_inputs: boolean` (a integrar en F.13).
- [ ] `pnpm typecheck` pasa.

## Done summary
Implemented fn-27-feat-034-unified-campaign-creation.10; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: