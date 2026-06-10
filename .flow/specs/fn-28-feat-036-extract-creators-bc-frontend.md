# FEAT-036 Extract creators BC — Frontend

## Contexto

FEAT-036 es un refactor backend que extrae el BC `creators` del BC `identity`. No agrega features visibles al usuario; reorganiza ownership de tablas y código en el backend.

**No hay pantallas nuevas ni rutas nuevas en frontend.**

El único trabajo frontend es:
1. Regenerar el cliente API contra el backend con FEAT-036 aplicado (`pnpm api:sync`).
2. Adaptar el código existente al nuevo contrato (si hay breaking changes).
3. Committear y verificar quality gates.

## Cambio en el contrato observado tras api:sync

`CampaignDetailResponse` perdió el campo `version` (integer). Antes era required, ahora no existe.

- `Campaign` (response de `createCampaign`/`updateCampaign`) sigue teniendo `version`.
- No hay endpoint `GET /campaigns/{id}` que devuelva `Campaign` con version — solo `PATCH`.
- Esto rompe `CampaignInlineEditor.saveField`: la función bloquea el save cuando `version` es `undefined`.

## Tasks

- F.1 — Commit api:sync + fix CampaignInlineEditor (eliminar guard de version, manejar If-Match sin version)
