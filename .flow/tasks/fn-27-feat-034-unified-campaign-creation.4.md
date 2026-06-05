---
satisfies: [R2]
---

# fn-27-feat-034-unified-campaign-creation.4 F.4 — Paso 2: Pricing model (cards)

## Description

Implementar el Paso 2 del wizard: selección de pricing model mediante cards. Patrón idéntico a F.3.

**Size:** S

**Archivos a crear:**

- `src/features/campaigns/wizard/WizardStep2PricingModel.tsx`
- `src/features/campaigns/wizard/WizardStep2PricingModel.test.tsx`

## Approach

Dos cards:
1. **Pay per post** — habilitada. Al seleccionar: `store.setStep2({ pricing_model: 'pay_per_post' })`.
2. **CPM (por 1000 views)** — disabled, con badge "Próximamente".

Click en card habilitada la selecciona. "Continuar" habilitado solo cuando `step2.pricing_model !== null`. Al hacer click en "Continuar": `store.markStepCompleted(2)`, navegar a `?step=3`.

"Atrás" navega a `?step=1` sin limpiar el store.

Reutilizar el mismo componente de card seleccionable de F.3 si fue extraído como componente genérico; si no, replicar el patrón.

## Acceptance

- [ ] Card CPM está disabled (pointer-events-none + opacity reducida).
- [ ] Seleccionar "Pay per post" activa la card visualmente y habilita "Continuar".
- [ ] Click "Continuar" llama `markStepCompleted(2)` y navega a `?step=3`.
- [ ] "Atrás" navega a `?step=1`.
- [ ] Volver al paso 2 después de avanzar mantiene la selección del store.
- [ ] Tests unit: disabled card no dispara setStep2; habilitada actualiza store; Continuar disabled sin selección.
- [ ] E2E: completar pasos 1 y 2, URL llega a `?step=3`.
- [ ] `pnpm typecheck` pasa.

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
