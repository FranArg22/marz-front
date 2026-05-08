# FEAT-012 — App Shell · Sidebar & Topbar

## Overview

Implementa un `AppShell` desktop común para todas las rutas autenticadas post-onboarding en `marz-front`. Reemplaza `BrandShell`/`CreatorShell` legacy por un único shell parametrizado por `accountKind` (brand|creator) con sidebar icon-only fijo de 72px, topbar único de 56px con slots configurables, y navegación derivada por producto. No hay cambios de backend, datos, ni eventos: consume el `GET /v1/me` existente.

Spec fuente: `marz-docs/features/FEAT-012-app-shell-sidebar-topbar/03-solution.md`.

## Scope

In-scope (frontend `marz-front`):

- Componentes nuevos `AppShell`, `AppSidebar`, `AppSidebarItem`, `AppTopbar`, `TopbarContext` y config de navegación.
- Migración de `_brand.tsx`, `_creator.tsx`, `workspace.tsx` y rutas hijas a `AppShell`.
- Guards SSR/cliente sobre `MeResponse` (kind, onboarding_status, brand_workspace).
- Topbar contextual vía `useRouteTopbar` para Campaigns/Offers/Brief/Workspace.
- Eliminación de sidebars/headers legacy duplicados.
- Tests unitarios + integration de routing + smoke E2E + verificación visual contra `.pen`.

Out-of-scope:

- Backend `marz-api` (no hay tasks).
- Endpoints, eventos WS, eventos de dominio nuevos.
- Mobile shell, sidebar expandible, badges/contadores.
- Analytics del shell (Q12.6 — eliminados en MVP).
- Páginas Home propias para items disabled (`Inicio`, `Campaigns`, `Creators`, `Analytics` brand; `Inicio`, `Analytics` creator).

## Approach

1. Configuración + contrato de navegación primero (pure data) → permite testear sin UI.
2. Construir piezas presentacionales independientes (`AppSidebar`, `AppTopbar` + context) en paralelo.
3. Componer en `AppShell` y montar en `_brand`/`_creator`.
4. Endurecer guards y separación brand/creator (mismatch → `/workspace`; sin kind → `/auth`).
5. Migrar ruta común `/workspace` (Chats) para evitar doble shell.
6. Adaptar rutas existentes a `useRouteTopbar` y eliminar headers/sidebars duplicados.
7. Cierre A11y + visual smoke.

Reuse:

- `useMe` / `getServerMe` ya existentes (Identity).
- `BrandSessionContext` para datos de workspace.
- shadcn `Tooltip`, `lucide-react` icons (import por nombre para tree-shaking).
- Tokens del `.pen` mapeados ya en `src/styles.css`.

Patrones:

- Pathless route groups TanStack Router (`_brand.tsx`, `_creator.tsx`) con `beforeLoad` guard.
- Provider + `useRouteTopbar(config)` que registra config en mount y limpia en cleanup (evita estado stale).
- `resolveActiveSidebarItem(pathname)` centralizado, sin matching ingenuo.

## Quick commands

```bash
# Type check + tests unitarios
pnpm typecheck
pnpm test

# Smoke dev (verificación visual)
pnpm dev

# Lint
pnpm lint
```

## Acceptance

- **R1:** Todas las rutas autenticadas post-onboarding bajo `_brand`, `_creator` y `/workspace` montan un único `AppShell` (sidebar 72px icon-only + topbar 56px); no quedan `BrandShell`/`CreatorShell` renderizando aside propio.
- **R2:** `_brand` solo renderiza para `kind='brand'` y `_creator` solo para `kind='creator'`; mismatch redirige a `/workspace`; sin kind redirige a `/auth`; brand onboarded sin `brand_workspace` muestra pantalla "no tenés workspace, contactá soporte" sin redirigir a `/auth`.
- **R3:** Sidebar brand expone exactamente `home, workspace, inbox, campaigns, creators, analytics`; sidebar creator expone exactamente `home, workspace, inbox, analytics`. Habilitados MVP: `workspace`, `inbox` (ambos kinds). Resto disabled con tooltip "Próximamente", `aria-disabled="true"`, sin navegación efectiva.
- **R4:** `resolveActiveSidebarItem(pathname)` marca exactamente un item active para `/workspace` e `/inbox`; ninguno para rutas no principales; tests cubren cada caso.
- **R5:** `AppTopbar` único soporta variante base (Marz left) y variantes contextuales (back + title + progress + actions) sin cambiar altura ni desplazar contenido. `useRouteTopbar` resetea config al desmontar la ruta.
- **R6:** Ruta común `/workspace` monta `AppShell` una sola vez según `sessionKind`, conserva `validateSearch: workspaceSearchSchema` y no rompe `ConversationRail`/`WorkspaceLayout`/subscriptions de Chat existentes.
- **R7:** Rutas existentes (Campaigns, Offers, Brief Builder, Workspace) declaran su contenido contextual vía `useRouteTopbar`; ninguna duplica topbar/header del shell.
- **R8:** A11y verificada: items del sidebar tienen accessible name (sin label visible permanente); tooltip aparece en hover y focus; back action en topbar tiene accessible name y foco visible; navegación por teclado funcional.
- **R9:** Validación visual subjetiva contra nodos Pencil `eSXMq` (default), `ZEwxF` (active), `D0icl` (tooltip), `pB0OC` (topbar base) y variantes `fT0pK`, `5v7Tq`, `dTFk2`, `SJs5q`.
- **R10:** No se introducen nuevas rutas `_brand/workspace*` ni `_creator/workspace*` (colisionarían en path público `/workspace`); no se agregan endpoints, eventos ni `pnpm api:sync`.
- **R11:** No se loggean datos sensibles del shell (`email`, `full_name`, `brand_workspace.name`, `creator_profile.handle`); el shell no emite analytics propios en MVP.

