---
satisfies: [R4, R9]
---

## Description

Overlay detail deep-linkeable via `?inviteId=`. Read-only; modos `actionable` (status='sent') y `historical` (terminal). Renderiza secciones del brief desde el snapshot del response — sin fan-out al backend de Campaigns. CTAs (accept/decline/open chat) sólo se muestran y wirean en .5 — esta task arma el shell, secciones y a11y.

**Size:** M
**Files:**

- `src/features/discovery/creator-invitations/InvitationDetailDialog.tsx`
- `src/features/discovery/creator-invitations/InvitationBriefSections.tsx` — objetivo, KPI, scoring, hard filters, disqualifiers, content, pricing, targeting, bonus
- `src/features/discovery/creator-invitations/__tests__/InvitationDetailDialog.test.tsx`
- (extender) `CreatorInvitationsPage.tsx` para abrir/cerrar el dialog según `?inviteId`

## Approach

- Dialog (shadcn/ui `Dialog`) que se abre cuando `searchParams.inviteId` existe; cerrar limpia el param. URL deep-linkeable: refrescar la página con `?inviteId=<id>` abre el overlay directo (con loading state).
- Data: `useCreatorInvitationDetailQuery(inviteId)`. Loading skeleton; error 404 → toast + cerrar; error 409 expired → mostrar contenido como `historical` con banner.
- Modo derivado: `actionable` ⇔ `invite.status === 'sent'`; `historical` ⇔ resto. Sin `detail_mode` del backend (Q15.9 eliminado).
- Secciones del brief: render condicional según campos disponibles. ICP (age range, genders, countries, platforms, interests) como chips/badges. Scoring dimensions con weight_pct. Hard filters parseados (genéricos: `filter_type` + `filter_value` JSON). Bonus: speed (windows) y performance (milestones). Pricing: USD-only (sin currency display).
- A11y: `role="dialog"`, focus trap (shadcn lo provee), ESC cierra, headings jerarquizados (h2 título, h3 secciones), labelled-by para screen readers.

## Investigation targets

**Required:**

- `src/features/discovery/creator-invitations/queries.ts` — `useCreatorInvitationDetailQuery`
- `marz-docs/features/FEAT-015-creator-invitations-and-offer-detail/03-solution.md` §3.3 — shapes de snapshots
- `marz-docs/features/FEAT-015-creator-invitations-and-offer-detail/03-solution.md` §4.1 — `CreatorInvitationDetailResponse`
- `src/components/ui/dialog.tsx` (shadcn) — patrón existente
- Algún Dialog ya implementado en el repo (ej. en `chat/` o `offers/`) para estilo

**Optional:**

- `marz-design/marzv2.pen` frame `rJPEq` — leer vía Pencil MCP

## Design context

Frame Pencil: `rJPEq` (detail overlay). Layout typically modal-side panel o full overlay según el frame. Headings con jerarquía clara, secciones separadas con dividers o spacing tokens. Chips/badges para platforms/genders/etc usan tokens `--secondary` o `--muted`. CTAs (accept primary, decline secondary) sólo placeholder visual aquí — wiring real en .5.

Tokens: usar `bg-background`, `border`, `text-muted-foreground`, etc. Radios generosos. Validación visual ≥95% contra `rJPEq` en dark.

Full design system: `marz-design/marzv2.pen` (Pencil MCP only).

## Key context

- Snapshots son **inmutables** — el detalle siempre muestra lo capturado al crear la invite, no el estado actual de la Campaign. Si Campaigns cambia el brief después, el creator ve lo original.
- 409 `invitation_expired` puede llegar entre list y detail — mapear a estado `historical` con banner "Esta invitación expiró".
- No hay backend `detail_mode` — derivarlo client-side de `invite.status`.

## Acceptance

- [ ] Click en card setea `?inviteId=<id>` y abre el dialog con loading skeleton.
- [ ] ESC, click backdrop, o botón cerrar limpian `?inviteId` y desmontan el dialog.
- [ ] Refrescar `/invitations?inviteId=<id>` abre el dialog directamente (deep link).
- [ ] Modo `actionable`: header muestra estado `Pendiente`, slots para CTAs visibles (placeholders aquí; wiring en .5).
- [ ] Modo `historical`: header muestra estado terminal correspondiente, sin CTAs de decisión.
- [ ] Secciones brief renderizan: objetivo, KPI, ICP, scoring (con weight_pct), hard filters, disqualifiers, content (deliverables), pricing (USD), targeting, bonus.
- [ ] 404 → toast error y cierre. 409 expired → modo `historical` con banner.
- [ ] A11y: focus trap activo, ESC cierra, headings h2/h3 estructurados, dialog labelled.
- [ ] Component test: render `actionable` vs `historical` con fixtures.
- [ ] E2E: abrir invite pendiente muestra slots de CTAs; aceptada muestra banner histórico sin CTAs.
- [ ] Validación visual Pencil ≥95% contra frame `rJPEq` en dark.
- [ ] `pnpm typecheck`, `pnpm test` pasan.

## Done summary

_(filled on completion)_

## Evidence

_(filled on completion)_
