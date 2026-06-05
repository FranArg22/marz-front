---
satisfies: [R9]
---

# fn-27-feat-034-unified-campaign-creation.11 F.11 — Listado: gating CTA Nueva campaña por quota

## Description

Modificar la página de listado de campaigns (`src/routes/_brand/campaigns.index.tsx`) para deshabilitar el CTA "Nueva campaña" cuando la quota del plan no permite crear más campaigns.

**Size:** S

**Archivos a modificar:**

- `src/routes/_brand/campaigns.index.tsx`

## Approach

1. Obtener `workspaceId` del contexto de sesión (mismo patrón que otros componentes que lo usan — verificar cómo se accede en `src/routes/_brand/campaigns.index.tsx` o en componentes hermanos).
2. Llamar `useCampaignQuotaQuery(workspaceId)`.
3. Cuando `quota.data?.can_create_more === false`:
   - El botón "Nueva campaña" está disabled.
   - Mostrar tooltip explicativo al hacer hover: "Alcanzaste el límite de tu plan ([plan]). Para crear más campañas, [link a billing]."
   - Mostrar CTA secundario "Ver planes" que navega a `/billing`.

Cuando `quota.isLoading`: el botón se mantiene habilitado (no bloquear mientras carga).
Cuando `quota.isError`: el botón se mantiene habilitado (fail open — no penalizar por error de quota).

## Acceptance

- [ ] Con `can_create_more: true` (o query loading/error), el CTA "Nueva campaña" está habilitado.
- [ ] Con `can_create_more: false`, el botón está disabled.
- [ ] Con `can_create_more: false`, un tooltip o texto inline explica el motivo + link a billing.
- [ ] Tests unit: CTA habilitado cuando `can_create_more=true`; CTA disabled cuando `can_create_more=false`; CTA habilitado cuando la query está en loading.
- [ ] E2E con quota mockeada: `can_create_more: false` → CTA disabled visible.
- [ ] `pnpm typecheck` pasa.

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
