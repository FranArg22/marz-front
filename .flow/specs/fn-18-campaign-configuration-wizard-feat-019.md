# Campaign Configuration Wizard (FEAT-019) — Frontend

## Overview

Implementar el wizard desktop de configuración operativa de Campaign en `marz-front` para los 5 pasos posteriores a confirmar el Brief: content type, pricing model, targeting, bonus y review/activación. El wizard se monta dentro del brand shell, persiste cada paso vía `PATCH` automático al avanzar (no hay "save draft"), maneja optimistic concurrency por `configuration_version`, soporta retomar drafts incompletos desde la lista, reconcilia vía WebSocket y dispara analytics. Backend (`marz-api`) entrega columnas + 6 endpoints + eventos WS — este epic asume contrato `03-solution.md` §4 disponible vía `pnpm api:sync` antes de empezar F.2.

Spec fuente: `marz-docs/features/FEAT-019-campaign-configuration-wizard/03-solution.md`.

## Scope

In:

- Routes TanStack Router del wizard bajo `_brand/campaigns.$campaignId.configuration*`.
- Componentes de los 5 steps + footer + shell + badge "Configuración pendiente".
- Hooks de query/mutation contra los 6 endpoints (`GET/configuration`, `PATCH/{step}`, `POST/activate`).
- Inyección de `Idempotency-Key` (UUID v4 por mutación) y `X-Brand-Workspace-Id` desde `mutator.ts`.
- WS subscriptions a `campaign.configuration.updated` / `campaign.configuration.activated` con invalidación de TanStack Query.
- Analytics events (started, step_completed, activated, abandoned).
- Validación visual desktop dark contra Pencil refs `g8nDly`, `QPmTt`, `uQqif`, `kI2DY`, `C3Bh8V`.

Out:

- Backend `marz-api` (otro repo, otro epic).
- Light variant del wizard (depende de que diseño publique referencia en Pencil).
- Mobile/responsive del wizard (desktop only en MVP).
- Edición de configuración post-activación (vive en Campaign detail, fuera de FEAT-019).

## Approach

1. **F.1 API sync + schemas**: regenerar Orval client tras backend dev y crear Zod adapters locales para form-level validation.
2. **F.2 Routes + shell**: route protegida `$campaignId.configuration` con loader que GETea config y enruta al `current_step`; respeta `block_reason`.
3. **F.3-F.5 Steps**: implementar content_type/pricing (cards), targeting (form prefill desde Brief), bonus (rows agregables), cada uno con su mutation y persistencia automática al continuar.
4. **F.6 Review + activate**: resumen editable y activación con `Idempotency-Key`, manejando 409 conflict.
5. **F.7 Pending badge**: enlazar listado de campaigns con drafts incompletos.
6. **F.8 WS + analytics**: reconciliación vía hub WS existente y tracking fire-and-forget.

Patrones a reusar:

- `BriefBuilderWizard.tsx` (pattern de wizard multi-step con TanStack Form + persistencia por paso).
- `src/shared/api/mutator.ts` (header injection para auth/workspace; extender para `Idempotency-Key`).
- `src/shared/ws/handlers.ts` + `useWebSocket.ts` (hub tipado con `DomainEventEnvelope`).
- `CampaignMiniCard.tsx` para el badge.

## Quick commands

```bash
# Sync API tipos desde backend dev
pnpm api:sync

# Lint + typecheck + tests
pnpm lint && pnpm typecheck && pnpm test

# Smoke test E2E del flujo completo
pnpm test:e2e -- campaign-configuration

# Dev server para validación visual
pnpm dev
```

## Acceptance

