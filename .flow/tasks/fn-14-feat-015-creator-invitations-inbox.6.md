---
satisfies: [R8, R10]
---

## Description

Cierre: analytics tracking según spec, polish final (loading skeletons, responsive desktop min widths, copy review), regression test pass, verificación de no-commit de generated code.

**Size:** S/M
**Files:**

- `src/features/discovery/creator-invitations/analytics.ts`
- (extender) `src/shared/analytics/track.ts` — declarar event names tipados si el repo usa enum
- (touch-ups) componentes de .3, .4, .5 con calls a tracker
- `.gitignore` — verificar que `src/shared/api/generated/` siga excluido (no agregar, solo verificar)

## Approach

- Eventos de spec (todos con atributos `invite_id`, `campaign_id`, `brand_workspace_id`, `status`):
  - `creator_invitation_viewed` — disparado cuando una card entra al viewport (IntersectionObserver) o al primer render del listado para invites visibles. Definir cuál: usar primer render del set visible (más simple, bajo costo, alineado con tracking de listas existente).
  - `creator_invitation_detail_opened` — al abrir el dialog (incluyendo deep link).
  - `creator_invitation_accepted` — en mutation success.
  - `creator_invitation_declined` — en mutation success.
  - `creator_invitation_chat_opened` — al click "Abrir chat" CTA.
- Polish:
  - Loading skeletons consistentes (cards, detail, tabs counts).
  - Min widths desktop: 1280px diseño primario; degradar gracefully a ≥1024 (la spec es desktop-only en MVP).
  - Copy review contra `02-spec.md` y glosario `marz-docs/glossary.md`.
  - Verificar que no se introdujo Zustand store nuevo (R10 implícito).
- Regression: correr `pnpm typecheck`, `pnpm test`, `pnpm test:e2e` completo. Verificar features tocadas que no rompan (CreatorShell, ruta `_creator`).

## Investigation targets

**Required:**

- `src/shared/analytics/track.ts` — patrón existente de tracking
- `marz-docs/features/FEAT-015-creator-invitations-and-offer-detail/02-spec.md` — events exactos y atributos
- `marz-docs/glossary.md` — términos correctos (`Invite`, `Campaign`, etc.)
- `.gitignore` — verificar exclusión de generated

**Optional:**

- Otras features con tracking ya implementado (ej. `chat/` o `offers/`)

## Key context

- Generated code de Orval **no se commitea**. Si aparece en `git status` después de `pnpm api:sync`, agregar a `.gitignore` (no debería ser necesario — ya está cubierto, pero verificar).
- Glosario manda sobre copy: si la spec dice "Invitaciones" usarlo, no "Invites" en UI.
- IntersectionObserver `viewed` event: throttle / dedupe per session para no spamear con scrolls.

## Acceptance

- [ ] Los 5 eventos de analytics se emiten en los puntos correctos con los atributos requeridos (test con spy en tracker).
- [ ] `viewed` event se emite una vez por invite por sesión de página (dedupe verificado).
- [ ] Loading skeletons aparecen en list, detail y tabs counts durante fetch.
- [ ] Layout desktop ≥1280px se ve según frames; ≥1024 no rompe (sin layout shift mayor).
- [ ] Copy de UI alineado con `glossary.md` y `02-spec.md` (review manual + lint si hay i18n keys).
- [ ] `git status` después de build limpio: ningún archivo de `src/shared/api/generated/**` rastreado.
- [ ] No hay nuevo Zustand store en la feature (grep `create<` o `defineStore` en `src/features/discovery/creator-invitations/`).
- [ ] `pnpm typecheck` clean.
- [ ] `pnpm test` clean (sin tests fallando o rotos en otras features).
- [ ] `pnpm test:e2e -- creator-invitations` clean.
- [ ] Smoke manual: navegación end-to-end completa (sidebar → list → tab → search → detail → accept → chat) sin errores en consola.

## Done summary

_(filled on completion)_

## Evidence

_(filled on completion)_
