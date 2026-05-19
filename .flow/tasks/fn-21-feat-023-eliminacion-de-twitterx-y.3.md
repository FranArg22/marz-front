---
satisfies: [R2, R6]
---

## Description

Limpiar Twitter/X y Twitch de todos los maps, cards, selects y formatters de plataforma visibles en deliverables, offers, campaign detail y DS playground.

**Size:** M
**Files:** `src/features/deliverables/types.ts`, `src/features/deliverables/components/DeliverableCard.tsx`, `src/features/deliverables/components/DeliverableListItem.tsx`, `src/features/deliverables/components/ExpectedDeliverableSlot.tsx`, `src/features/offers/components/OfferCard.tsx`, `src/features/campaigns/detail/CampaignVideosGrid.tsx`, `src/features/campaigns/detail/CampaignCreatorsTable.tsx`, `src/features/campaigns/detail/videos/VideosFilters.tsx`, `src/features/campaigns/detail/creators/CreatorsFilters.tsx`, `src/shared/utils/format.ts`, `src/routes/ds.tsx`, tests cercanos.

## Approach

- Remover claves `x`, `twitch` y `twitter_x` usadas como plataforma en maps/icons/selects.
- Revisar `src/features/deliverables/types.ts` junto con los componentes para eliminar cualquier unión local o vista UI que todavía admita plataformas heredadas.
- Quitar imports `Twitter` y `Twitch` de `lucide-react` que queden huérfanos.
- Ajustar tests de filters para que las opciones visibles sean sólo Instagram, TikTok y YouTube.
- Ajustar tests de deliverables/offers/campaign detail afectados por snapshots o props tipadas.

## Investigation targets

**Required**
- `src/features/campaigns/detail/videos/VideosFilters.tsx:61` — options legadas en videos.
- `src/features/campaigns/detail/creators/CreatorsFilters.tsx:54` — options legadas en creators.
- `src/features/campaigns/detail/CampaignVideosGrid.tsx:83` — map de iconos.
- `src/features/campaigns/detail/CampaignCreatorsTable.tsx:78` — map de iconos.
- `src/features/deliverables/types.ts` — tipos/vistas locales que pueden envolver DTOs generados.
- `src/features/deliverables/components/DeliverableCard.tsx:38` — map de plataforma.
- `src/features/deliverables/components/DeliverableListItem.tsx:37` — map de plataforma.
- `src/features/deliverables/components/ExpectedDeliverableSlot.tsx:12` — map de plataforma.

**Optional**
- `src/features/offers/components/OfferCard.tsx:21` — union local de plataforma.
- `src/shared/utils/format.ts:5` — formatter global.
- `src/routes/ds.tsx:528` — DS playground.

## Design context

No introducir nuevos componentes. Mantener densidad visual y copy existente para Instagram, TikTok y YouTube; sólo remover opciones y ramas obsoletas.

## Key context

El grep inicial encontró también usos de `"x"` en tests no relacionados como dato arbitrario. No bloquear por esos casos salvo que el contexto sea plataforma.

## Acceptance

- [ ] No quedan opciones visibles X/Twitch en filters de campaign videos/creators.
- [ ] `src/features/deliverables/types.ts` no conserva unions, aliases ni wrappers que permitan `x`, `twitch` o `twitter_x` como plataforma.
- [ ] DeliverableCard, DeliverableListItem, ExpectedDeliverableSlot, OfferCard, CampaignVideosGrid y CampaignCreatorsTable compilan con sólo las 3 plataformas oficiales.
- [ ] `src/shared/utils/format.ts` y `src/routes/ds.tsx` no exponen labels/values legados.
- [ ] Tests cercanos de filters/cards actualizados; `pnpm test -- VideosFilters CreatorsFilters DeliverableCard CampaignVideosGrid CampaignCreatorsTable` pasa o documenta tests no existentes.
- [ ] `pnpm lint` no reporta imports huérfanos de `lucide-react` por esta limpieza.

## Done summary

_To be filled by the DEV agent when completing the task._

## Evidence

_To be filled by the DEV agent with commands, outputs, screenshots or blockers._