## Early proof point

Task `fn-11-feat-012-app-shell-sidebar-topbar.4` (Componer AppShell en `_brand`/`_creator`) valida el approach completo: que un único shell parametrizado por `accountKind` reemplaza los shells legacy sin romper guards SSR/cliente ni el render del producto correcto. Si falla, re-evaluar antes de continuar con tasks 5-8 si conviene mantener shells separados o ajustar el contrato de `AppShell`.

## Requirement coverage

| Req | Description                                                                      | Task(s)                                                                                                                         | Gap justification |
| --- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| R1  | Único AppShell desktop en rutas autenticadas; sin BrandShell/CreatorShell legacy | fn-11-feat-012-app-shell-sidebar-topbar.4, fn-11-feat-012-app-shell-sidebar-topbar.6                                            | —                 |
| R2  | Separación brand/creator + guards mismatch + brand sin workspace                 | fn-11-feat-012-app-shell-sidebar-topbar.5                                                                                       | —                 |
| R3  | Items sidebar exactos por kind + disabled MVP + tooltip "Próximamente"           | fn-11-feat-012-app-shell-sidebar-topbar.1, fn-11-feat-012-app-shell-sidebar-topbar.2                                            | —                 |
| R4  | Active resolver centralizado                                                     | fn-11-feat-012-app-shell-sidebar-topbar.1, fn-11-feat-012-app-shell-sidebar-topbar.2                                            | —                 |
| R5  | AppTopbar único con slots + useRouteTopbar reset                                 | fn-11-feat-012-app-shell-sidebar-topbar.3                                                                                       | —                 |
| R6  | /workspace común con un solo AppShell                                            | fn-11-feat-012-app-shell-sidebar-topbar.6                                                                                       | —                 |
| R7  | Topbar contextual integrado en rutas existentes                                  | fn-11-feat-012-app-shell-sidebar-topbar.7                                                                                       | —                 |
| R8  | A11y completa                                                                    | fn-11-feat-012-app-shell-sidebar-topbar.2, fn-11-feat-012-app-shell-sidebar-topbar.3, fn-11-feat-012-app-shell-sidebar-topbar.8 | —                 |
| R9  | Verificación visual contra nodos `.pen`                                          | fn-11-feat-012-app-shell-sidebar-topbar.2, fn-11-feat-012-app-shell-sidebar-topbar.3, fn-11-feat-012-app-shell-sidebar-topbar.8 | —                 |
| R10 | Sin duplicar paths `/workspace` ni nuevos endpoints/eventos                      | fn-11-feat-012-app-shell-sidebar-topbar.6                                                                                       | —                 |
| R11 | Sin logs sensibles ni analytics del shell (Q12.6)                                | fn-11-feat-012-app-shell-sidebar-topbar.4, fn-11-feat-012-app-shell-sidebar-topbar.7                                            | —                 |

## References

- `marz-docs/features/FEAT-012-app-shell-sidebar-topbar/03-solution.md`
- `marz-docs/features/FEAT-012-app-shell-sidebar-topbar/02-spec.md`
- `marz-docs/architecture/technical/identity/api.md` (shape canónico `MeResponse`)
- `marz-docs/architecture/technical/shared/data-model.md` (`X-Brand-Workspace-Id`)
- `marz-design/marzv2.pen` (vía MCP pencil — nodos `eSXMq`, `ZEwxF`, `D0icl`, `pB0OC`, `fT0pK`, `5v7Tq`, `dTFk2`, `SJs5q`)
- `src/routes/_brand.tsx`, `src/routes/_creator.tsx`, `src/routes/workspace.tsx` (estado actual)
- `src/features/identity/components/BrandShell.tsx`, `CreatorShell.tsx`, `SidebarItem.tsx`, `SidebarTooltip.tsx` (legacy a reemplazar/adaptar)
- `src/features/identity/session/BrandSessionContext.tsx`, `useMe`, `getServerMe`
