---
satisfies: [R8]
---

## Description

Mostrar badge "Configuración pendiente" en el listado de campaigns para drafts con `configuration_complete=false`, y CTA que retoma el wizard en el `current_step` reportado por backend. Crear componente `ConfigurationPendingBadge` reusable y modificar `CampaignMiniCard` y la route `campaigns.index` para integrarlo.

**Size:** S/M
**Files:**

- `src/features/campaigns/configuration/components/ConfigurationPendingBadge.tsx` (nuevo)
- `src/features/campaigns/components/CampaignMiniCard.tsx` (modificar)
- `src/routes/_brand/campaigns.index.tsx` (modificar si necesita cambios en la query)

## Approach

- Verificar que el endpoint de listado de campaigns incluye `configuration_complete` y `configuration_current_step`. Si no, dos opciones:
  - (Preferido) backend lo agrega como campos opcionales en el response del list endpoint — coordinar con backend (`CreateCampaignResponse` ya menciona estos campos en spec §4.3); abrir issue/comentario si falta.
  - (Fallback) no agregar badge hasta que backend exponga; documentar como blocker en este task.
- `ConfigurationPendingBadge`: badge shadcn variant="warning" o equivalente con texto "Configuración pendiente".
- `CampaignMiniCard`: si `status==='draft' && !configuration_complete`, renderizar badge y cambiar el click handler/CTA primario a navegar a `/campaigns/$id/configuration/${configuration_current_step}` en vez de la vista normal.

## Investigation targets

**Required:**

- `src/features/campaigns/components/CampaignMiniCard.tsx` — estructura actual
- `src/routes/_brand/campaigns.index.tsx` — query de listado de campaigns
- `src/shared/api/generated/*` (post .1) — verificar fields disponibles en list response

## Design context

- **Badge:** rounded, color subtle `--warning` o `--accent`; texto compacto.
- **CampaignMiniCard:** badge se ubica al lado del status existente o debajo del título.
- **Tokens:** shadcn rounded.

Full design system: `src/styles.css`.

## Acceptance

- [ ] `ConfigurationPendingBadge` renderiza con copy correcto.
- [ ] `CampaignMiniCard` con `status='draft' && configuration_complete=false` muestra badge y CTA retomar.
- [ ] Click en draft incompleto navega a `/campaigns/$id/configuration/${current_step}`.
- [ ] Drafts completos (caso edge: completos pero no activados) NO muestran badge.
- [ ] Active campaigns no muestran badge.
- [ ] Unit test render condicional.
- [ ] E2E: dejar wizard a la mitad, ir a lista, ver badge, click, retomar en step correcto.

## Done summary

_Pending implementation._

## Evidence

_Pending implementation._
