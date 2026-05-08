---
satisfies: [R3, R9]
---

## Description

Modificar el panel lateral derecho (`BrandContextPanel/V2`, `BrandContextPanel/V2/Expanded`, `BrandContextPanel/V2/MultiStage`, `CreatorContextPanel`) y `Card/Deliverable` para mostrar el estado del deliverable y la URL del link cuando aplica, y refrescarlo en vivo via WS `deliverable.updated` (con payload extendido `current_link`).

**Size:** M
**Files:**

- `src/features/deliverables/components/BrandContextPanelDeliverable.tsx` (modificar)
- `src/features/deliverables/components/CreatorContextPanelDeliverable.tsx` (modificar)
- `src/features/deliverables/components/DeliverableCard.tsx` (modificar — `Card/Deliverable` zcddo)
- `src/shared/ws/handlers/deliverableUpdated.ts` (modificar o crear — extender payload con `current_link`)
- Tests RTL + E2E con dos browsers

## Approach

- Slot por deliverable en el panel:
  - `link_submitted` → URL clickable + label "Link submitted".
  - `link_approved` / `completed` → badge "Link approved" + URL clickable.
  - `draft_approved` y caller=creator y stage no locked → botón inline "Submit link" (abre sidesheet de task .3).
- `Card/Deliverable`: badge de estado + URL si aplica (mismas reglas que panel).
- Handler WS de `deliverable.updated`:
  - `setQueryData(['deliverable', payload.deliverable.id], payload.deliverable)`.
  - Si `payload.current_link` viene → upsert en `['deliverable', id, 'links']` (reemplazar entry existente del mismo `link_id` o pushear si nuevo).
  - Idempotente: ignorar si `payload.deliverable.updated_at < cached.updated_at`.

## Design context

- Frames Pencil: `Lh0UU`/`F5oKK`, `iqvJx`/`olo8n`, `XXkhA`/`yJHY6`, `Vhl85`/`Gzfb7` — los 4 panels en sus estados con link.
- Tokens shadcn: badges con `--success-foreground` o equivalente para "Link approved"; `--muted` para estado neutro.
- Light + dark.

## Investigation targets

**Required:**

- `src/shared/ws/useWebSocket.ts` — uso de `DomainEventEnvelope<T>`
- `src/features/deliverables/components/BrandContextPanel*.tsx`, `CreatorContextPanel*.tsx` — paneles existentes
- `src/features/deliverables/components/DeliverableCard.tsx` (zcddo) — card existente

**Optional:**

- Handlers WS existentes (FEAT-005/007) como patrón

## Acceptance

- [ ] E2E con dos browsers: brand abre conversation, creator submit link → brand ve panel actualizar a `link_submitted` con URL en <2s sin refresh.
- [ ] E2E: aprobar link → ambos browsers ven badge "Link approved" + URL en <2s.
- [ ] Validación visual ≥95% contra los 4 frames de panel (estados con link).
- [ ] Botón "Submit link" oculto si caller no es creator del deliverable (snapshot por rol).
- [ ] Update WS idempotente: re-emisión del mismo `updated_at` no causa re-render (verificable con counter en test).
- [ ] `current_link` upserted correctamente en `['deliverable', id, 'links']`.

## Done summary

_To fill at completion._

## Evidence

- Commits:
- Tests:
- PRs:
