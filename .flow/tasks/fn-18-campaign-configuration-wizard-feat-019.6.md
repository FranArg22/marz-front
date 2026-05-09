---
satisfies: [R1, R2, R5, R6, R7, R10]
---

## Description

Implementar el paso `review`: muestra resumen de los 4 pasos previos como bloques con CTA "Editar" que regresa al paso correcto, y un CTA "Ver brief" que abre la vista read-only del brief. El botón principal "Activar campaña" llama `POST /configuration/activate` con `Idempotency-Key` (UUID v4 nuevo). Manejo de errores: `configuration_version_conflict` recarga el latest; `configuration_incomplete` redirige al primer paso pendiente; replay con misma key es transparente.

**Size:** M
**Files:**

- `src/features/campaigns/configuration/ReviewStep.tsx` (nuevo)
- `src/features/campaigns/configuration/components/ReviewBlock.tsx` (nuevo)
- `src/features/campaigns/configuration/hooks.ts` (extender con `useActivateCampaignConfigurationMutation`)

## Approach

- 4 bloques: Content type, Pricing model, Targeting (resumen compacto: countries count, tiers, follower range, age range), Bonus (lista de windows/milestones o "Sin bonus").
- Cada bloque tiene "Editar" → navega a `/campaigns/$id/configuration/{step}`. Bloque del Brief se renderiza como mini-summary + "Ver brief" → navega a `/campaigns/$id/brief`.
- "Activar campaña": disabled si `configuration_complete=false` (no debería pasar pero defensivo). Loading state durante mutation.
- onSuccess: invalidate `campaigns` list query, navegar a `/campaigns/$id` (Campaign detail), toast "Campaign activada".
- onError 409 `configuration_version_conflict`: invalidate config query, banner "La configuración cambió, revisá los datos actualizados."
- onError 409 `configuration_incomplete`: redirect al primer step en `current_step`.
- Idempotency key generada en `mutationFn` para que retries de TanStack Query reusen, pero un click manual del usuario tras un error de red dispara una key nueva (intencional — el backend cachea por 24h, así que un re-intento real con key nueva tras error es seguro).

## Investigation targets

**Required:**

- `src/features/campaigns/configuration/CampaignConfigurationWizard.tsx` — navegación entre steps
- `src/features/campaigns/configuration/hooks.ts` — patrones de mutation existentes
- `src/features/campaigns/brief-builder/components/BriefSummaryView.tsx` — patrón de resumen read-only

## Design context

Pencil ref: `C3Bh8V` (S5 Review).

- **Bloques:** card por sección con título, summary y CTA "Editar" como ghost button.
- **CTA principal:** botón grande full-width "Activar campaña" usando `--primary`.
- **Banner de conflicto:** alert top de la card con `--destructive` border.

Full design system: `src/styles.css`.

## Acceptance

- [ ] ReviewStep renderiza 4 bloques + brief-summary con datos correctos del GET.
- [ ] "Editar" en cada bloque navega al step correspondiente preservando el wizard.
- [ ] "Ver brief" abre `/campaigns/$id/brief`.
- [ ] "Activar" envía `Idempotency-Key` UUID v4 + `configuration_version`; al éxito redirige a `/campaigns/$id` y la lista refleja status active.
- [ ] Replay manual: forzar segundo POST con misma key + body en E2E retorna 200 cacheado (backend gate); UI no debe mostrar error.
- [ ] 409 `configuration_version_conflict`: banner aparece, query reload, botón Activar vuelve a estar disponible.
- [ ] 409 `configuration_incomplete`: redirect al `current_step`.
- [ ] Unit tests para mapping de error code → acción.
- [ ] E2E: completar wizard end-to-end, activar, verificar redirect + status.
- [ ] Validación visual desktop dark ≥95% match contra `C3Bh8V`.

## Done summary
BC violation corregida: useActiveCampaigns movido a shared/api/, todos los consumidores actualizados, imports en ReviewStep desde shared. Sin problemas nuevos.
## Evidence
- Commits:
- Tests:
- PRs: