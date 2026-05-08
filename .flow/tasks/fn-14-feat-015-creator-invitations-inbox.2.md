---
satisfies: [R1]
---

## Description

Crear la ruta `_creator/invitations.tsx` con `validateSearch` Zod, agregar el item `Invitaciones` (icono `Inbox` lucide) al sidebar `CreatorShell`. La ruta arranca con un placeholder simple (la grilla viene en .3); aquí lo crítico es shell visible + guards correctos + deep-link search params.

**Size:** S/M
**Files:**

- `src/routes/_creator/invitations.tsx` — route definition + validateSearch
- `src/features/identity/components/CreatorShell.tsx` — agregar nav item
- `src/features/discovery/creator-invitations/CreatorInvitationsPage.tsx` — placeholder con título y outlet del search params para tests
- `src/routes/_creator/__tests__/invitations.test.tsx` (o test colocado donde el repo ya use)

## Approach

- Reusar el patrón de rutas creator existente: ver `_creator.tsx` pathless route group y otras rutas hermanas (`_creator/offers.tsx` si existe, sino la estructura base de FEAT-003 fn-3).
- `validateSearch` con Zod (ya hay schemas en otras rutas — seguir el mismo estilo). Defaults: `{status: 'all', q: undefined, inviteId: undefined}`. Status enum: `'all'|'sent'|'accepted'|'declined'|'expired'`.
- Sidebar: ítem ordenado según convención existente del shell (ver task fn-11). Icono `Inbox` de `lucide-react`. Active state cuando `pathname.startsWith('/invitations')`. En modo collapsed mostrar tooltip con el label.
- Guards: el route group `_creator` ya valida `account.kind='creator'` y onboarded. NO duplicar lógica — apoyarse en la existente. Si onboarding incompleto, el guard padre redirige (ya cubierto por fn-1).

## Investigation targets

**Required:**

- `src/routes/_creator.tsx` — pathless route group + guards
- `src/features/identity/components/CreatorShell.tsx` — sidebar items pattern
- `src/routes/_creator/` — rutas hermanas como referencia
- `marz-docs/features/FEAT-015-creator-invitations-and-offer-detail/03-solution.md` §7.1 — search params shape

**Optional:**

- `src/routes/__root.tsx` — registración global (probablemente no requiere cambios)

## Design context

Sidebar item: usar tokens del `.pen` ya mapeados en `styles.css` (no hardcodear). Ítem activo respeta el lenguaje visual redondeado (radios generosos). Icono `Inbox` 16px o 20px según convención del shell existente (consultar `CreatorShell.tsx`).

Full design system: `marz-design/marzv2.pen` (frames del shell ya validados en fn-11).

## Acceptance

- [ ] Navegando a `/invitations` como creator onboarded renderiza la página placeholder sin errores.
- [ ] Brand user → 404 o redirect según el guard existente del `_creator` group (no debe acceder).
- [ ] Creator no-onboarded → redirect a onboarding (cubierto por guard padre).
- [ ] `validateSearch` rechaza `status` inválido y cae al default `all` (test).
- [ ] Search params `inviteId` aceptado como string opcional, `q` como string opcional trimmed.
- [ ] Sidebar muestra item `Invitaciones` con icono `Inbox`, active state correcto en `/invitations`.
- [ ] Modo collapsed: tooltip con label visible al hover.
- [ ] `pnpm typecheck` y `pnpm test` pasan.

## Done summary

_(filled on completion)_

## Evidence

_(filled on completion)_
