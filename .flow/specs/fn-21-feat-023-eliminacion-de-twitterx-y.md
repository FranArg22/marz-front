# FEAT-023: Eliminación de Twitter/X y Twitch — Frontend

## Overview

Retirar Twitter/X, Twitch y `twitter_x` del frontend de `marz-front` después de que backend publique el OpenAPI de FEAT-023. No cambian rutas TanStack Router ni se agregan endpoints: el trabajo es regenerar Orval, dejar que TypeScript exponga consumidores obsoletos, limpiar maps/selects/iconos/copys y mapear el nuevo 409 `campaign.no_supported_platforms` en la activación de campaign. Los datos históricos quedan del lado backend como registros heredados filtrados; el frontend no debe renderizar opciones nuevas para esos valores.

Spec fuente: `03-solution.md` de FEAT-023, secciones 4 y 7 filtradas por side `front`.

## Scope

In:
- `pnpm api:sync` contra backend dev luego de B.8/B.9, con `src/shared/api/generated/**` actualizado a `SocialPlatform = instagram | tiktok | youtube` y `AttributionSource` sin `twitter_x`.
- Limpieza de opciones, maps, iconos lucide e imports de Twitter/Twitch en deliverables, offers, campaign detail y playground DS.
- Onboarding brand B11 sin Twitter/X como fuente de atribución.
- Manejo UI del 409 `campaign.no_supported_platforms` en activación de campaign configuration, mostrando feedback inline cerca del botón de activar.
- Sweep final de referencias legadas en `src/**` no generado e i18n.

Out:
- Cambios backend, OpenAPI manual o mocks MSW.
- Nuevas rutas, nuevos hooks de negocio o nuevos endpoints.
- Migración de system events históricos; si un payload viejo aparece por error, se debe evitar crash pero no agregar opción visible al catálogo.

## Approach

1. Esperar a que backend FEAT-023 B.8 esté desplegado en dev y B.9 resuelto; recién ahí correr `pnpm api:sync`.
2. Usar el angostamiento de tipos generados como red de seguridad para remover claves legadas en UI.
3. Separar onboarding attribution, limpieza de plataforma y activación para minimizar solapamiento de archivos.
4. Cerrar con grep orientado a plataforma y suite estándar del repo.

Patrones a reusar:
- Orval sync: `package.json:29` (`pnpm api:sync`).
- Checks locales: `package.json:17-23` (`typecheck`, `test`, `test:e2e`, `lint`).
- Tests UI existentes con Testing Library + `vitest-axe`, por ejemplo `src/features/identity/onboarding/brand/screens/B11AttributionScreen.test.tsx:24` y filters de campaign detail.
- Activación de configuration actual en `src/features/campaigns/configuration/hooks.ts:214` y `src/features/campaigns/configuration/ReviewStep.tsx:129`.

## Quick commands

```bash
# Requiere backend dev con FEAT-023 B.8/B.9 ya resuelto
pnpm api:sync

# Checks frontend principales
pnpm lint && pnpm typecheck && pnpm test

# Smoke focalizado de flujos tocados
pnpm test:e2e -- onboarding campaign-configuration

# Sweep de literales legados en código no generado
rg -n 'twitter_x|Twitter|Twitch|"twitch"|"x"' src --glob '!src/shared/api/generated/**'
```

## Acceptance

- **R1:** El cliente Orval queda regenerado contra el OpenAPI FEAT-023: los tipos y schemas generados aceptan sólo `instagram`, `tiktok`, `youtube` para plataforma y no contienen `twitter_x` como fuente de atribución; `pnpm typecheck` no deja consumidores con unions antiguas.
- **R2:** Deliverables, offers, campaign detail, filters, DS playground y formatters dejan de mostrar o aceptar Twitter/X y Twitch; no quedan imports huérfanos de `Twitter`/`Twitch` desde `lucide-react`.
- **R3:** Onboarding brand B11 muestra exactamente las 7 fuentes soportadas, sin Twitter/X; sus tests cubren el conteo y el flujo referral/non-referral existente sigue funcionando.
- **R4:** La activación de campaign muestra el 409 `campaign.no_supported_platforms` como mensaje inline sobre/cerca del botón de activar y no cae en un error genérico; el caso queda cubierto con unit test del hook o del `ReviewStep`.
- **R5:** El sweep final no encuentra ocurrencias legadas relevantes en `src/**` no generado ni en catálogos i18n; excepciones permitidas sólo si el test documenta un caso negativo explícito y no representa una opción visible.
- **R6:** `pnpm lint`, `pnpm typecheck`, `pnpm test` y el smoke e2e focalizado de onboarding/configuration quedan verdes o, si el entorno no permite e2e, queda documentado el bloqueo exacto en el cierre de la task.

## Early proof point

Task `fn-21-feat-023-eliminacion-de-twitterx-y.1` valida el contrato real al regenerar Orval y correr typecheck. Si no aparecen tipos angostados o `api:sync` regenera contra un OpenAPI intermedio, parar antes de tocar UI y coordinar con backend B.8/B.9.

## Requirement coverage

| Req | Description | Task(s) | Gap justification |
|-----|-------------|---------|-------------------|
| R1 | Orval regenerado con enums angostados | fn-21-feat-023-eliminacion-de-twitterx-y.1 | — |
| R2 | Limpieza de plataformas en UI/maps/selects | fn-21-feat-023-eliminacion-de-twitterx-y.3 | — |
| R3 | Onboarding brand sin Twitter/X | fn-21-feat-023-eliminacion-de-twitterx-y.2 | — |
| R4 | 409 de activación mostrado inline | fn-21-feat-023-eliminacion-de-twitterx-y.4 | — |
| R5 | Sweep sin referencias legadas visibles | fn-21-feat-023-eliminacion-de-twitterx-y.5 | — |
| R6 | Checks frontend verdes | fn-21-feat-023-eliminacion-de-twitterx-y.1, .2, .3, .4, .5 | — |

## Dependencies and risks

- Depende de backend FEAT-023 B.8 desplegado en dev y B.9 resuelto; no correr `pnpm api:sync` contra OpenAPI intermedio.
- Depende de `fn-18-campaign-configuration-wizard-feat-019` para el flujo actual de configuration/activate que FEAT-023 ajusta.
- Riesgo: catálogos Lingui conservan msgids huérfanos; el sweep final debe incluir `src/shared/i18n/locales/**` y ejecutar extracción/compile sólo si el repo lo requiere.
- Riesgo: `"x"` aparece en tests no relacionados como dato arbitrario; filtrar por contexto plataforma antes de bloquear una task.

## References

- `package.json:17-23`, `package.json:29` — scripts de verificación y sync.
- `src/features/identity/onboarding/brand/types.ts:43` — enum local de attribution.
- `src/features/identity/onboarding/brand/screens/B11AttributionScreen.tsx:20` — opciones B11.
- `src/features/campaigns/detail/videos/VideosFilters.tsx:61` y `src/features/campaigns/detail/creators/CreatorsFilters.tsx:54` — filtros de plataforma.
- `src/features/campaigns/configuration/hooks.ts:214` y `src/features/campaigns/configuration/ReviewStep.tsx:129` — activación de campaign configuration.
- `src/shared/utils/format.ts:5`, `src/routes/ds.tsx:528` — referencias visibles finales a limpiar.
