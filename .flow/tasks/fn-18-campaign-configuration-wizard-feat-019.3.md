---
satisfies: [R1, R2, R10]
---

## Description

Implementar los dos primeros pasos del wizard (`content_type` y `pricing_model`), ambos basados en cards seleccionables. Cada paso tiene mutation propia que se dispara al click "Continuar"; al éxito, se invalida la query de configuración y se navega al `current_step` retornado por backend. Persistencia de progreso es side effect del PATCH (no hay save-draft separado). También agregar redirect post-Brief desde `BriefBuilderWizard` al wizard de configuration.

**Size:** M
**Files:**

- `src/features/campaigns/configuration/ContentTypeStep.tsx` (nuevo)
- `src/features/campaigns/configuration/PricingModelStep.tsx` (nuevo)
- `src/features/campaigns/configuration/ConfigurationFooter.tsx` (nuevo)
- `src/features/campaigns/configuration/hooks.ts` (extender con 2 mutations)
- `src/features/campaigns/brief-builder/BriefBuilderWizard.tsx` (modificar: redirect post-Brief)

## Approach

- ContentType: cards "Influencer Posts" y "UGC Videos". PricingModel: cards "Fixed per video" y "Per views". Selección controlada local hasta "Continuar".
- "Continuar" disabled si no hay selección; al click, llamar mutation con `configuration_version` actual.
- Mutation onSuccess: setQueryData con la response (no invalidate redundante; navega a `/configuration/${response.current_step}`).
- Mutation onError: si `409 configuration_version_conflict`, invalidate query y mostrar toast "La configuración fue modificada en otra sesión, recargando."
- Footer compartido: "Atrás" (deshabilitado en step 1) y "Continuar" (loading state durante mutation).
- En `BriefBuilderWizard.tsx`, tras crear campaign exitosamente y confirmar brief, navegar a `/campaigns/$id/configuration` (no más quedarse en brief view).

## Investigation targets

**Required:**

- `src/features/campaigns/configuration/CampaignConfigurationWizard.tsx` (creado en .2) — orquestación
- `src/features/campaigns/brief-builder/BriefBuilderWizard.tsx` — patrón de mutation per step + navegación
- `src/features/campaigns/configuration/hooks.ts` (creado en .2) — extender

## Design context

Pencil refs: `g8nDly` (S1 ContentType), `QPmTt` (S2 PricingModel).

- **Cards:** layout 2-up, selectable, con icono + título + descripción corta; estado seleccionado usa `--primary` border y subtle bg.
- **Footer:** botones rounded; "Continuar" usa `--primary` fill cuando hay selección.
- **Tokens:** shadcn; UI redondeada generosa.

Full design system: `src/styles.css`.

## Acceptance

- [ ] ContentTypeStep renderiza 2 cards; "Continuar" disabled hasta selección.
- [ ] PricingModelStep idem para sus 2 cards.
- [ ] Selección + Continuar dispara PATCH correcto, actualiza cache y navega a siguiente step retornado por backend.
- [ ] Recargar con paso ya completado muestra la selección persistida.
- [ ] Conflict 409 en cualquiera de los dos: query invalidada, toast mostrado, paso se re-renderiza con valores nuevos.
- [ ] Unit tests: botón disabled sin selección; mutation se llama con args correctos; error 409 dispara invalidate.
- [ ] E2E: completar S1 y S2, recargar entre medio, verificar persistencia.
- [ ] Validación visual desktop dark ≥95% match contra `g8nDly` y `QPmTt`.
- [ ] BriefBuilderWizard tras confirmar brief redirige a `/campaigns/$id/configuration`.

## Done summary

_Pending implementation._

## Evidence

_Pending implementation._