- **R1:** Tras confirmar el Brief, el brand admin es redirigido al wizard en `/campaigns/$id/configuration/content_type` y puede completar los 5 pasos persistiendo cada uno al avanzar.
- **R2:** Cada `Continuar` envía `PATCH` con `configuration_version` actual e `Idempotency-Key`; al recibir respuesta el cliente actualiza la query cache y avanza al `current_step` retornado por backend.
- **R3:** El paso Targeting muestra prefill desde Brief (`countries`, `genders`, `age_*`, `interests`) y permite ajustar sin mutar el Brief; ranges inválidos (follower/age) bloquean el botón Continuar con error inline.
- **R4:** El paso Bonus permite togglear secciones, agregar/editar/borrar speed windows y performance milestones; al deshabilitar una sección las filas se limpian; valores fuera de rango (`bonus_pct` 1-100, `window_hours` 1-720) muestran error inline.
- **R5:** El Review muestra todos los bloques con CTA "Editar" que regresa al paso correcto; "Activar" llama `POST /configuration/activate` con `Idempotency-Key`, redirige a Campaign detail y refleja `status='active'`.
- **R6:** Si llega `409 configuration_version_conflict` (otra sesión avanzó), el front recarga la latest configuration y muestra banner reconciliando antes de re-intentar.
- **R7:** Replay de la activación con la misma `Idempotency-Key` y mismo body devuelve la response cacheada (200) sin doble efecto; misma key con body distinto muestra error 409.
- **R8:** El listado de campaigns muestra badge "Configuración pendiente" en drafts con `configuration_complete=false` y CTA que retoma en el `current_step` reportado por backend.
- **R9:** Los WS events `campaign.configuration.updated` / `campaign.configuration.activated` invalidan la query y, en su caso, redirigen; no se duplican analytics events en replay.
- **R10:** Validación visual desktop dark ≥95% match contra Pencil refs `g8nDly` (S1), `QPmTt` (S2), `uQqif` (S3), `kI2DY` (S4), `C3Bh8V` (S5).
- **R11:** Analytics dispara `campaign_configuration_started` al entrar al wizard, `..._step_completed` por paso, `..._activated` al activar, `..._abandoned` al cerrar el tab/route sin activar.

## Early proof point

Task `fn-18-campaign-configuration-wizard-feat-019.2` (Routes + shell del wizard) valida que el contrato real del backend está consumible vía Orval, que el loader resuelve el GET con headers correctos (`X-Brand-Workspace-Id`), y que el routing por `current_step` funciona sin código de cada step todavía. Si falla — típicamente por desalineación de OpenAPI o headers — re-evaluar `pnpm api:sync` y `mutator.ts` antes de seguir con F.3+.

## Requirement coverage

| Req | Description                              | Task(s)                                                        | Gap justification |
| --- | ---------------------------------------- | -------------------------------------------------------------- | ----------------- |
| R1  | Redirección post-Brief y wizard 5 pasos  | fn-18-campaign-configuration-wizard-feat-019.2, .3, .4, .5, .6 | —                 |
| R2  | PATCH por paso con version + idempotency | fn-18-campaign-configuration-wizard-feat-019.1, .3, .4, .5     | —                 |
| R3  | Targeting prefill desde Brief            | fn-18-campaign-configuration-wizard-feat-019.4                 | —                 |
| R4  | Bonus rows con validación                | fn-18-campaign-configuration-wizard-feat-019.5                 | —                 |
| R5  | Review + activate flow                   | fn-18-campaign-configuration-wizard-feat-019.6                 | —                 |
| R6  | Manejo de version_conflict 409           | fn-18-campaign-configuration-wizard-feat-019.6, .8             | —                 |
| R7  | Idempotency replay correcto              | fn-18-campaign-configuration-wizard-feat-019.1, .6             | —                 |
| R8  | Pending badge en lista                   | fn-18-campaign-configuration-wizard-feat-019.7                 | —                 |
| R9  | WS reconciliation sin duplicar analytics | fn-18-campaign-configuration-wizard-feat-019.8                 | —                 |
| R10 | Validación visual Pencil ≥95% dark       | fn-18-campaign-configuration-wizard-feat-019.3, .4, .5, .6     | —                 |
| R11 | Analytics tracking 4 events              | fn-18-campaign-configuration-wizard-feat-019.8                 | —                 |

## References

- Spec fuente: `marz-docs/features/FEAT-019-campaign-configuration-wizard/03-solution.md`
- Pencil refs: `g8nDly`, `QPmTt`, `uQqif`, `kI2DY`, `C3Bh8V`
- Patrón de wizard previo: `src/features/campaigns/brief-builder/BriefBuilderWizard.tsx`
- Mutator HTTP: `src/shared/api/mutator.ts`
- WS hub: `src/shared/ws/handlers.ts`, `src/shared/ws/useWebSocket.ts`
