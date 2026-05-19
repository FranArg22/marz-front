---
satisfies: [R1, R6]
---

## Description

Regenerar el cliente Orval contra el backend dev que ya tenga FEAT-023 B.8/B.9 aplicado. Este task es el proof point del epic: si el OpenAPI aún expone `x`, `twitch` o `twitter_x`, no avanzar con limpieza UI.

**Size:** S
**Files:** `src/shared/api/generated/**`, `src/shared/api/test-generated/**` si `pnpm api:sync` lo toca, archivos de configuración generada que Orval actualice.

## Approach

- Confirmar con backend que el OpenAPI dev ya removió `x`, `twitch`, `twitter_x` y el discriminator mapping viejo.
- Ejecutar `pnpm api:sync` (`package.json:29`).
- Revisar el diff generado antes de tocar consumidores: los tipos de plataforma deben quedar en 3 valores y attribution sin `twitter_x`.
- Ejecutar `pnpm typecheck` para capturar consumidores obsoletos que quedan para las tasks siguientes.

## Investigation targets

**Required**
- `package.json:17-30` — scripts disponibles para sync y checks.
- `scripts/sync-api.ts` — confirma de dónde toma el OpenAPI y qué directorios regenera.
- `src/shared/api/generated/model/` — tipos Orval principales de runtime.
- `src/shared/api/test-generated/model/` — tipos del cliente test si el sync también los actualiza.

**Optional**
- `orval.config.ts` — convenciones de generación si el diff sale inesperado.

## Key context

FEAT-023 frontend no debe editar OpenAPI manualmente. Si `pnpm api:sync` no refleja el contrato esperado, el bloqueo es backend B.8/B.9, no un fix local.

## Acceptance

- [ ] `pnpm api:sync` completó sin errores contra backend dev FEAT-023.
- [ ] Tipos/schemas generados de plataforma sólo aceptan `instagram`, `tiktok`, `youtube`.
- [ ] Tipos/schemas generados de attribution ya no incluyen `twitter_x`.
- [ ] `pnpm typecheck` fue ejecutado y sus errores restantes, si existen, apuntan sólo a consumidores legados que cubren tasks `.2`, `.3` o `.4`.

## Done summary
Gates corregidas: consumidores migrados a SocialPlatform, X/Twitch removidos de UI params/options y marzTest apunta al test spec local para regenerar endpoints E2E.
## Evidence
- Commits:
- Tests:
- PRs: