---
satisfies: [R2]
---

# fn-27-feat-034-unified-campaign-creation.3 F.3 — Paso 1: Content type (cards)

## Description

Implementar el Paso 1 del wizard: selección de content type mediante cards. También implementar el `WizardLayout` shell que envuelve todos los pasos.

**Size:** M

**Archivos a crear/modificar:**

- `src/features/campaigns/wizard/WizardLayout.tsx` (nuevo — shell del wizard)
- `src/features/campaigns/wizard/WizardStepIndicator.tsx` (nuevo — barra de progreso 7 pasos)
- `src/features/campaigns/wizard/WizardStep1ContentType.tsx` (nuevo)
- `src/features/campaigns/wizard/WizardStep1ContentType.test.tsx` (nuevo)
- `src/routes/_brand/campaigns.new.tsx` (modificar: montar WizardLayout en lugar del placeholder)

## Approach

**WizardLayout:**

- Recibe `step: number` (1–7) y `totalSteps: 7`.
- Estructura: header fijo con `WizardStepIndicator` + botón "Cancelar", área de contenido scrollable, footer con "Atrás" / "Continuar".
- "Atrás": navega a `?step=step-1` (disabled en step 1). "Continuar": llama `onNext` prop; disabled mientras `nextDisabled=true`.
- Los tokens de color son variables CSS (`--background`, `--foreground`, `--primary`, `--muted`, etc.) — sin colores hardcodeados.

**WizardStep1ContentType:**

Dos cards:
1. **Influencers Posts** — habilitada. Al seleccionar: `store.setStep1({ content_type: 'influencer_posts' })`.
2. **UGC Videos** — disabled, con badge "Próximamente" en `--muted-foreground`.

Click en card habilitada la selecciona. "Continuar" habilitado solo cuando `step1.content_type !== null`. Al hacer click en "Continuar": `store.markStepCompleted(1)`, navegar a `?step=2`.

**WizardStepIndicator:**

Barra horizontal de 7 segmentos. Cada segmento: activo (fill `--primary`), completado (fill `--primary` + check icon), pendiente (fill `--muted`). No necesita labels por ahora.

## Acceptance

- [ ] `WizardLayout` renderiza header, `WizardStepIndicator`, área de contenido y footer con botones Atrás/Continuar.
- [ ] En step 1, el botón "Atrás" está disabled; en step 2+, navega a `?step=N-1`.
- [ ] `WizardStep1ContentType` muestra las dos cards; la card UGC está disabled (no puede recibir click).
- [ ] Seleccionar "Influencer Posts" activa la card visualmente y habilita "Continuar".
- [ ] Click "Continuar" llama `markStepCompleted(1)` y navega a `?step=2`.
- [ ] No hay colores hardcodeados en el JSX — solo variables CSS o clases Tailwind sin valores fijos.
- [ ] Tests unit: card UGC no dispara `setStep1`; card habilitada actualiza store; Continuar disabled sin selección; click Continuar con selección llama `markStepCompleted(1)`.
- [ ] E2E: seleccionar card → `?step=2` en la URL.
- [ ] Validación visual light + dark: sin usar lógica condicional en código para temas; todo vía variables CSS.
- [ ] `pnpm typecheck` pasa.

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
